import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/users/search?q=query&limit=10
 * Search users by email or name
 */
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query must be at least 2 characters long',
          },
        },
        { status: 400 }
      )
    }

    if (limit > 50) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit cannot exceed 50',
          },
        },
        { status: 400 }
      )
    }

    const users = await UserService.searchUsers(query.trim(), limit)

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search users',
        },
      },
      { status: 500 }
    )
  }
})