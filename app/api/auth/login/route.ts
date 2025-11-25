import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const result = await authenticateUser(email, password)

    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || 'Unable to sign in.' }, { status: 401 })
    }

    const response = NextResponse.json({ user: result.user, message: 'Signed in.' })

    response.cookies.set('stride_user', JSON.stringify({ id: result.user.id, email: result.user.email }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Failed to log in:', error)
    return NextResponse.json({ error: 'Failed to sign in.' }, { status: 500 })
  }
}
