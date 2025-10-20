import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PodService } from '@/lib/services/pod-service'
import { SprintType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sprintType = searchParams.get('sprintType') as SprintType
    const forming = searchParams.get('forming') === 'true'

    if (forming) {
      // Get pods that are actively forming
      const formingPods = await PodService.getFormingPods(sprintType)
      return NextResponse.json({
        success: true,
        data: formingPods
      })
    } else {
      // Get user's pods
      const userPods = await PodService.getUserPods(session.user.id)
      return NextResponse.json({
        success: true,
        data: userPods
      })
    }

  } catch (error) {
    console.error('Get pods error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve pods' } },
      { status: 500 }
    )
  }
}