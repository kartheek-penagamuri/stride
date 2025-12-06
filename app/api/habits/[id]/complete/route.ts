import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromCookies } from '@/lib/auth'
import {
  completeHabitForUser,
  ensureHabitsTable,
  ensureUsersTable
} from '@/lib/db'
import { toClientHabit } from '../../utils'

type Params = {
  params: Promise<{ id: string }>
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureUsersTable()
    await ensureHabitsTable()

    const { id } = await params
    const habitId = Number(id)
    const habit = await completeHabitForUser(user.id, habitId)
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ habit: await toClientHabit(habit), message: 'Habit marked complete' })
  } catch (error) {
    console.error('Failed to mark habit complete:', error)
    return NextResponse.json({ error: 'Failed to mark habit complete' }, { status: 500 })
  }
}
