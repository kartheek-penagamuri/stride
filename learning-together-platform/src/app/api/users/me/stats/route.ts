import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/users/me/stats
 * Get current user statistics
 */
export const GET = withAuth(async (request) => {
  try {
    const userId = request.user!.id

    const stats = await UserService.getUserStats(userId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user statistics',
        },
      },
      { status: 500 }
    )
  }
})