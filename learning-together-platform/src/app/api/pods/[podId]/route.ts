import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PodService } from '@/lib/services/pod-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ podId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { podId } = await params
    const podDetails = await PodService.getPodDetails(podId)
    
    // Check if user is a member of this pod
    const isMember = podDetails.members.some(member => member.userId === session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to this pod' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: podDetails
    })

  } catch (error) {
    console.error('Get pod details error:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pod not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve pod details' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ podId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reason } = body

    const { podId } = await params
    await PodService.leavePod(session.user.id, podId, reason)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Successfully left the pod'
      }
    })

  } catch (error) {
    console.error('Leave pod error:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pod membership not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to leave pod' } },
      { status: 500 }
    )
  }
}