import bcrypt from 'bcryptjs'
import { DbUser, ensureUsersTable, findUserByEmail, insertUser } from './db'
import { cookies } from 'next/headers'

export type PublicUser = {
  id: number
  email: string
  name: string | null
  createdAt: string
}

function toPublicUser(user: DbUser): PublicUser {
  const createdAt =
    user.created_at instanceof Date
      ? user.created_at.toISOString()
      : new Date(user.created_at).toISOString()

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt
  }
}

export async function createUserAccount(params: { email: string; password: string; name?: string }) {
  const email = params.email.trim().toLowerCase()
  const password = params.password.trim()
  const name = params.name?.trim()

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  await ensureUsersTable()

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    return { error: 'An account with this email already exists.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await insertUser({ email, passwordHash, name })

  return { user: toPublicUser(user) }
}

export async function getAuthUserFromCookies() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('stride_user')
  if (!cookie?.value) return null

  try {
    const parsed = JSON.parse(cookie.value) as { id: number; email: string; name?: string }
    if (!parsed?.id || !parsed?.email) return null
    return parsed
  } catch (error) {
    console.error('Failed to parse auth cookie', error)
    return null
  }
}

export async function authenticateUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase()
  const passwordAttempt = password.trim()

  if (!email || !passwordAttempt) {
    return { error: 'Email and password are required.' }
  }

  await ensureUsersTable()

  const user = await findUserByEmail(email)
  if (!user) {
    return { error: 'No account found for this email.' }
  }

  const isValid = await bcrypt.compare(passwordAttempt, user.password_hash)
  if (!isValid) {
    return { error: 'Incorrect password.' }
  }

  return { user: toPublicUser(user) }
}
