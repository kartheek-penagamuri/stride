# Notification System

The notification system handles all user communications including session reminders, match notifications, and check-in prompts.

## Features

- **Multi-channel delivery**: Email, push notifications, and SMS
- **Template-based messaging**: Consistent, customizable notification templates
- **Quiet hours support**: Respects user's quiet hours preferences
- **Priority handling**: Urgent notifications bypass quiet hours
- **Scheduled delivery**: Notifications can be scheduled for future delivery
- **Delivery tracking**: Track notification status and failures

## Notification Types

### Session Reminders
- `SESSION_REMINDER_60`: Sent 60 minutes before session
- `SESSION_REMINDER_10`: Sent 10 minutes before session
- `SESSION_STARTED`: Sent when session begins
- `SESSION_CANCELLED`: Sent when session is cancelled

### Matching & Waitlist
- `MATCH_FOUND`: Sent when a pod match is found
- `WAITLIST_TIMEOUT_WARNING`: Warning before waitlist timeout
- `WAITLIST_TIMEOUT_EXPIRED`: Sent when waitlist times out

### Progress Tracking
- `CHECKIN_REMINDER`: Daily check-in reminders

## Usage

### Sending a Notification

```typescript
import { NotificationService, NotificationType } from '@/lib/services/notification-service'

const notificationService = new NotificationService()

await notificationService.sendNotification({
  userId: 'user123',
  type: NotificationType.SESSION_REMINDER_60,
  templateData: {
    userName: 'John',
    scheduledAt: new Date(),
    sprintType: 'gym_3x_week',
    sessionNumber: 1,
    videoUrl: 'https://meet.jit.si/room123'
  },
  priority: 'normal'
})
```

### Processing Session Reminders

```typescript
// Send T-60 minute reminders
await notificationService.sendSessionReminders('T-60')

// Send T-10 minute reminders
await notificationService.sendSessionReminders('T-10')
```

## API Endpoints

### POST /api/notifications/send
Send a notification to a specific user.

**Request Body:**
```json
{
  "userId": "string",
  "type": "NotificationType",
  "templateData": {},
  "priority": "low|normal|high|urgent",
  "scheduledFor": "ISO datetime (optional)"
}
```

### POST /api/notifications/process
Process scheduled notifications and send session reminders. This endpoint should be called by a cron job every minute.

**Headers:**
```
Authorization: Bearer <INTERNAL_API_KEY>
```

## Cron Job Setup

The notification system requires a cron job to process scheduled notifications and send session reminders.

### Using the provided script:

```bash
# Add to crontab (runs every minute)
* * * * * /usr/bin/node /path/to/project/scripts/process-notifications.js

# Or using npm/yarn
* * * * * cd /path/to/project && npm run process-notifications
```

### Environment Variables

```env
INTERNAL_API_KEY=your-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-app.com
```

## User Preferences

Users can configure their notification preferences:

```typescript
interface NotificationPreferences {
  email: boolean
  push: boolean
  sms?: boolean
  quietHours?: {
    start: string // "22:00"
    end: string   // "08:00"
  }
}
```

## Database Schema

The notification system uses the `Notification` model:

```prisma
model Notification {
  id           String    @id @default(cuid())
  userId       String
  type         String    // NotificationType enum values
  channels     String[]  // ['email', 'push', 'sms']
  status       String    @default("pending") // 'pending' | 'sent' | 'failed' | 'cancelled'
  priority     String    @default("normal") // 'low' | 'normal' | 'high' | 'urgent'
  templateData Json      // Data for template rendering
  scheduledFor DateTime?
  sentAt       DateTime?
  failureReason String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, status])
  @@index([status, scheduledFor])
  @@map("notifications")
}
```

## Integration Points

### Session Service
The session service tracks which reminders have been sent using the `remindersSent` field and provides methods to query sessions needing reminders.

### Waitlist Service
The waitlist service uses the notification system for timeout warnings and match notifications.

### Future Integrations
- Email service (SendGrid, AWS SES)
- Push notification service (Firebase, OneSignal)
- SMS service (Twilio, AWS SNS)

## Testing

To test the notification system in development:

1. Create a test session scheduled for the near future
2. Run the notification processor: `node scripts/process-notifications.js`
3. Check console logs for notification delivery simulation

## Production Considerations

1. **Email Service**: Replace the placeholder email implementation with a real service
2. **Push Notifications**: Implement PWA push notifications or mobile app integration
3. **SMS Service**: Add SMS delivery for urgent notifications
4. **Rate Limiting**: Implement rate limiting to prevent notification spam
5. **Monitoring**: Add monitoring for notification delivery success rates
6. **Templates**: Consider using a template engine like Handlebars for complex templates