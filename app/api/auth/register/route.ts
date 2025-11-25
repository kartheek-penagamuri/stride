import { NextRequest, NextResponse } from 'next/server'
import { createUserAccount } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    const result = await createUserAccount({ email, password, name })

    if (result.error) {
      const status = result.error.includes('exists') ? 409 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    if (!result.user) {
      return NextResponse.json({ error: 'Unable to create user.' }, { status: 500 })
    }

    const response = NextResponse.json(
      { user: result.user, message: 'Account created and saved.' },
      { status: 201 }
    )

    response.cookies.set('stride_user', JSON.stringify({ id: result.user.id, email: result.user.email }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Failed to register user:', error)
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
  }
}
