import { PrismaClient } from '@prisma/client'
import { SessionDetails, SessionService } from './session-service'

const prisma = new PrismaClient()

export interface NotificationTemplate {
  id: string
  type: NotificationType
  subject: string
  body: string
  variables: string[]
}

export enum NotificationType {
  SESSION_REMINDER_60 = 'session_reminder_60',
  SESSION_REMINDER_10 = 'session_reminder_10',
  SESSION_STARTED = 'session_started',
  SESSION_CANCELLED = 'session_cancelled',
  CHECKIN_REMINDER = 'checkin_reminder',
  MATCH_FOUND = 'match_found',
  WAITLIST_TIMEOUT_WARNING = 'waitlist_timeout_warning',
  WAITLIST_TIMEOUT_EXPIRED = 'waitlist_timeout_expired'
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms?: boolean
  quietHours?: {
    start: string // HH:MM format
    end: string   // HH:MM format
  }
}

export interface NotificationData {
  userId: string
  type: NotificationType
  templateData: Record<string, unknown>
  scheduledFor?: Date
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export interface NotificationDelivery {
  id: string
  userId: string
  type: NotificationType
  channels: ('email' | 'push' | 'sms')[]
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  sentAt?: Date
  failureReason?: string
  templateData: Record<string, unknown>
}

export class NotificationService {
  private sessionService: SessionService

  constructor() {
    this.sessionService = new SessionService()
  }

  /**
   * Send session reminder notifications
   */
  async sendSessionReminders(reminderType: 'T-60' | 'T-10'): Promise<void> {
    try {
      const sessions = await this.sessionService.getSessionsNeedingReminders(reminderType)
      
      for (const session of sessions) {
        await this.sendSessionReminderNotifications(session, reminderType)
        await this.sessionService.markReminderSent(session.id, reminderType)
      }
    } catch (error) {
      console.error(`Error sending ${reminderType} reminders:`, error)
      throw new Error(`Failed to send ${reminderType} reminders`)
    }
  }

  /**
   * Send reminder notifications to all pod members for a session
   */
  private async sendSessionReminderNotifications(
    session: SessionDetails, 
    reminderType: 'T-60' | 'T-10'
  ): Promise<void> {
    const notificationType = reminderType === 'T-60' 
      ? NotificationType.SESSION_REMINDER_60 
      : NotificationType.SESSION_REMINDER_10

    const templateData = {
      sessionId: session.id,
      podId: session.podId,
      scheduledAt: session.scheduledAt,
      sprintType: session.pod.sprintType,
      sessionNumber: session.sessionNumber,
      videoUrl: session.videoMeeting?.url,
      minutesUntil: reminderType === 'T-60' ? 60 : 10
    }

    // Send notification to each pod member
    for (const membership of session.pod.memberships) {
      await this.sendNotification({
        userId: membership.userId,
        type: notificationType,
        templateData: {
          ...templateData,
          userName: membership.user.name || membership.user.email,
          userTimezone: membership.user.timezone
        },
        priority: reminderType === 'T-10' ? 'high' : 'normal'
      })
    }
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(data: NotificationData): Promise<NotificationDelivery> {
    try {
      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          email: true,
          timezone: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Default preferences since we can't access user.preferences yet
      const preferences: NotificationPreferences = {
        email: true,
        push: true,
        sms: false
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences, user.timezone)) {
        // Reschedule for after quiet hours unless urgent
        if (data.priority !== 'urgent') {
          const rescheduledTime = this.calculateNextAvailableTime(preferences)
          return this.scheduleNotification({ ...data, scheduledFor: rescheduledTime })
        }
      }

      // Determine delivery channels
      const channels: ('email' | 'push' | 'sms')[] = []
      if (preferences.email) channels.push('email')
      if (preferences.push) channels.push('push')
      if (preferences.sms && data.priority === 'urgent') channels.push('sms')

      // Create notification record
      const notification = await (prisma as unknown as { notification: { create: (data: { data: unknown }) => Promise<{ id: string; userId: string; type: string; templateData: unknown; priority: string }> } }).notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          channels: JSON.stringify(channels),
          status: 'pending',
          templateData: data.templateData,
          priority: data.priority
        }
      })

