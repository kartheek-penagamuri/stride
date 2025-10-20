import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MatchingAlgorithm, MatchingRequest } from '@/lib/services/matching-service'
import { PodService } from '@/lib/services/pod-service'
import { UserService } from '@/lib/services/user-service'
import { WaitlistService } from '@/lib/services/waitlist-service'
import { SprintType } from '@/types'

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
    const { sprintType } = body

    if (!sprintType || !Object.values(SprintType).includes(sprintType)) {
      return NextResponse.json(
        { error: { code: 'INVALID_SPRINT_TYPE', message: 'Valid sprint type is required' } },
        { status: 400 }
      )
    }

    // Get user details and preferences
    const [user, userPreferences] = await Promise.all([
      UserService.getUserById(session.user.id),
      UserService.getUserPreferences(session.user.id)
    ])
    
    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Check if user already has an active pod for this sprint type
    const userPods = await PodService.getUserPods(session.user.id)
    const existingPod = userPods.find(pod => 
      pod.sprintType === sprintType && 
      ['forming', 'active'].includes(pod.status)
    )

    if (existingPod) {
      return NextResponse.json(
        { error: { code: 'ALREADY_IN_POD', message: 'User already has an active pod for this sprint type' } },
        { status: 409 }
      )
    }

    // Create matching request
    const matchingRequest: MatchingRequest = {
      userId: session.user.id,
      sprintType,
      preferences: userPreferences,
      timezone: user.timezone
    }

    // Find potential matches
    const suggestions = await MatchingAlgorithm.findPotentialMatches(matchingRequest)

    if (suggestions.length === 0) {
      // No matches found, add to waitlist
      const waitlistEntry = await WaitlistService.addToWaitlist(matchingRequest)
      
      return NextResponse.json({
        success: true,
        data: {
          status: 'waitlisted',
          message: 'No immediate matches found. You have been added to the waitlist.',
          estimatedWaitTime: '24 hours',
          expiresAt: waitlistEntry.expiresAt,
          suggestions: []
        }
      })
    }

    // Return best matches
    return NextResponse.json({
      success: true,
      data: {
        status: 'matches_found',
        suggestions: suggestions.slice(0, 3), // Return top 3 matches
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    })

  } catch (error) {
    console.error('Matching request error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process matching request' } },
      { status: 500 }
    )
  }
}

