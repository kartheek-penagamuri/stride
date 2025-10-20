import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/users/me
 * Get current user profile
 */
export const GET = withAuth(async (request) => {
  try {
    const userId = request.user!.id

    const user = await UserService.getUserById(userId)

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile',
        },
      },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/users/me
 * Update current user profile
 */
export const PUT = withAuth(async (request) => {
  try {
    const userId = request.user!.id
    const body = await request.json()

    const user = await UserService.updateProfile(userId, body)

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    
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
          message: 'Failed to update user profile',
        },
      },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/users/me
 * Delete current user account
 */
export const DELETE = withAuth(async (request) => {
  try {
    const userId = request.user!.id

    await UserService.deleteUser(userId)

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully',
    })
  } catch (error) {
    console.error('Delete user account error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user account',
        },
      },
      { status: 500 }
    )
  }
})