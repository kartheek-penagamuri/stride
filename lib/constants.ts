/**
 * Error message constants for the application
 * Centralized location for all user-facing error messages
 */

// Input validation errors
export const INPUT_ERRORS = {
  EMPTY_GOAL: 'Please enter your goal to get started',
  GOAL_TOO_SHORT: 'Please provide more details about your goal (at least 10 characters)',
  GOAL_TOO_LONG: 'Please keep your goal under 500 characters',
  INVALID_INPUT: 'Invalid input. Please check your entry and try again.',
} as const

// AI processing errors
export const AI_ERRORS = {
  PROCESSING_ERROR: 'We had trouble generating habits. Please try again.',
  NO_HABITS_GENERATED: 'No habits were generated. Please try with a different goal.',
  PARSE_ERROR: 'We had trouble processing the response. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  INVALID_RESPONSE: 'Received an invalid response. Please try again.',
} as const

// Network and connectivity errors
export const NETWORK_ERRORS = {
  CONNECTION_ERROR: 'Connection issue. Please check your internet and try again.',
  NETWORK_UNAVAILABLE: 'Network unavailable. Please check your connection.',
  REQUEST_FAILED: 'Request failed. Please try again.',
} as const

// Rate limiting and quota errors
export const RATE_LIMIT_ERRORS = {
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'Service quota exceeded. Please try again later.',
} as const

// Server and configuration errors
export const SERVER_ERRORS = {
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  CONFIGURATION_ERROR: 'Service configuration error. Please contact support.',
  INVALID_API_KEY: 'Service configuration error. Please contact support.',
} as const

// Habit saving errors
export const SAVE_ERRORS = {
  SAVE_FAILED: 'Failed to save habits. Please try again.',
  NO_HABITS_SELECTED: 'Please select at least one habit to continue.',
  PARTIAL_SAVE: 'Some habits could not be saved. Please try again.',
} as const

// Generic fallback error
export const GENERIC_ERROR = 'Something went wrong. Please try again later.'

// All error messages combined for easy access
export const ERROR_MESSAGES = {
  ...INPUT_ERRORS,
  ...AI_ERRORS,
  ...NETWORK_ERRORS,
  ...RATE_LIMIT_ERRORS,
  ...SERVER_ERRORS,
  ...SAVE_ERRORS,
  GENERIC: GENERIC_ERROR,
} as const

// Error codes for API responses
export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  AI_ERROR: 'AI_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

/**
 * Maps error codes to user-friendly messages
 */
export function getErrorMessage(code: ErrorCode | string): string {
  switch (code) {
    case ERROR_CODES.INVALID_INPUT:
      return ERROR_MESSAGES.INVALID_INPUT
    case ERROR_CODES.AI_ERROR:
      return ERROR_MESSAGES.PROCESSING_ERROR
    case ERROR_CODES.RATE_LIMIT:
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    case ERROR_CODES.NETWORK_ERROR:
      return ERROR_MESSAGES.CONNECTION_ERROR
    case ERROR_CODES.TIMEOUT:
      return ERROR_MESSAGES.TIMEOUT
    case ERROR_CODES.PARSE_ERROR:
      return ERROR_MESSAGES.PARSE_ERROR
    case ERROR_CODES.INVALID_API_KEY:
      return ERROR_MESSAGES.INVALID_API_KEY
    case ERROR_CODES.SERVER_ERROR:
    default:
      return ERROR_MESSAGES.GENERIC
  }
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(code: ErrorCode | string): boolean {
  const retryableCodes: string[] = [
    ERROR_CODES.AI_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.SERVER_ERROR,
  ]
  return retryableCodes.includes(code)
}

/**
 * Determines if an error requires user action (not retryable)
 */
export function requiresUserAction(code: ErrorCode | string): boolean {
  const userActionCodes: string[] = [
    ERROR_CODES.INVALID_INPUT,
    ERROR_CODES.INVALID_API_KEY,
  ]
  return userActionCodes.includes(code)
}
