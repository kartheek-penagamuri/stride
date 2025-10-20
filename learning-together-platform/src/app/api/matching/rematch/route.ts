import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PodService } from '@/lib/services/pod-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPodId, reason, description } = body

    // Validate reason
    const validReasons = ['no_show', 'incompatible', 'schedule_conflict', 'other']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: { code: 'INVALID_REASON', message: 'Valid reason is required' } },
        { status: 400 }
      )
    }

    // Request rematch
    await PodService.requestRematch({
      userId: session.user.id,
      currentPodId,
      reason,
      description
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Rematch request processed successfully',
        status: 'available_for_matching',
        estimatedWaitTime: '24 hours'
      }
    })

  } catch (error) {
    console.error('Rematch request error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process rematch request' } },
      { status: 500 }
    )
  }
}