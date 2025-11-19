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

// Error response from API
export interface ErrorResponse {
  error: string
  code: ErrorCode
  details?: string
}

// Error codes
export type ErrorCode = 
  | 'INVALID_INPUT' 
  | 'AI_ERROR' 
  | 'RATE_LIMIT' 
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'INVALID_API_KEY'

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

// Atomic Habits Principles
export enum AtomicPrinciple {
  OBVIOUS = 'obvious',      // Make it Obvious
  ATTRACTIVE = 'attractive', // Make it Attractive
  EASY = 'easy',            // Make it Easy
  SATISFYING = 'satisfying'  // Make it Satisfying
}

// AI-Generated Habit types
export interface AIGeneratedHabit {
  id: string                          // UUID for frontend tracking
  title: string                       // e.g., "Morning Hydration"
  cue: string                         // e.g., "After I wake up"
  action: string                      // e.g., "I will drink a full glass of water"
  reward: string                      // e.g., "I will feel refreshed and energized"
  suggestedTime: string               // e.g., "6:30 AM"
  timeReasoning: string               // e.g., "Best done immediately upon waking to kickstart metabolism"
  category: HabitCategory             // health, learning, productivity, etc.
  atomicPrinciples: AtomicPrinciple[] // Which laws apply
  stackingOrder: number               // Order in the habit stack (1-7)
}

// API Request/Response types for AI habit generation
export interface GenerateHabitsRequest {
  goal: string
  context?: {
    questions: string[]
    answers: string[]
  }
}

export interface GenerateHabitsResponse {
  habits: AIGeneratedHabit[]
  goalAnalysis: string
}

export interface GenerateClarifyingQuestionsRequest {
  goal: string
}

export interface GenerateClarifyingQuestionsResponse {
  questions: string[]
}

// OpenAI Response Schema
export interface OpenAIHabitResponse {
  goalAnalysis: string // Brief analysis of the goal (max two short paragraphs)
  habits: Array<{
    title: string
    cue: string
    action: string
    reward: string
    suggestedTime: string
    timeReasoning: string
    category: string
    atomicPrinciples: string[]
    stackingOrder: number
  }>
}
