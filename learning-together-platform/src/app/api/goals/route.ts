import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GoalService, CreateGoalData } from '@/lib/services/goal-service'
import { SprintTemplateService } from '@/lib/services/sprint-template-service'
import { ifThenPlanSchema } from '@/lib/validations/schedule-validation'
import { ApiResponse, SprintType, GoalStatus } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }
      return NextResponse.json(response, { status: 401 })
    }

    const body = await request.json()

    // Validate the if-then plan data
    const planValidation = ifThenPlanSchema.safeParse(body)
    if (!planValidation.success) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid goal data',
          details: { issues: planValidation.error.issues }
        }
      }
      return NextResponse.json(response, { status: 400 })
    }

    const planData = planValidation.data

    // Validate template exists
    const template = await SprintTemplateService.getTemplateById(planData.templateId)
    if (!template) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Sprint template not found'
        }
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Calculate start and end dates
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + template.duration)

    // Create goal data
    const goalData: CreateGoalData = {
      userId: session.user.id,
      sprintType: template.type,
      title: planData.personalGoal || `${template.name} Sprint`,
      description: planData.personalGoal ?
        `${template.description}\n\nPersonal Goal: ${planData.personalGoal}` :
        template.description,
      schedule: planData.schedule,
      proofMethod: planData.proofMethod,
      startDate,
      endDate
    }

    // Create the goal
    const goal = await GoalService.createGoal(goalData)

    const response: ApiResponse = {
      success: true,
      data: {
        goal,
        nextStep: 'matching',
        message: 'Goal created successfully! You will now be matched with learning partners.'
      }
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create goal'
      }
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }
      return NextResponse.json(response, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const sprintType = searchParams.get('sprintType')

    const filters: { status?: GoalStatus; sprintType?: SprintType } = {}
    if (status) filters.status = status as GoalStatus
    if (sprintType) filters.sprintType = sprintType as SprintType

    const goals = await GoalService.getUserGoals(session.user.id, filters)

    const response: ApiResponse = {
      success: true,
      data: goals
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching goals:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch goals'
      }
    }

    return NextResponse.json(response, { status: 500 })
  }
}