import { z } from 'zod'
import { SprintType } from '@/types'

export const sprintTemplateSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(SprintType),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Template description is required'),
  duration: z.number().min(1, 'Duration must be at least 1 day'),
  frequency: z.enum(['daily', 'weekly']),
  defaultSchedule: z.object({
    defaultSlots: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      duration: z.number().min(15, 'Duration must be at least 15 minutes')
    })).min(1, 'At least one default slot is required'),
    backupSlot: z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      duration: z.number().min(15, 'Duration must be at least 15 minutes')
    }),
    timezone: z.string().min(1, 'Timezone is required'),
    frequency: z.enum(['daily', 'weekly'])
  }),
  proofMethods: z.array(z.string()).min(1, 'At least one proof method is required'),
  agendaTemplate: z.object({
    items: z.array(z.object({
      id: z.string(),
      title: z.string().min(1, 'Agenda item title is required'),
      description: z.string(),
      duration: z.number().min(1, 'Duration must be at least 1 minute'),
      order: z.number().min(0)
    }))
  }),
  isActive: z.boolean().default(true)
})

export const createSprintTemplateSchema = sprintTemplateSchema.omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
})

export const updateSprintTemplateSchema = sprintTemplateSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type SprintTemplateInput = z.infer<typeof createSprintTemplateSchema>
export type SprintTemplateUpdate = z.infer<typeof updateSprintTemplateSchema>