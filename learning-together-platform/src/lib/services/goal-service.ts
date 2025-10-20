import { PrismaClient } from '@prisma/client'
import { SprintType, GoalStatus, GoalWithTemplate, Schedule, SprintTemplate } from '@/types'
import { 
  validateGoalCreation, 
  validateGoalUpdate, 
  validateGoalScheduleConflicts,
  validateSprintDuration 
} from '@/lib/validations/goal-validation'
import { SprintTemplateService } from './sprint-template-service'

const prisma = new PrismaClient()

export interface CreateGoalData {
  userId: string
  sprintType: SprintType
  title: string
  description?: string
  schedule: Schedule
  proofMethod: string
  startDate: Date
  endDate: Date
}

export interface UpdateGoalData {
  title?: string
  description?: string
  schedule?: Schedule
  proofMethod?: string
  status?: GoalStatus
  streakCount?: number
  freezeTokens?: number
}

export class GoalService {
  /**
   * Create a new goal with validation
   */
  static async createGoal(data: CreateGoalData): Promise<GoalWithTemplate> {
    // Validate input data
    const validation = validateGoalCreation(data)
    if (!validation.success) {
      throw new Error(`Invalid goal data: ${validation.error.message}`)
    }

    // Validate sprint duration
    const durationValidation = validateSprintDuration(data.sprintType, data.startDate, data.endDate)
    if (!durationValidation.isValid) {
      throw new Error(durationValidation.message)
    }

    // Check for schedule conflicts
    const existingGoals = await prisma.goal.findMany({
      where: {
        userId: data.userId,
        status: 'active',
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate }
          }
        ]
      },
      select: { schedule: true, startDate: true, endDate: true }
    })

    const conflictCheck = validateGoalScheduleConflicts(data.schedule, existingGoals.map(g => ({
      ...g,
      schedule: g.schedule as Record<string, unknown>
    })))
    if (conflictCheck.hasConflict) {
      throw new Error('Schedule conflicts with existing active goals')
    }

    // Get sprint template for default values
    const templates = await SprintTemplateService.getTemplatesByType(data.sprintType)
    const template = templates.length > 0 ? templates[0] : null
    
    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        userId: data.userId,
        sprintType: data.sprintType,
        title: data.title,
        description: data.description,
        schedule: JSON.parse(JSON.stringify(data.schedule)),
        proofMethod: data.proofMethod,
        startDate: data.startDate,
        endDate: data.endDate,
        // streakCount and freezeTokens fields don't exist in schema yet
      }
    })

    return this.mapToGoalWithTemplate(goal, template)
  }

  /**
   * Get user's goals with optional filtering
   */
  static async getUserGoals(
    userId: string, 
    filters?: { status?: GoalStatus; sprintType?: SprintType }
  ): Promise<GoalWithTemplate[]> {
    const where: Record<string, unknown> = { userId }
    
    if (filters?.status) {
      where.status = filters.status
    }
    
    if (filters?.sprintType) {
      where.sprintType = filters.sprintType
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Get templates for each unique sprint type
    const sprintTypes = [...new Set(goals.map((g: { sprintType: string }) => g.sprintType as SprintType))]
    const templatePromises = sprintTypes.map(async type => {
      const templates = await SprintTemplateService.getTemplatesByType(type as SprintType)
      return templates.length > 0 ? templates[0] : null
    })
    const templates = await Promise.all(templatePromises)
    const templateMap = new Map(
      templates.filter(t => t !== null).map(t => [t!.type, t!])
    )

    return goals.map((goal: Record<string, unknown>) => 
      this.mapToGoalWithTemplate(goal, templateMap.get(goal.sprintType as SprintType) || null)
    )
  }

  /**
   * Get goal by ID
   */
  static async getGoalById(goalId: string, userId?: string): Promise<GoalWithTemplate | null> {
    const where: Record<string, unknown> = { id: goalId }
    if (userId) {
      where.userId = userId
    }

    const goal = await prisma.goal.findUnique({ where: { id: goalId, ...(userId && { userId }) } })
    if (!goal) return null

    const templates = await SprintTemplateService.getTemplatesByType(goal.sprintType as SprintType)
    const template = templates.length > 0 ? templates[0] : null
    return this.mapToGoalWithTemplate(goal, template)
  }

  /**
   * Update goal
   */
  static async updateGoal(goalId: string, userId: string, updates: UpdateGoalData): Promise<GoalWithTemplate> {
    // Validate updates
    const validation = validateGoalUpdate(updates)
    if (!validation.success) {
      throw new Error(`Invalid update data: ${validation.error.message}`)
    }

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId }
    })
    
    if (!existingGoal) {
      throw new Error('Goal not found or access denied')
    }

    // If updating schedule, check for conflicts
    if (updates.schedule) {
      const otherGoals = await prisma.goal.findMany({
        where: {
          userId,
          id: { not: goalId },
          status: 'active'
        },
        select: { schedule: true, startDate: true, endDate: true }
      })

      const conflictCheck = validateGoalScheduleConflicts(updates.schedule, otherGoals.map(g => ({
        ...g,
        schedule: g.schedule as Record<string, unknown>
      })))
      if (conflictCheck.hasConflict) {
        throw new Error('Schedule conflicts with other active goals')
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...updates,
        schedule: updates.schedule ? JSON.parse(JSON.stringify(updates.schedule)) : undefined,
        updatedAt: new Date()
      }
    })

    const templates = await SprintTemplateService.getTemplatesByType(updatedGoal.sprintType as SprintType)
    const template = templates.length > 0 ? templates[0] : null
    return this.mapToGoalWithTemplate(updatedGoal, template)
  }

  /**
   * Update goal streak (placeholder - streakCount field not in schema)
   */
  static async updateStreak(goalId: string, increment: boolean): Promise<void> {
    // TODO: Implement when streakCount field is added to Goal model
    console.log(`Streak update for goal ${goalId}, increment: ${increment}`)
  }

  /**
   * Use freeze token
   */
  static async useFreezeToken(goalId: string): Promise<boolean> {
    // TODO: Implement when freezeTokens field is added to Goal model
    console.log(`Freeze token used for goal ${goalId}`)
    return true
  }

  /**
   * Complete goal
   */
  static async completeGoal(goalId: string, userId: string): Promise<GoalWithTemplate> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId }
    })

    if (!goal) {
      throw new Error('Goal not found or access denied')
    }

    if (goal.status !== 'active') {
      throw new Error('Only active goals can be completed')
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { 
        status: 'completed',
        updatedAt: new Date()
      }
    })

    const templates = await SprintTemplateService.getTemplatesByType(updatedGoal.sprintType as SprintType)
    const template = templates.length > 0 ? templates[0] : null
    return this.mapToGoalWithTemplate(updatedGoal, template)
  }

  /**
   * Cancel goal
   */
  static async cancelGoal(goalId: string, userId: string): Promise<GoalWithTemplate> {
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId, userId },
      data: { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    })

    const templates = await SprintTemplateService.getTemplatesByType(updatedGoal.sprintType as SprintType)
    const template = templates.length > 0 ? templates[0] : null
    return this.mapToGoalWithTemplate(updatedGoal, template)
  }

  /**
   * Get goal statistics
   */
  static async getGoalStats(userId: string) {
    const stats = await prisma.goal.groupBy({
      by: ['status', 'sprintType'],
      where: { userId },
      _count: { id: true }
    })

    const totalGoals = await prisma.goal.count({ where: { userId } })
    const activeGoals = await prisma.goal.count({ 
      where: { userId, status: 'active' } 
    })
    const completedGoals = await prisma.goal.count({ 
      where: { userId, status: 'completed' } 
    })

    // TODO: Implement when streakCount field is added to Goal model

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      longestStreak: 0, // TODO: Implement when streakCount field is added
      byStatus: stats.reduce((acc: Record<string, number>, stat: { status: string; _count: { id: number } }) => {
        acc[stat.status] = (acc[stat.status] || 0) + stat._count.id
        return acc
      }, {} as Record<string, number>),
      bySprintType: stats.reduce((acc: Record<string, number>, stat: { sprintType: string; _count: { id: number } }) => {
        acc[stat.sprintType] = (acc[stat.sprintType] || 0) + stat._count.id
        return acc
      }, {} as Record<string, number>)
    }
  }

  private static mapToGoalWithTemplate(goal: Record<string, unknown>, template?: SprintTemplate | null): GoalWithTemplate {
    return {
      id: goal.id as string,
      userId: goal.userId as string,
      sprintType: goal.sprintType as SprintType,
      title: goal.title as string,
      description: goal.description as string | undefined,
      schedule: goal.schedule as Schedule,
      proofMethod: goal.proofMethod as string,
      startDate: goal.startDate as Date,
      endDate: goal.endDate as Date,
      status: goal.status as GoalStatus,
      streakCount: 0, // TODO: Add streakCount field to Goal model
      freezeTokens: 0, // TODO: Add freezeTokens field to Goal model
      createdAt: goal.createdAt as Date,
      updatedAt: goal.updatedAt as Date,
      template: template || undefined
    }
  }
}