import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/users/me/preferences
 * Get current user preferences
 */
export const GET = withAuth(async (request) => {
  try {
    const userId = request.user!.id

    const preferences = await UserService.getUserPreferences(userId)

    return NextResponse.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    console.error('Get user preferences error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user preferences',
        },
      },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/users/me/preferences
 * Update current user preferences
 */
export const PUT = withAuth(async (request) => {
  try {
    const userId = request.user!.id
    const body = await request.json()

    const preferences = await UserService.updatePreferences(userId, body)

    return NextResponse.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    console.error('Update user preferences error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user preferences',
        },
      },
      { status: 500 }
    )
  }
})