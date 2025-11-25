import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromCookies } from '@/lib/auth'
import {
  completeHabitForUser,
  DbHabit,
  ensureHabitsTable,
  ensureUsersTable
} from '@/lib/db'

function toClientHabit(habit: DbHabit) {
  return {
    id: habit.id,
    title: habit.title,
    description: habit.description,
    category: habit.category,
    streak: habit.streak,
    completedToday: habit.completed_today,
    lastCompleted: habit.last_completed,
    createdAt: habit.created_at,
    updatedAt: habit.updated_at
  }
}

type Params = {
  params: { id: string }
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const habitId = Number(params.id)
    const habit = await completeHabitForUser(user.id, habitId)
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ habit: toClientHabit(habit), message: 'Habit marked complete' })
  } catch (error) {
    console.error('Failed to mark habit complete:', error)
    return NextResponse.json({ error: 'Failed to mark habit complete' }, { status: 500 })
  }
}
