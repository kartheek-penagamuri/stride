import jwt from 'jsonwebtoken'
import { TokenPair } from '@/types'

const JWT_SECRET = process.env.NEXTAUTH_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = '30d' // 30 days

export interface JWTPayload {
  userId: string
  email: string
  name?: string
  provider?: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenVersion: number
  iat?: number
  exp?: number
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'learning-together-platform',
    audience: 'learning-together-users',
  })
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string, tokenVersion: number = 0): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId,
    tokenVersion,
  }

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'learning-together-platform',
    audience: 'learning-together-users',
  })
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(
  userId: string,
  email: string,
  name?: string,
  provider?: string,
  tokenVersion: number = 0
): TokenPair {
  const accessToken = generateAccessToken({ userId, email, name, provider })
  const refreshToken = generateRefreshToken(userId, tokenVersion)
  
  // Calculate expiration time (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  return {
    accessToken,
    refreshToken,
    expiresAt,
  }
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'learning-together-platform',
      audience: 'learning-together-users',
    }) as JWTPayload

    return decoded
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'learning-together-platform',
      audience: 'learning-together-users',
    }) as RefreshTokenPayload

    return decoded
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const decoded = jwt.decode(token)
    if (typeof decoded === 'string' || decoded === null) {
      return null
    }
    return decoded as Record<string, unknown>
  } catch (error) {
    console.error('Token decode failed:', error)
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch {
    return true
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null
    if (!decoded || !decoded.exp) return null
    
    return new Date(decoded.exp * 1000)
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}