import { PrismaClient } from '@prisma/client'
import { SprintType, SprintTemplate } from '@/types'
import { SprintTemplateService } from './sprint-template-service'

const prisma = new PrismaClient()

export class SprintService {
  /**
   * Get all active sprint templates (delegates to SprintTemplateService)
   */
  static async getActiveTemplates(): Promise<SprintTemplate[]> {
    return SprintTemplateService.getActiveTemplates()
  }

  /**
   * Get sprint template by type (delegates to SprintTemplateService)
   */
  static async getTemplateByType(type: SprintType): Promise<SprintTemplate | null> {
    const templates = await SprintTemplateService.getTemplatesByType(type)
    return templates[0] || null
  }

  /**
   * Get sprint template with usage statistics
   */
  static async getTemplateWithStats(type: SprintType) {
    const template = await this.getTemplateByType(type)
    
    if (!template) return null

    // Get usage statistics from database
    const activeGoals = await prisma.goal.count({
      where: { 
        sprintType: type,
        status: 'active'
      }
    })

    const completedGoals = await prisma.goal.count({
      where: { 
        sprintType: type,
        status: 'completed'
      }
    })

    const totalGoals = await prisma.goal.count({
      where: { sprintType: type }
    })

    return {
      template,
      stats: {
        activeGoals,
        completedGoals,
        totalGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
      }
    }
  }

  /**
   * Validate sprint template configuration (delegates to SprintTemplateService)
   */
  static async validateTemplateConfig(templateId: string): Promise<{ valid: boolean; issues: string[] }> {
    return SprintTemplateService.validateTemplateForUser(templateId, 'UTC')
  }
}