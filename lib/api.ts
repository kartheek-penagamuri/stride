import { 
  Habit, 
  CreateHabitRequest, 
  UpdateHabitRequest, 
  ApiResponse,
  GenerateHabitsRequest,
  GenerateHabitsResponse,
  GenerateClarifyingQuestionsRequest,
  GenerateClarifyingQuestionsResponse
} from './types'

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

  // Bulk create habits
  createBulk: async (habits: CreateHabitRequest[]): Promise<ApiResponse<{ habits: Habit[] }>> => {
    const savedHabits: Habit[] = []
    const errors: string[] = []

    for (const habit of habits) {
      const result = await apiRequest<{ habit: Habit }>('/habits', {
        method: 'POST',
        body: JSON.stringify(habit),
      })

      if (result.error) {
        errors.push(result.error)
      } else if (result.data?.habit) {
        savedHabits.push(result.data.habit)
      }
    }

    if (errors.length > 0 && savedHabits.length === 0) {
      return { error: errors[0] }
    }

    return { data: { habits: savedHabits } }
  },
}

// AI Habit Generation API functions
export const aiApi = {
  // Generate clarifying questions from a user goal
  generateClarifyingQuestions: async (goal: string): Promise<ApiResponse<GenerateClarifyingQuestionsResponse>> => {
    if (!goal || goal.trim().length === 0) {
      return { error: 'Goal cannot be empty' }
    }

    if (goal.length > 500) {
      return { error: 'Goal must be 500 characters or less' }
    }

    const request: GenerateClarifyingQuestionsRequest = { goal: goal.trim() }

    return apiRequest<GenerateClarifyingQuestionsResponse>('/ai/clarifying-questions', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Generate habits from a user goal using AI (with optional context)
  generateHabitsFromGoal: async (
    goal: string, 
    context?: { questions: string[]; answers: string[] }
  ): Promise<ApiResponse<GenerateHabitsResponse>> => {
    if (!goal || goal.trim().length === 0) {
      return { error: 'Goal cannot be empty' }
    }

    if (goal.length > 500) {
      return { error: 'Goal must be 500 characters or less' }
    }

    const request: GenerateHabitsRequest = { 
      goal: goal.trim(),
      context 
    }

    return apiRequest<GenerateHabitsResponse>('/ai/generate-habits', {
      method: 'POST',
      body: JSON.stringify(request),
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
//
// const { data, error } = await aiApi.generateHabitsFromGoal('I want to be healthier')
// if (error) {
//   console.error('Error:', error)
// } else {
//   console.log('Generated habits:', data?.habits)
// }