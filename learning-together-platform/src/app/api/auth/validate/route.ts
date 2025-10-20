import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/validate
 * Validate access token and return user information
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required',
          },
        },
        { status: 400 }
      )
    }

    // Verify token
    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      )
    }

    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json({
      success: true,
      data: {
        user,
        tokenInfo: {
          userId: payload.userId,
          email: payload.email,
          provider: payload.provider,
          issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        },
      },
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate token',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/validate
 * Validate token from Authorization header (for middleware use)
 */
export async function GET(request: NextRequest) {
  return POST(request)
}