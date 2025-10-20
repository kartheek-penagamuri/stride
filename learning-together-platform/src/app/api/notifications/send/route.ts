import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { NotificationService, NotificationType } from '@/lib/services/notification-service'

const notificationService = new NotificationService()

const sendNotificationSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  templateData: z.record(z.string(), z.any()),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledFor: z.string().datetime().optional()
})

/**
 * Send a notification to a specific user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = sendNotificationSchema.parse(body)

    const notification = await notificationService.sendNotification({
      userId: data.userId,
      type: data.type,
      templateData: data.templateData,
      priority: data.priority,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined
    })

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}