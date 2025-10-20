import { z } from 'zod'

export const timeSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours')
})

export const scheduleSchema = z.object({
  defaultSlots: z.array(timeSlotSchema)
    .min(1, 'At least one default time slot is required')
    .max(7, 'Cannot have more than 7 default slots'),
  backupSlot: timeSlotSchema,
  timezone: z.string().min(1, 'Timezone is required'),
  frequency: z.enum(['daily', 'weekly'])
}).refine((data) => {
  // Ensure backup slot is different from default slots
  const backupKey = `${data.backupSlot.dayOfWeek}-${data.backupSlot.startTime}`
  const defaultKeys = data.defaultSlots.map(slot => `${slot.dayOfWeek}-${slot.startTime}`)
  return !defaultKeys.includes(backupKey)
}, {
  message: 'Backup slot must be different from default slots',
  path: ['backupSlot']
})

export const ifThenPlanSchema = z.object({
  templateId: z.string().min(1, 'Sprint template is required'),
  schedule: scheduleSchema,
  proofMethod: z.string().min(1, 'Proof method is required'),
  personalGoal: z.string().optional(),
  availabilityNotes: z.string().optional()
})

export type TimeSlotInput = z.infer<typeof timeSlotSchema>
export type ScheduleInput = z.infer<typeof scheduleSchema>
export type IfThenPlanInput = z.infer<typeof ifThenPlanSchema>

// Helper function to validate timezone
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

// Helper function to get common timezones
export function getCommonTimezones(): { value: string; label: string; offset: string }[] {
  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland'
  ]

  return timezones.map(tz => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'short'
    })
    const parts = formatter.formatToParts(now)
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || ''
    
    // Calculate offset
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`

    return {
      value: tz,
      label: `${tz.replace('_', ' ')} (${timeZoneName})`,
      offset: `UTC${offsetStr}`
    }
  })
}

// Helper function to get day names
export function getDayNames(): { value: number; label: string; short: string }[] {
  return [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ]
}