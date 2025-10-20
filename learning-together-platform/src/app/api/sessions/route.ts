import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sessionService } from '@/lib/services/session-service'
import { SessionStatus } from '@/types'
import { z } from 'zod'

const createSessionSchema = z.object({
  podId: z.string().min(1, 'Pod ID is required'),
  scheduledAt: z.string().datetime(),
  videoConfig: z.object({
    provider: z.enum(['jitsi', 'zoom', 'meet', 'external']),
    url: z.string().url().optional(),
    options: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  attendanceRequired: z.boolean().optional(),
  sessionNumber: z.number().int().positive().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    const learningSession = await sessionService.createSession({
      ...validatedData,
      scheduledAt: new Date(validatedData.scheduledAt)
    })

    return NextResponse.json({
      success: true,
      data: learningSession
    })
  } catch (error) {
    console.error('Error creating session:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create session'
        }
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const podId = searchParams.get('podId')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    if (!podId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Pod ID is required' } },
        { status: 400 }
      )
    }

    const sessions = await sessionService.getPodSessions(podId, {
      status: status as SessionStatus | undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      includeCompleted
    })

    return NextResponse.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('Error getting sessions:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get sessions'
        }
      },
      { status: 500 }
    )
  }
}