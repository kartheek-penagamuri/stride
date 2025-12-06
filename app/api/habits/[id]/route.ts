import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromCookies } from '@/lib/auth'
import {
  deleteHabitForUser,
  ensureHabitsTable,
  ensureUsersTable,
  findHabitById,
  refreshHabitCompletionStatus,
  updateHabitForUser
} from '@/lib/db'
import { toClientHabit } from '../utils'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()
    await refreshHabitCompletionStatus(user.id)

    const { id } = await params
    const habitId = Number(id)
    const habit = await findHabitById(user.id, habitId)
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ habit: await toClientHabit(habit) })
  } catch (error) {
    console.error('Failed to fetch habit:', error)
    return NextResponse.json({ error: 'Failed to fetch habit' }, { status: 500 })
  }
}
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const { id } = await params
    const habitId = Number(id)
    const body = await req.json()
    const { title, description, category } = body

    const updated = await updateHabitForUser(user.id, habitId, { title, description, category })
    if (!updated) return NextResponse.json({ error: 'Unable to update habit' }, { status: 400 })

    return NextResponse.json({ habit: await toClientHabit(updated) })
  } catch (error) {
    console.error('Failed to update habit:', error)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const { id } = await params
    const habitId = Number(id)
    await deleteHabitForUser(user.id, habitId)

    return NextResponse.json({ message: 'Habit deleted' })
  } catch (error) {
    console.error('Failed to delete habit:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
