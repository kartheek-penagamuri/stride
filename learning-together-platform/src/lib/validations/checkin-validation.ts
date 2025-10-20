import { z } from 'zod'
import { CheckInStatus } from '@/types'

// Proof submission validation schema
const proofSubmissionSchema = z.object({
  type: z.enum(['file', 'text', 'link']),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
})

// Check-in creation validation schema
export const createCheckInSchema = z.object({
  userId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  attended: z.boolean().default(false),
  rpe: z.number().min(1).max(10).optional(), // Rate of Perceived Exertion
  win: z.string().min(1).max(500),
  tweak: z.string().min(1).max(500),
  proofOfEffort: z.array(proofSubmissionSchema).optional(),
  status: z.nativeEnum(CheckInStatus).default(CheckInStatus.SUBMITTED)
})

// Check-in update validation schema
export const updateCheckInSchema = z.object({
  attended: z.boolean().optional(),
  rpe: z.number().min(1).max(10).optional(),
  win: z.string().min(1).max(500).optional(),
  tweak: z.string().min(1).max(500).optional(),
  proofOfEffort: z.array(proofSubmissionSchema).optional(),
  status: z.nativeEnum(CheckInStatus).optional()
})

// Validation functions
export function validateCheckInCreation(data: unknown) {
  return createCheckInSchema.safeParse(data)
}

export function validateCheckInUpdate(data: unknown) {
  return updateCheckInSchema.safeParse(data)
}

// Business logic validation
export function validateCheckInTiming(submittedAt: Date, sessionDate: Date): {
  isValid: boolean
  status: CheckInStatus
  message?: string
} {
  const timeDiff = submittedAt.getTime() - sessionDate.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  
  // Check-in is on time if submitted within 24 hours after session
  if (hoursDiff <= 24 && hoursDiff >= -2) { // Allow 2 hours before session
    return { isValid: true, status: CheckInStatus.SUBMITTED }
  }
  
  // Check-in is late if submitted within 48 hours after session
  if (hoursDiff <= 48) {
    return { 
      isValid: true, 
      status: CheckInStatus.LATE,
      message: 'Check-in submitted late'
    }
  }
  
  // Check-in is missed if submitted more than 48 hours after session
  return { 
    isValid: false, 
    status: CheckInStatus.MISSED,
    message: 'Check-in window has expired'
  }
}

export function validateProofOfEffort(
  proofMethod: string, 
  proofSubmissions: Array<{ type: string; content: string }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!proofSubmissions || proofSubmissions.length === 0) {
    errors.push('At least one proof of effort is required')
    return { isValid: false, errors }
  }
  
  switch (proofMethod) {
    case 'gym_checkin_photo':
      if (!proofSubmissions.some(p => p.type === 'file')) {
        errors.push('Photo proof required for gym check-ins')
      }
      break
      
    case 'code_commit':
      if (!proofSubmissions.some(p => p.type === 'link' && p.content.includes('github'))) {
        errors.push('GitHub commit link required for code submissions')
      }
      break
      
    case 'fitness_app_screenshot':
      if (!proofSubmissions.some(p => p.type === 'file')) {
        errors.push('Screenshot required for fitness app proof')
      }
      break
      
    case 'workout_log':
      if (!proofSubmissions.some(p => p.type === 'text' && p.content.length >= 50)) {
        errors.push('Detailed workout log (minimum 50 characters) required')
      }
      break
      
    case 'learning_reflection':
      if (!proofSubmissions.some(p => p.type === 'text' && p.content.length >= 100)) {
        errors.push('Learning reflection (minimum 100 characters) required')
      }
      break
      
    case 'project_demo':
      if (!proofSubmissions.some(p => p.type === 'link' || p.type === 'file')) {
        errors.push('Demo link or video file required')
      }
      break
      
    default:
      // Generic validation for custom proof methods
      if (proofSubmissions.every(p => p.content.length < 10)) {
        errors.push('Proof content must be substantial (minimum 10 characters)')
      }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}