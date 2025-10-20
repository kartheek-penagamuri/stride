import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getUserInfo } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL(`/auth/error?error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?error=MissingCode', request.url))
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      'google',
      code,
      `${request.nextUrl.origin}/api/auth/callback/google`
    )

    // Get user info
    const userInfo = await getUserInfo('google', tokens.accessToken)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          image: userInfo.picture,
          emailVerified: userInfo.verified_email ? new Date() : null,
        }
      })
    }

    // Create or update account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: userInfo.id,
        }
      },
      update: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt ? Math.floor(tokens.expiresAt / 1000) : null,
        token_type: tokens.tokenType,
        scope: tokens.scope,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: userInfo.id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt ? Math.floor(tokens.expiresAt / 1000) : null,
        token_type: tokens.tokenType,
        scope: tokens.scope,
      }
    })

    // Redirect to NextAuth callback
    const callbackUrl = `/api/auth/callback/google?code=${code}&state=${state}`
    return NextResponse.redirect(new URL(callbackUrl, request.url))

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/error?error=CallbackError', request.url))
  }
}