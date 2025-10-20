import { SprintType, SprintTemplate } from '@/types'
import { SprintTemplateInput, SprintTemplateUpdate } from '@/lib/validations/sprint-template-validation'

// In-memory sprint templates for MVP
// In production, these would be stored in database
const SPRINT_TEMPLATES: SprintTemplate[] = [
  {
    id: 'gym-3x-week-template',
    type: SprintType.GYM_3X_WEEK,
    name: 'Gym 3×/week',
    description: 'Build a consistent gym habit with 3 workouts per week. Perfect for establishing fitness routines and accountability.',
    duration: 30, // 30 days
    frequency: 'weekly',
    defaultSchedule: {
      defaultSlots: [
        { dayOfWeek: 1, startTime: '18:00', duration: 90 }, // Monday 6 PM
        { dayOfWeek: 3, startTime: '18:00', duration: 90 }, // Wednesday 6 PM  
        { dayOfWeek: 5, startTime: '18:00', duration: 90 }, // Friday 6 PM
      ],
      backupSlot: { dayOfWeek: 6, startTime: '10:00', duration: 90 }, // Saturday 10 AM
      timezone: 'UTC',
      frequency: 'weekly'
    },
    proofMethods: [
      'Photo of gym equipment/workout',
      'Fitness app screenshot',
      'Workout log entry',
      'Gym check-in location',
      'Video of exercise form'
    ],
    agendaTemplate: {
      items: [
        {
          id: 'checkin-1',
          title: 'Weekly Check-in',
          description: 'Share your workout wins and challenges from the past week',
          duration: 10,
          order: 1
        },
        {
          id: 'planning-1',
          title: 'Workout Planning',
          description: 'Plan your workouts for the upcoming week',
          duration: 15,
          order: 2
        },
        {
          id: 'accountability-1',
          title: 'Accountability Partners',
          description: 'Pair up for workout accountability and motivation',
          duration: 10,
          order: 3
        },
        {
          id: 'troubleshooting-1',
          title: 'Problem Solving',
          description: 'Address any barriers or challenges to consistency',
          duration: 10,
          order: 4
        },
        {
          id: 'commitment-1',
          title: 'Weekly Commitment',
          description: 'Make specific commitments for the next week',
          duration: 5,
          order: 5
        }
      ]
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'net-prompting-template',
    type: SprintType.NET_PROMPTING,
    name: '.NET Prompting',
    description: 'Master .NET development through AI-assisted coding in 4 weeks. Learn modern C# patterns and best practices.',
    duration: 28, // 4 weeks
    frequency: 'weekly',
    defaultSchedule: {
      defaultSlots: [
        { dayOfWeek: 2, startTime: '19:00', duration: 120 }, // Tuesday 7 PM
        { dayOfWeek: 4, startTime: '19:00', duration: 120 }, // Thursday 7 PM
      ],
      backupSlot: { dayOfWeek: 0, startTime: '14:00', duration: 120 }, // Sunday 2 PM
      timezone: 'UTC',
      frequency: 'weekly'
    },
    proofMethods: [
      'GitHub commit/pull request',
      'Code screenshot with explanation',
      'Project demo video',
      'Technical blog post',
      'Stack Overflow contribution'
    ],
    agendaTemplate: {
      items: [
        {
          id: 'standup-1',
          title: 'Development Standup',
          description: 'Share progress on current .NET projects and blockers',
          duration: 15,
          order: 1
        },
        {
          id: 'code-review-1',
          title: 'Code Review Session',
          description: 'Review each other\'s code and provide feedback',
          duration: 30,
          order: 2
        },
        {
          id: 'learning-1',
          title: 'Learning Topic',
          description: 'Deep dive into a specific .NET concept or pattern',
          duration: 25,
          order: 3
        },
        {
          id: 'pair-programming-1',
          title: 'Pair Programming',
          description: 'Work together on challenging problems',
          duration: 30,
          order: 4
        },
        {
          id: 'planning-1',
          title: 'Sprint Planning',
          description: 'Plan learning goals and projects for next session',
          duration: 20,
          order: 5
        }
      ]
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export class SprintTemplateService {
  /**
   * Get all active sprint templates
   */
  static async getActiveTemplates(): Promise<SprintTemplate[]> {
    return SPRINT_TEMPLATES.filter(template => template.isActive)
  }

  /**
   * Get a specific sprint template by ID
   */
  static async getTemplateById(id: string): Promise<SprintTemplate | null> {
    return SPRINT_TEMPLATES.find(template => template.id === id) || null
  }

  /**
   * Get templates by sprint type
   */
  static async getTemplatesByType(type: SprintType): Promise<SprintTemplate[]> {
    return SPRINT_TEMPLATES.filter(template => 
      template.type === type && template.isActive
    )
  }

  /**
   * Create a new sprint template (admin functionality)
   */
  static async createTemplate(data: SprintTemplateInput): Promise<SprintTemplate> {
    const template: SprintTemplate = {
      id: `template-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    SPRINT_TEMPLATES.push(template)
    return template
  }

  /**
   * Update an existing sprint template (admin functionality)
   */
  static async updateTemplate(id: string, data: SprintTemplateUpdate): Promise<SprintTemplate | null> {
    const index = SPRINT_TEMPLATES.findIndex(template => template.id === id)
    if (index === -1) return null

    SPRINT_TEMPLATES[index] = {
      ...SPRINT_TEMPLATES[index],
      ...data,
      updatedAt: new Date()
    }

    return SPRINT_TEMPLATES[index]
  }

  /**
   * Validate template selection for user preferences
   */
  static async validateTemplateForUser(
    templateId: string, 
    userTimezone: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    const template = await this.getTemplateById(templateId)
    if (!template) {
      return { valid: false, issues: ['Template not found'] }
    }

    const issues: string[] = []

    // Check if template is active
    if (!template.isActive) {
      issues.push('Template is not currently available')
    }

    // Validate timezone compatibility (basic check)
    if (!userTimezone) {
      issues.push('User timezone is required for template validation')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}