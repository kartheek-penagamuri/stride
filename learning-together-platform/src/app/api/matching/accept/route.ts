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
    const { podId, memberIds, sprintType, compatibilityScore } = body

    // Validate required fields
    if (!sprintType) {
      return NextResponse.json(
        { error: { code: 'MISSING_SPRINT_TYPE', message: 'Sprint type is required' } },
        { status: 400 }
      )
    }

    if (podId) {
      // Joining existing pod
      if (!podId) {
        return NextResponse.json(
          { error: { code: 'MISSING_POD_ID', message: 'Pod ID is required for joining existing pod' } },
          { status: 400 }
        )
      }

      const podDetails = await PodService.joinPod({
        userId: session.user.id,
        podId,
        matchSignals: {
          acceptedAt: new Date(),
          compatibilityScore,
          matchingMethod: 'algorithm'
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          action: 'joined_existing_pod',
          pod: podDetails
        }
      })

    } else if (memberIds && Array.isArray(memberIds)) {
      // Creating new pod
      if (!memberIds.includes(session.user.id)) {
        memberIds.push(session.user.id)
      }

      if (memberIds.length < 2 || memberIds.length > 4) {
        return NextResponse.json(
          { error: { code: 'INVALID_MEMBER_COUNT', message: 'Pod must have between 2 and 4 members' } },
          { status: 400 }
        )
      }

      const podDetails = await PodService.createPod({
        sprintType,
        memberIds,
        compatibilityScore: compatibilityScore || {
          overall: 0.8,
          timezoneMatch: 0.8,
          experienceLevel: 0.8,
          collaborationStyle: 0.8,
          availabilityOverlap: 0.8
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          action: 'created_new_pod',
          pod: podDetails
        }
      })

    } else {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Either podId or memberIds must be provided' } },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Match acceptance error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('already has an active pod')) {
        return NextResponse.json(
          { error: { code: 'ALREADY_IN_POD', message: error.message } },
          { status: 409 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        )
      }
      
      if (error.message.includes('full')) {
        return NextResponse.json(
          { error: { code: 'POD_FULL', message: error.message } },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to accept match' } },
      { status: 500 }
    )
  }
}