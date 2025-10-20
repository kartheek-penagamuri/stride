import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sessionService } from '@/lib/services/session-service'

interface RouteParams {
  params: Promise<{
    sessionId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { sessionId } = await params
    const learningSession = await sessionService.getSession(sessionId)
    
    if (!learningSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: learningSession
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get session'
        }
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { sessionId } = await params
    const body = await request.json()
    const { action, reason } = body

    let updatedSession

    switch (action) {
      case 'start':
        updatedSession = await sessionService.startSession(sessionId, session.user.id)
        break
      case 'complete':
        updatedSession = await sessionService.completeSession(sessionId, session.user.id)
        break
      case 'cancel':
        updatedSession = await sessionService.cancelSession(sessionId, session.user.id, reason)
        break
      default:
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: updatedSession
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update session'
        }
      },
      { status: 500 }
    )
  }
}