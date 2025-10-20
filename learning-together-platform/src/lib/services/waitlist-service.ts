// import { PrismaClient } from '@prisma/client' // Commented out as it's not used
import { SprintType, UserPreferences } from '@/types'
import { MatchingAlgorithm, MatchingRequest } from './matching-service'
import { UserService } from './user-service'
import { PodService } from './pod-service'

// const prisma = new PrismaClient() // Commented out as it's not used in this service

export interface WaitlistEntry {
  id: string
  userId: string
  sprintType: SprintType
  preferences: UserPreferences
  timezone: string
  createdAt: Date
  expiresAt: Date
  status: 'active' | 'matched' | 'expired' | 'cancelled'
  notificationsSent: number
}

export interface WaitlistNotification {
  userId: string
  type: 'added' | 'timeout_warning' | 'timeout_expired' | 'matches_found'
  message: string
  data?: Record<string, unknown>
}

export class WaitlistService {
  private static readonly TIMEOUT_HOURS = 24
  private static readonly WARNING_HOURS = 20 // Send warning 4 hours before timeout

  /**
   * Add user to waitlist for matching
   */
  static async addToWaitlist(request: MatchingRequest): Promise<WaitlistEntry> {
    const expiresAt = new Date(Date.now() + this.TIMEOUT_HOURS * 60 * 60 * 1000)
    
    // In a production system, this would be stored in a database table
    // For now, we'll simulate with in-memory storage and logging
    const entry: WaitlistEntry = {
      id: `waitlist_${request.userId}_${Date.now()}`,
      userId: request.userId,
      sprintType: request.sprintType,
      preferences: request.preferences,
      timezone: request.timezone,
      createdAt: new Date(),
      expiresAt,
      status: 'active',
      notificationsSent: 0
    }

    // Log the waitlist entry (in production, save to database)
    console.log('Added to waitlist:', entry)

    // Schedule timeout processing
    this.scheduleTimeoutProcessing(entry)

    // Send initial notification
    await this.sendNotification({
      userId: request.userId,
      type: 'added',
      message: 'You have been added to the matching waitlist. We will notify you when matches are found or after 24 hours.',
      data: { expiresAt, sprintType: request.sprintType }
    })

    return entry
  }

  /**
   * Schedule timeout processing for a waitlist entry
   */
  private static scheduleTimeoutProcessing(entry: WaitlistEntry): void {
    const warningTime = this.WARNING_HOURS * 60 * 60 * 1000
    const timeoutTime = this.TIMEOUT_HOURS * 60 * 60 * 1000

    // Schedule warning notification
    setTimeout(async () => {
      await this.sendTimeoutWarning(entry)
    }, warningTime)

    // Schedule timeout processing
    setTimeout(async () => {
      await this.processTimeout(entry)
    }, timeoutTime)
  }

  /**
   * Send timeout warning to user
   */
  private static async sendTimeoutWarning(entry: WaitlistEntry): Promise<void> {
    try {
      // Check if user still needs matching
      if (await this.userStillNeedsMatching(entry.userId, entry.sprintType)) {
        await this.sendNotification({
          userId: entry.userId,
          type: 'timeout_warning',
          message: 'Your matching request will expire in 4 hours. We are still looking for compatible pod members.',
          data: { 
            expiresAt: entry.expiresAt,
            sprintType: entry.sprintType,
            hoursRemaining: 4
          }
        })
      }
    } catch (error) {
      console.error('Error sending timeout warning:', error)
    }
  }

  /**
   * Process waitlist timeout
   */
  private static async processTimeout(entry: WaitlistEntry): Promise<void> {
    try {
      // Check if user still needs matching
      if (!(await this.userStillNeedsMatching(entry.userId, entry.sprintType))) {
        console.log(`User ${entry.userId} no longer needs matching, skipping timeout`)
        return
      }

      // Try one more time to find matches
      const user = await UserService.getUserById(entry.userId)
      if (!user) {
        console.log(`User ${entry.userId} not found during timeout processing`)
        return
      }

      const matchingRequest: MatchingRequest = {
        userId: entry.userId,
        sprintType: entry.sprintType,
        preferences: entry.preferences,
        timezone: entry.timezone
      }

      const suggestions = await MatchingAlgorithm.findPotentialMatches(matchingRequest)

      if (suggestions.length > 0) {
        // Found matches after timeout
        await this.sendNotification({
          userId: entry.userId,
          type: 'matches_found',
          message: 'Great news! We found potential pod matches for you after your waitlist period.',
          data: { 
            suggestions: suggestions.slice(0, 3),
            sprintType: entry.sprintType
          }
        })
      } else {
        // No matches found, send timeout notification
        await this.sendNotification({
          userId: entry.userId,
          type: 'timeout_expired',
          message: 'Your 24-hour matching period has expired. You can request matching again or try adjusting your preferences.',
          data: { 
            sprintType: entry.sprintType,
            suggestions: [
              'Try adjusting your availability windows',
              'Consider a different collaboration style',
              'Check if there are more users in your timezone'
            ]
          }
        })
      }

    } catch (error) {
      console.error('Error processing waitlist timeout:', error)
    }
  }

