// Core enums and types
export enum SprintType {
  GYM_3X_WEEK = 'gym_3x_week',
  NET_PROMPTING = 'net_prompting'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PodStatus {
  FORMING = 'forming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISBANDED = 'disbanded'
}

export enum MemberRole {
  MEMBER = 'member',
  FACILITATOR = 'facilitator'
}

export enum MembershipStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed'
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum CheckInStatus {
  SUBMITTED = 'submitted',
  LATE = 'late',
  MISSED = 'missed'
}

// Schedule types
export interface TimeSlot {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:MM format
  duration: number // minutes
}

export interface Schedule {
  defaultSlots: TimeSlot[]
  backupSlot: TimeSlot
  timezone: string
  frequency: 'weekly' | 'daily'
}

// User preference types
export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  quietHours: {
    start: string // HH:MM
    end: string // HH:MM
  }
}

export interface UserPreferences {
  timezone: string
  availabilityWindows: TimeSlot[]
  notificationSettings: NotificationPreferences
  collaborationStyle: 'structured' | 'flexible' | 'casual'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

export interface IntegrationSettings {
  fitness?: {
    provider: 'strava' | 'fitbit' | 'garmin'
    connected: boolean
    lastSync?: Date
  }
  calendar?: {
    provider: 'google' | 'outlook' | 'apple'
    connected: boolean
    calendarId?: string
  }
  github?: {
    provider: 'github'
    connected: boolean
    username?: string
  }
}

// Matching types
export interface MatchingSignals {
  timezone: string
  availabilityScore: number
  experienceLevel: string
  collaborationStyle: string
  responseTime: number
}

export interface CompatibilityScore {
  overall: number
  timezoneMatch: number
  experienceLevel: number
  collaborationStyle: number
  availabilityOverlap: number
}

// Session types
export interface AgendaItem {
  id: string
  title: string
  description: string
  duration: number // minutes
  order: number
}

export interface SessionNotes {
  bullets: string[]
  keyPoints: string[]
  decisions: string[]
  timestamp: Date
}

export interface ActionItem {
  id: string
  title: string
  description: string
  assignedTo: string[]
  dueDate: Date
  priority: 'low' | 'medium' | 'high'
}

// AI Coach types
export interface Quiz {
  id: string
  questions: QuizQuestion[]
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface ProofChecklist {
  id: string
  items: ProofChecklistItem[]
  title: string
  completionRequired?: number
}

export interface ProofChecklistItem {
  id: string
  description: string
  completed: boolean
  evidence?: string
  required?: boolean
}

// Check-in types
export interface ProofSubmission {
  type: 'file' | 'text' | 'link'
  content: string
  metadata?: Record<string, unknown>
}

// Sprint Template types
export interface SprintTemplate {
  id: string
  type: SprintType
  name: string
  description: string
  duration: number // days
  frequency: 'daily' | 'weekly'
  defaultSchedule: Schedule
  proofMethods: string[]
  agendaTemplate: {
    items: AgendaItem[]
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GoalWithTemplate {
  id: string
  userId: string
  sprintType: SprintType
  title: string
  description?: string
  schedule: Schedule
  proofMethod: string
  startDate: Date
  endDate: Date
  status: GoalStatus
  streakCount: number
  freezeTokens: number
  createdAt: Date
  updatedAt: Date
  template?: SprintTemplate
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}
// NextAuth extended types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken?: string
    provider?: string
  }

  interface User {
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    accessToken?: string
    refreshToken?: string
    provider?: string
  }
}