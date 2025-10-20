import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyAccessToken, extractTokenFromHeader } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name?: string
    provider?: string
  }
}

/**
 * Middleware to authenticate API routes using NextAuth JWT or custom JWT
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  user?: { id: string; email: string; name?: string; provider?: string }
  error?: string
}> {
  try {
    // First, try NextAuth JWT token
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (nextAuthToken) {
      return {
        success: true,
        user: {
          id: nextAuthToken.userId as string,
          email: nextAuthToken.email!,
          name: nextAuthToken.name || undefined,
          provider: nextAuthToken.provider as string,
        },
      }
    }

    // If no NextAuth token, try custom JWT from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
      }
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return {
        success: false,
        error: 'Invalid or expired token',
      }
    }

    return {
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        provider: payload.provider,
      },
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed',
    }
  }
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request)

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authResult.user

    return handler(authenticatedRequest)
  }
}

/**
 * Middleware to check if user has required permissions
 */
export function requirePermissions(permissions: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse> | NextResponse) => {
    return withAuth(async (request: AuthenticatedRequest) => {
      // For now, we don't have a complex permission system
      // This is a placeholder for future role-based access control
      
      // All authenticated users have basic permissions
      const userPermissions = ['read', 'write'] // This would come from database in real implementation
      
      const hasPermissions = permissions.every(permission => 
        userPermissions.includes(permission)
      )

      if (!hasPermissions) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        )
      }

      return handler(request)
    })
  }
}

/**
 * Utility to get current user from request
 */
export async function getCurrentUser(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  return authResult.success ? authResult.user : null
}