      // Send via each channel
      await this.deliverNotification(notification, user.email, channels)

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        channels,
        status: 'sent',
        sentAt: new Date(),
        templateData: notification.templateData as Record<string, unknown>
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      throw new Error('Failed to send notification')
    }
  }

  /**
   * Schedule a notification for later delivery
   */
  private async scheduleNotification(data: NotificationData): Promise<NotificationDelivery> {
    const notification = await (prisma as unknown as { notification: { create: (data: { data: unknown }) => Promise<{ id: string; userId: string; type: string; channels: string; templateData: unknown }> } }).notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        channels: JSON.stringify(['email', 'push']), // Default channels
        status: 'pending',
        templateData: data.templateData,
        priority: data.priority,
        scheduledFor: data.scheduledFor
      }
    })

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      channels: JSON.parse(notification.channels) as ('email' | 'push' | 'sms')[],
      status: 'pending',
      templateData: notification.templateData as Record<string, unknown>
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences, timezone: string): boolean {
    if (!preferences.quietHours) return false

    const now = new Date()
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).format(now)

    const currentTime = userTime.replace(':', '')
    const startTime = preferences.quietHours.start.replace(':', '')
    const endTime = preferences.quietHours.end.replace(':', '')

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }
    
    return currentTime >= startTime && currentTime <= endTime
  }

  /**
   * Calculate next available time after quiet hours
   */
  private calculateNextAvailableTime(preferences: NotificationPreferences): Date {
    if (!preferences.quietHours) return new Date()

    const now = new Date()
    const endTime = preferences.quietHours.end.split(':')
    const endHour = parseInt(endTime[0])
    const endMinute = parseInt(endTime[1])

    // Create date for end of quiet hours today
    const nextAvailable = new Date(now)
    nextAvailable.setHours(endHour, endMinute, 0, 0)

    // If end time has already passed today, it's for tomorrow
    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1)
    }

    return nextAvailable
  }

  /**
   * Deliver notification via specified channels
   */
  private async deliverNotification(
    notification: { id: string; type: string; templateData: unknown; userId: string },
    userEmail: string,
    channels: ('email' | 'push' | 'sms')[]
  ): Promise<void> {
    const template = this.getNotificationTemplate(notification.type as NotificationType)
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(userEmail, template, notification.templateData as Record<string, unknown>)
            break
          case 'push':
            await this.sendPushNotification(notification.userId, template, notification.templateData as Record<string, unknown>)
            break
          case 'sms':
            await this.sendSMS(notification.userId, template, notification.templateData as Record<string, unknown>)
            break
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error)
        // Update notification status to failed
        await (prisma as unknown as { notification: { update: (data: { where: { id: string }; data: unknown }) => Promise<unknown> } }).notification.update({
          where: { id: notification.id },
          data: { 
            status: 'failed',
            failureReason: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    // Mark as sent if no failures
    await (prisma as unknown as { notification: { update: (data: { where: { id: string }; data: unknown }) => Promise<unknown> } }).notification.update({
      where: { id: notification.id },
      data: { 
        status: 'sent',
        sentAt: new Date()
      }
    })
  }

  /**
   * Get notification template for a given type
   */
  private getNotificationTemplate(type: NotificationType): NotificationTemplate {
    const templates: Record<NotificationType, NotificationTemplate> = {
      [NotificationType.SESSION_REMINDER_60]: {
        id: 'session_reminder_60',
        type: NotificationType.SESSION_REMINDER_60,
        subject: 'Learning session starting in 1 hour',
        body: `Hi {{userName}},

Your learning session is starting in 1 hour at {{scheduledAt}}.

Session Details:
- Sprint: {{sprintType}}
- Session #{{sessionNumber}}
- Time: {{scheduledAt}} ({{userTimezone}})

{{#if videoUrl}}
Join here: {{videoUrl}}
{{/if}}

See you there!`,
        variables: ['userName', 'scheduledAt', 'sprintType', 'sessionNumber', 'userTimezone', 'videoUrl']
      },
      [NotificationType.SESSION_REMINDER_10]: {
        id: 'session_reminder_10',
        type: NotificationType.SESSION_REMINDER_10,
        subject: 'Learning session starting in 10 minutes',
        body: `Hi {{userName}},

Your learning session is starting in 10 minutes!

{{#if videoUrl}}
Join now: {{videoUrl}}
{{/if}}

Don't be late!`,
        variables: ['userName', 'videoUrl']
      },
      [NotificationType.SESSION_STARTED]: {
        id: 'session_started',
        type: NotificationType.SESSION_STARTED,
        subject: 'Your learning session has started',
        body: `Your learning session has begun. Join now if you haven't already!

{{#if videoUrl}}
Join here: {{videoUrl}}
{{/if}}`,
        variables: ['videoUrl']
      },
      [NotificationType.SESSION_CANCELLED]: {
        id: 'session_cancelled',
        type: NotificationType.SESSION_CANCELLED,
        subject: 'Learning session cancelled',
        body: `Your learning session scheduled for {{scheduledAt}} has been cancelled.

We'll help you reschedule soon.`,
        variables: ['scheduledAt']
      },
      [NotificationType.CHECKIN_REMINDER]: {
        id: 'checkin_reminder',
        type: NotificationType.CHECKIN_REMINDER,
        subject: 'Time for your daily check-in',
        body: `Hi {{userName}},

Don't forget to complete your daily check-in to maintain your streak!

Check in now to share your progress.`,
        variables: ['userName']
      },
      [NotificationType.MATCH_FOUND]: {
        id: 'match_found',
        type: NotificationType.MATCH_FOUND,
        subject: 'We found your learning pod!',
        body: `Great news! We found a learning pod that matches your preferences.

Check your dashboard to review and accept your pod match.`,
        variables: []
      },
      [NotificationType.WAITLIST_TIMEOUT_WARNING]: {
        id: 'waitlist_timeout_warning',
        type: NotificationType.WAITLIST_TIMEOUT_WARNING,
        subject: 'Still looking for your learning pod',
        body: `We're still working on finding the perfect learning pod for you.

If we don't find a match within the next few hours, we'll help you explore other options.`,
        variables: []
      },
      [NotificationType.WAITLIST_TIMEOUT_EXPIRED]: {
        id: 'waitlist_timeout_expired',
        type: NotificationType.WAITLIST_TIMEOUT_EXPIRED,
        subject: 'Let\'s try a different approach',
        body: `We weren't able to find a perfect pod match within 24 hours.

Let's explore some alternative options to get you started with your learning journey.`,
        variables: []
      }
    }

    return templates[type]
  }

  /**
   * Send email notification (placeholder implementation)
   */
  private async sendEmail(
    email: string, 
    template: NotificationTemplate, 
    data: Record<string, unknown>
  ): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Sending email to:', email)
    console.log('Subject:', template.subject)
    console.log('Template data:', data)
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Send push notification (placeholder implementation)
   */
  private async sendPushNotification(
    userId: string, 
    template: NotificationTemplate, 
    data: Record<string, unknown>
  ): Promise<void> {
    // In production, integrate with push service (Firebase, OneSignal, etc.)
    console.log('Sending push notification to user:', userId)
    console.log('Title:', template.subject)
    console.log('Template data:', data)
    
    // Simulate push notification
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  /**
   * Send SMS notification (placeholder implementation)
   */
  private async sendSMS(
    userId: string, 
    template: NotificationTemplate, 
    data: Record<string, unknown>
  ): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log('Sending SMS to user:', userId)
    console.log('Message:', template.body)
    console.log('Template data:', data)
    
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 75))
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date()
      const scheduledNotifications = await (prisma as unknown as { notification: { findMany: (query: unknown) => Promise<Array<{ id: string; type: string; templateData: unknown; userId: string; channels: string; user: { email: string } }>> } }).notification.findMany({
        where: {
          status: 'pending',
          scheduledFor: {
            lte: now
          }
        },
        include: {
          user: {
            select: {
              email: true,
              timezone: true
            }
          }
        }
      })

      for (const notification of scheduledNotifications) {
        try {
          await this.deliverNotification(
            notification,
            notification.user.email,
            JSON.parse(notification.channels) as ('email' | 'push' | 'sms')[]
          )
        } catch (error) {
          console.error(`Failed to process scheduled notification ${notification.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
    }
  }
}