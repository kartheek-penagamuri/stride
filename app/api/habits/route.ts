import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromCookies } from '@/lib/auth'
import {
  createHabitForUser,
  ensureHabitsTable,
  ensureUsersTable,
  listHabitsForUser,
  refreshHabitCompletionStatus
} from '@/lib/db'
import { toClientHabit } from './utils'

export async function GET() {
  try {
    const user = getAuthUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUsersTable()
    await ensureHabitsTable()
    await refreshHabitCompletionStatus(user.id)

    const habits = await listHabitsForUser(user.id)
    return NextResponse.json({ habits: habits.map(toClientHabit) })
  } catch (error) {
    console.error('Failed to fetch habits:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUsersTable()
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

    return NextResponse.json({ habit: toClientHabit(habit) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create habit:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}
