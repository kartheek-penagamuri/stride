import { DbHabit } from '@/lib/db'

const getDateKey = (value: Date) => value.toISOString().slice(0, 10)

const normalizeDateKey = (value?: string | null) => {
  if (!value) return null

  // Accept either bare dates (YYYY-MM-DD) or ISO strings and normalize to YYYY-MM-DD in UTC
  const isoCandidate = value.includes('T') ? value : `${value}T00:00:00Z`
  const parsed = new Date(isoCandidate)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return getDateKey(parsed)
}

export const isCompletedToday = (lastCompleted?: string | null) => {
  const lastCompletedKey = normalizeDateKey(lastCompleted)
  if (!lastCompletedKey) return false

  const todayKey = getDateKey(new Date())
  return lastCompletedKey === todayKey
}

export function toClientHabit(habit: DbHabit) {
  return {
    id: habit.id,
    title: habit.title,
    description: habit.description,
    category: habit.category,
    streak: habit.streak,
    completedToday: isCompletedToday(habit.last_completed),
    lastCompleted: habit.last_completed,
    createdAt: habit.created_at,
    updatedAt: habit.updated_at
  }
}