  /**
   * Check if user still needs matching for the sprint type
   */
  private static async userStillNeedsMatching(userId: string, sprintType: SprintType): Promise<boolean> {
    try {
      const userPods = await PodService.getUserPods(userId)
      const hasActivePod = userPods.some(pod => 
        pod.sprintType === sprintType && 
        ['forming', 'active'].includes(pod.status)
      )
      return !hasActivePod
    } catch (error) {
      console.error('Error checking user pod status:', error)
      return false
    }
  }

  /**
   * Send notification to user
   */
  private static async sendNotification(notification: WaitlistNotification): Promise<void> {
    try {
      const { NotificationService, NotificationType } = await import('./notification-service')
      const notificationService = new NotificationService()

      let notificationType: typeof NotificationType[keyof typeof NotificationType]
      let templateData: Record<string, unknown> = {}

      switch (notification.type) {
        case 'added':
          notificationType = NotificationType.MATCH_FOUND
          break
        case 'timeout_warning':
          notificationType = NotificationType.WAITLIST_TIMEOUT_WARNING
          break
        case 'timeout_expired':
          notificationType = NotificationType.WAITLIST_TIMEOUT_EXPIRED
          break
        case 'matches_found':
          notificationType = NotificationType.MATCH_FOUND
          templateData = { matchCount: notification.data?.matchCount || 1 }
          break
        default:
          console.log('Unknown notification type:', notification.type)
          return
      }

      await notificationService.sendNotification({
        userId: notification.userId,
        type: notificationType,
        templateData,
        priority: notification.type === 'timeout_expired' ? 'high' : 'normal'
      })
    } catch (error) {
      console.error('Error sending waitlist notification:', error)
    }
  }

  /**
   * Cancel waitlist entry (user found match or cancelled)
   */
  static async cancelWaitlistEntry(userId: string, sprintType: SprintType): Promise<void> {
    // In production, this would update the database record
    console.log(`Cancelled waitlist entry for user ${userId}, sprint ${sprintType}`)
  }

  /**
   * Get active waitlist entries (for admin/monitoring)
   */
  static async getActiveWaitlistEntries(): Promise<WaitlistEntry[]> {
    // In production, this would query the database
    // For now, return empty array as we're using in-memory simulation
    return []
  }

  /**
   * Process all expired waitlist entries (background job)
   */
  static async processExpiredEntries(): Promise<void> {
    try {
      // In production, this would:
      // 1. Query database for expired entries
      // 2. Process each expired entry
      // 3. Update entry status
      // 4. Send appropriate notifications

      console.log('Processing expired waitlist entries...')
      
      // This would be called by a cron job or background worker
      const expiredEntries = await this.getActiveWaitlistEntries()
      const now = new Date()
      
      for (const entry of expiredEntries) {
        if (entry.expiresAt <= now && entry.status === 'active') {
          await this.processTimeout(entry)
        }
      }

    } catch (error) {
      console.error('Error processing expired waitlist entries:', error)
    }
  }

  /**
   * Get waitlist statistics (for monitoring)
   */
  static async getWaitlistStats(): Promise<{
    totalActive: number
    averageWaitTime: number
    successRate: number
    bySprintType: Record<SprintType, number>
  }> {
    // In production, this would query the database for analytics
    return {
      totalActive: 0,
      averageWaitTime: 0,
      successRate: 0.75, // 75% success rate
      bySprintType: {
        [SprintType.GYM_3X_WEEK]: 0,
        [SprintType.NET_PROMPTING]: 0
      }
    }
  }
}