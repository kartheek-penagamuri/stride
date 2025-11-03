// Database/API types
export interface Habit {
  id: number
  title: string
  description: string
  category: string
  streak: number
  completedToday?: boolean
  lastCompleted?: string
  totalCompletions?: number
  completedDates?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateHabitRequest {
  title: string
  description: string
  category?: string
}

export interface UpdateHabitRequest {
  title?: string
  description?: string
  category?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Habit categories
export const HABIT_CATEGORIES = {
  HEALTH: 'health',
  LEARNING: 'learning',
  PRODUCTIVITY: 'productivity',
  MINDFULNESS: 'mindfulness',
  FITNESS: 'fitness',
  GENERAL: 'general'
} as const

export type HabitCategory = typeof HABIT_CATEGORIES[keyof typeof HABIT_CATEGORIES]