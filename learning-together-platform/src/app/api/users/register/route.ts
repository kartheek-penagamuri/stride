import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import { generateTokenPair } from '@/lib/jwt'

/**
 * POST /api/users/register
 * Register a new user (for manual registration, not OAuth)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(body.email)
    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      )
    }

    // Create new user
    const user = await UserService.createUser(body)

    // Generate tokens for the new user
    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.name || undefined,
      'manual'
    )

    return NextResponse.json({
      success: true,
      data: {
        user,
        tokens,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('User registration error:', error)
    
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
          message: 'Failed to register user',
        },
      },
      { status: 500 }
    )
  }
}