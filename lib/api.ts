import { Habit, CreateHabitRequest, UpdateHabitRequest, ApiResponse } from './types'

const API_BASE_URL = '/api'

// Generic API helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Something went wrong' }
    }

    return { data }
  } catch (error) {
    return { error: 'Network error occurred' }
  }
}

// Habit API functions
export const habitApi = {
  // Get all habits
  getAll: async (): Promise<ApiResponse<{ habits: Habit[] }>> => {
    return apiRequest<{ habits: Habit[] }>('/habits')
  },

  // Get a specific habit
  getById: async (id: number): Promise<ApiResponse<{ habit: Habit }>> => {
    return apiRequest<{ habit: Habit }>(`/habits/${id}`)
  },

  // Create a new habit
  create: async (habit: CreateHabitRequest): Promise<ApiResponse<{ habit: Habit }>> => {
    return apiRequest<{ habit: Habit }>('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    })
  },

  // Update a habit
  update: async (id: number, habit: UpdateHabitRequest): Promise<ApiResponse<{ habit: Habit }>> => {
    return apiRequest<{ habit: Habit }>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(habit),
    })
  },

  // Delete a habit
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/habits/${id}`, {
      method: 'DELETE',
    })
  },

  // Mark habit as completed
  complete: async (id: number): Promise<ApiResponse<{ habit: Habit; message: string }>> => {
    return apiRequest<{ habit: Habit; message: string }>(`/habits/${id}/complete`, {
      method: 'POST',
    })
  },
}

// Usage example:
// const { data, error } = await habitApi.getAll()
// if (error) {
//   console.error('Error:', error)
// } else {
//   console.log('Habits:', data?.habits)
// }