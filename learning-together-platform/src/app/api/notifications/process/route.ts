import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification-service'

const notificationService = new NotificationService()

/**
 * Process scheduled notifications and send session reminders
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (in production, use proper authentication)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process scheduled notifications
    await notificationService.processScheduledNotifications()

    // Send T-60 minute reminders
    await notificationService.sendSessionReminders('T-60')

    // Send T-10 minute reminders
    await notificationService.sendSessionReminders('T-10')

    return NextResponse.json({
      success: true,
      message: 'Notifications processed successfully'
    })
  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    )
  }
}