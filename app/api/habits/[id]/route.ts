import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromCookies } from '@/lib/auth'
import {
  DbHabit,
  deleteHabitForUser,
  ensureHabitsTable,
  ensureUsersTable,
  findHabitById,
  updateHabitForUser
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

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const habitId = Number(params.id)
    const habit = await findHabitById(user.id, habitId)
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ habit: toClientHabit(habit) })
  } catch (error) {
    console.error('Failed to fetch habit:', error)
    return NextResponse.json({ error: 'Failed to fetch habit' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const habitId = Number(params.id)
    const body = await req.json()
    const { title, description, category } = body

    const updated = await updateHabitForUser(user.id, habitId, { title, description, category })
    if (!updated) return NextResponse.json({ error: 'Unable to update habit' }, { status: 400 })

    return NextResponse.json({ habit: toClientHabit(updated) })
  } catch (error) {
    console.error('Failed to update habit:', error)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const habitId = Number(params.id)
    await deleteHabitForUser(user.id, habitId)

    return NextResponse.json({ message: 'Habit deleted' })
  } catch (error) {
    console.error('Failed to delete habit:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
