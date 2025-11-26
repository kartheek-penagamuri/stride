import { DbHabit } from '@/lib/db'

const getDateKey = (value: Date) => {
  // Get local date in YYYY-MM-DD format to match database date format
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeDateKey = (value?: string | null) => {
  if (!value) return null

  // Extract just the date portion (YYYY-MM-DD) to avoid timezone conversion issues
  // Database stores as "YYYY-MM-DD HH:MM:SS" - we only care about the date part
  const dateOnly = value.slice(0, 10)
  
  // Validate it's a proper date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null
  }

  return dateOnly
}

export const isCompletedToday = (lastCompleted?: string | null) => {
  const lastCompletedKey = normalizeDateKey(lastCompleted)
  if (!lastCompletedKey) return false

  const todayKey = getDateKey(new Date())
  return lastCompletedKey === todayKey
}

export async function toClientHabit(habit: DbHabit) {
  const { getHabitCompletions } = await import('@/lib/db')
  
  // Fetch completion history for this habit
  const completions = await getHabitCompletions(habit.id, habit.user_id)
  const completedDates = completions.map(c => c.completed_at)
  
  return {
    id: habit.id,
    title: habit.title,
    description: habit.description,
    category: habit.category,
    streak: habit.streak,
    completedToday: isCompletedToday(habit.last_completed),
    lastCompleted: habit.last_completed,
    totalCompletions: completions.length,
    completedDates: completedDates,
    createdAt: habit.created_at,
    updatedAt: habit.updated_at
  }
}
