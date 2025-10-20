import { z } from 'zod'
import { SprintType, GoalStatus } from '@/types'

// Time slot validation schema
const timeSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().min(15).max(480) // 15 minutes to 8 hours
})

// Schedule validation schema
const scheduleSchema = z.object({
  defaultSlots: z.array(timeSlotSchema).min(1).max(7),
  backupSlot: timeSlotSchema,
  timezone: z.string(),
  frequency: z.enum(['daily', 'weekly'])
})

// Goal creation validation schema
export const createGoalSchema = z.object({
  sprintType: z.enum([SprintType.GYM_3X_WEEK, SprintType.NET_PROMPTING]),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  schedule: scheduleSchema,
  proofMethod: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
})

// Goal update validation schema
export const updateGoalSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  schedule: scheduleSchema.optional(),
  proofMethod: z.string().min(1).optional(),
  status: z.enum([GoalStatus.ACTIVE, GoalStatus.COMPLETED, GoalStatus.CANCELLED]).optional(),
  streakCount: z.number().min(0).optional(),
  freezeTokens: z.number().min(0).max(5).optional(),
})

// Sprint template validation schema
export const sprintTemplateSchema = z.object({
  type: z.enum([SprintType.GYM_3X_WEEK, SprintType.NET_PROMPTING]),
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  duration: z.number().min(7).max(365), // 1 week to 1 year
  frequency: z.enum(['daily', 'weekly']),
  defaultSchedule: scheduleSchema,
  proofMethods: z.array(z.string()).min(1),
  agendaTemplate: z.object({
    items: z.array(z.object({
      title: z.string().min(1),
      duration: z.number().min(1).max(180) // 1 minute to 3 hours
    }))
  }),
  isActive: z.boolean().default(true)
})

// Validation functions
export function validateGoalCreation(data: unknown) {
  return createGoalSchema.safeParse(data)
}

export function validateGoalUpdate(data: unknown) {
  return updateGoalSchema.safeParse(data)
}

export function validateSprintTemplate(data: unknown) {
  return sprintTemplateSchema.safeParse(data)
}

// Business logic validation
export function validateGoalScheduleConflicts(
  newSchedule: z.infer<typeof scheduleSchema>,
  existingGoals: Array<{ schedule: Record<string, unknown>; startDate: Date; endDate: Date }>
): { hasConflict: boolean; conflictingGoals: string[] } {
  // Check for schedule conflicts with existing active goals
  const conflicts: string[] = []
  
  for (const goal of existingGoals) {
    const existingSchedule = goal.schedule
    
    // Check if time slots overlap
    for (const newSlot of newSchedule.defaultSlots) {
      for (const existingSlot of (existingSchedule.defaultSlots as Array<{ dayOfWeek: number; startTime: string; duration: number }>)) {
        if (newSlot.dayOfWeek === existingSlot.dayOfWeek) {
          const newStart = parseTime(newSlot.startTime)
          const newEnd = newStart + newSlot.duration
          const existingStart = parseTime(existingSlot.startTime)
          const existingEnd = existingStart + existingSlot.duration
          
          if (newStart < existingEnd && newEnd > existingStart) {
            conflicts.push(goal.startDate.toISOString())
          }
        }
      }
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflictingGoals: conflicts
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export function validateSprintDuration(
  sprintType: SprintType,
  startDate: Date,
  endDate: Date
): { isValid: boolean; message?: string } {
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  switch (sprintType) {
    case SprintType.GYM_3X_WEEK:
      if (durationDays < 21 || durationDays > 90) {
        return {
          isValid: false,
          message: 'Gym sprints should be between 3-12 weeks (21-90 days)'
        }
      }
      break
    case SprintType.NET_PROMPTING:
      if (durationDays < 14 || durationDays > 56) {
        return {
          isValid: false,
          message: '.NET prompting sprints should be between 2-8 weeks (14-56 days)'
        }
      }
      break
  }
  
  return { isValid: true }
}