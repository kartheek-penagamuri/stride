import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromCookies } from '@/lib/auth'
import {
  createHabitForUser,
  ensureHabitsTable,
  ensureUsersTable,
  refreshHabitCompletionStatus,
  findUserById,
  listHabitsForUser
} from '@/lib/db'
import { toClientHabit } from './utils'

function unauthorizedResponse(message = 'Unauthorized') {
  const response = NextResponse.json({ error: message }, { status: 401 })
  response.cookies.delete('stride_user')
  return response
}

export async function GET() {
  try {
    const user = getAuthUserFromCookies()
    if (!user) {
      return unauthorizedResponse()
    }

    await ensureUsersTable()
    const dbUser = await findUserById(user.id)
    if (!dbUser) {
      return unauthorizedResponse('User not found')
    }
    await ensureHabitsTable()
    await refreshHabitCompletionStatus(user.id)

    const habits = await listHabitsForUser(user.id)
    const clientHabits = await Promise.all(habits.map(h => toClientHabit(h)))
    return NextResponse.json({ habits: clientHabits })
  } catch (error) {
    console.error('Failed to fetch habits:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromCookies()
    if (!user) {
      return unauthorizedResponse()
    }

    await ensureUsersTable()
    const dbUser = await findUserById(user.id)
    if (!dbUser) {
      return unauthorizedResponse('User not found')
    }
    await ensureHabitsTable()

    const body = await request.json()
    const { title, description, category } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const habit = await createHabitForUser(user.id, {
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || 'general'
    })

    return NextResponse.json({ habit: await toClientHabit(habit) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create habit:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}
