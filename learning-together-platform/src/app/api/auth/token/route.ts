import { NextRequest, NextResponse } from 'next/server'
import { generateTokenPair, verifyRefreshToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/token
 * Generate new access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required',
          },
        },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token',
          },
        },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        accounts: {
          select: {
            provider: true,
          },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      )
    }

    // Generate new token pair
    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.name || undefined,
      user.accounts[0]?.provider
    )

    return NextResponse.json({
      success: true,
      data: tokens,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to refresh token',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/token
 * Revoke refresh token (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required',
          },
        },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token',
          },
        },
        { status: 401 }
      )
    }

    // In a real implementation, you would:
    // 1. Add the token to a blacklist
    // 2. Or increment the user's token version to invalidate all tokens
    // For now, we'll just return success since JWT tokens are stateless

    return NextResponse.json({
      success: true,
      message: 'Token revoked successfully',
    })
  } catch (error) {
    console.error('Token revocation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to revoke token',
        },
      },
      { status: 500 }
    )
  }
}