import { z } from 'zod'

// Agenda item validation schema
const agendaItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(1).max(180), // 1 minute to 3 hours
  order: z.number().min(0),
  completed: z.boolean().default(false)
})

// Session notes validation schema
const sessionNotesSchema = z.object({
  bullets: z.array(z.string().min(1)).max(20),
  keyPoints: z.array(z.string().min(1)).max(10),
  decisions: z.array(z.string().min(1)).max(10),
  timestamp: z.date()
})

// Action item validation schema
const actionItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  assignedTo: z.array(z.string().cuid()).min(1),
  dueDate: z.date(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  completed: z.boolean().default(false)
})

// Quiz question validation schema
const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(10).max(500),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctAnswer: z.number().min(0),
  explanation: z.string().min(10).max(1000)
})

// Quiz validation schema
const quizSchema = z.object({
  id: z.string(),
  questions: z.array(quizQuestionSchema).min(1).max(10),
  topic: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  timeLimit: z.number().min(60).max(3600).optional(), // 1 minute to 1 hour
  passingScore: z.number().min(0).max(100).default(70)
})

// Proof checklist item validation schema
const proofChecklistItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1).max(200),
  completed: z.boolean().default(false),
  evidence: z.string().optional(),
  required: z.boolean().default(true)
})

// Proof checklist validation schema
const proofChecklistSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  items: z.array(proofChecklistItemSchema).min(1).max(20),
  completionRequired: z.number().min(0).max(100).default(80) // Percentage required
})

// Coach document creation validation schema
export const createCoachDocSchema = z.object({
  sessionId: z.string().cuid(),
  version: z.number().min(1).default(1),
  agenda: z.array(agendaItemSchema).optional(),
  notes: sessionNotesSchema.optional(),
  actionItems: z.array(actionItemSchema).optional(),
  quiz: quizSchema.optional(),
  proofChecklist: proofChecklistSchema.optional()
})

// Coach document update validation schema
export const updateCoachDocSchema = z.object({
  agenda: z.array(agendaItemSchema).optional(),
  notes: sessionNotesSchema.optional(),
  actionItems: z.array(actionItemSchema).optional(),
  quiz: quizSchema.optional(),
  proofChecklist: proofChecklistSchema.optional()
})

// Validation functions
export function validateCoachDocCreation(data: unknown) {
  return createCoachDocSchema.safeParse(data)
}

export function validateCoachDocUpdate(data: unknown) {
  return updateCoachDocSchema.safeParse(data)
}

// Business logic validation
export function validateAgendaTiming(agenda: Array<{ duration: number }>): {
  isValid: boolean
  totalDuration: number
  message?: string
} {
  const totalDuration = agenda.reduce((sum, item) => sum + item.duration, 0)
  
  if (totalDuration > 180) {
    return {
      isValid: false,
      totalDuration,
      message: 'Total agenda duration exceeds 3 hours maximum'
    }
  }
  
  if (totalDuration < 15) {
    return {
      isValid: false,
      totalDuration,
      message: 'Agenda must be at least 15 minutes long'
    }
  }
  
  return { isValid: true, totalDuration }
}

export function validateQuizAnswers(
  quiz: { questions: Array<{ options: string[]; correctAnswer: number }> }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  quiz.questions.forEach((question, index) => {
    if (question.correctAnswer >= question.options.length) {
      errors.push(`Question ${index + 1}: Correct answer index is out of range`)
    }
    
    if (question.options.length < 2) {
      errors.push(`Question ${index + 1}: Must have at least 2 options`)
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(question.options)
    if (uniqueOptions.size !== question.options.length) {
      errors.push(`Question ${index + 1}: Contains duplicate options`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateActionItemAssignments(
  actionItems: Array<{ assignedTo: string[] }>,
  sessionParticipants: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  actionItems.forEach((item, index) => {
    const invalidAssignees = item.assignedTo.filter(
      userId => !sessionParticipants.includes(userId)
    )
    
    if (invalidAssignees.length > 0) {
      errors.push(
        `Action item ${index + 1}: Contains assignees not in session (${invalidAssignees.join(', ')})`
      )
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateProofChecklistCompletion(
  checklist: { items: Array<{ completed: boolean; required: boolean }>; completionRequired: number }
): { isValid: boolean; completionRate: number; message?: string } {
  const requiredItems = checklist.items.filter(item => item.required)
  const completedRequired = requiredItems.filter(item => item.completed)
  
  const completionRate = requiredItems.length > 0 
    ? (completedRequired.length / requiredItems.length) * 100 
    : 100
  
  if (completionRate < checklist.completionRequired) {
    return {
      isValid: false,
      completionRate,
      message: `Only ${completionRate.toFixed(1)}% completed, ${checklist.completionRequired}% required`
    }
  }
  
  return { isValid: true, completionRate }
}