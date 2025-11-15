import { NextRequest, NextResponse } from 'next/server'
import { generateHabits, OpenAIServiceError } from '@/lib/services/openai'
import { GenerateHabitsRequest, GenerateHabitsResponse, ErrorResponse, ErrorCode } from '@/lib/types'
import { 
  ERROR_MESSAGES, 
  ERROR_CODES,
  INPUT_ERRORS 
} from '@/lib/constants'

// Retry configuration
interface RetryConfig {
  maxRetries: number
  initialDelay: number // ms
  maxDelay: number // ms
  backoffMultiplier: number
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
  return Math.min(delay, config.maxDelay)
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: OpenAIServiceError): boolean {
  return error.code === 'RATE_LIMIT' || 
         error.code === 'TIMEOUT' || 
         error.code === 'NETWORK_ERROR'
}

/**
 * Execute function with retry logic and exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // If it's not a retryable error, throw immediately
      if (error instanceof OpenAIServiceError && !isRetryableError(error)) {
        throw error
      }

      // If we've exhausted retries, throw the last error
      if (attempt === config.maxRetries) {
        throw lastError
      }

      // Calculate delay and wait before retrying
      const delay = getRetryDelay(attempt, config)
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`)
      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error during retry')
}

/**
 * Validates the request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: INPUT_ERRORS.INVALID_INPUT }
  }

  if (!body.goal || typeof body.goal !== 'string') {
    return { valid: false, error: INPUT_ERRORS.INVALID_INPUT }
  }

  const goal = body.goal.trim()

  if (goal.length === 0) {
    return { valid: false, error: INPUT_ERRORS.EMPTY_GOAL }
  }

  if (goal.length < 10) {
    return { valid: false, error: INPUT_ERRORS.GOAL_TOO_SHORT }
  }

  if (goal.length > 500) {
    return { valid: false, error: INPUT_ERRORS.GOAL_TOO_LONG }
  }

  return { valid: true }
}

/**
 * Maps OpenAI service errors to client error codes
 */
function mapErrorToCode(error: OpenAIServiceError): ErrorCode {
  switch (error.code) {
    case 'RATE_LIMIT':
      return ERROR_CODES.RATE_LIMIT
    case 'INVALID_API_KEY':
      return ERROR_CODES.INVALID_API_KEY
    case 'PARSE_ERROR':
      return ERROR_CODES.PARSE_ERROR
    case 'TIMEOUT':
      return ERROR_CODES.TIMEOUT
    case 'NETWORK_ERROR':
      return ERROR_CODES.NETWORK_ERROR
    case 'AI_ERROR':
      return ERROR_CODES.AI_ERROR
    default:
      return ERROR_CODES.SERVER_ERROR
  }
}

/**
 * Gets user-friendly error message
 */
function getUserErrorMessage(error: OpenAIServiceError): string {
  switch (error.code) {
    case 'RATE_LIMIT':
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    case 'TIMEOUT':
      return ERROR_MESSAGES.TIMEOUT
    case 'NETWORK_ERROR':
      return ERROR_MESSAGES.CONNECTION_ERROR
    case 'INVALID_API_KEY':
      return ERROR_MESSAGES.INVALID_API_KEY
    case 'PARSE_ERROR':
      return ERROR_MESSAGES.PARSE_ERROR
    case 'AI_ERROR':
      return ERROR_MESSAGES.PROCESSING_ERROR
    default:
      return ERROR_MESSAGES.GENERIC
  }
}

/**
 * POST /api/ai/generate-habits
 * Generates habit recommendations from a user's goal
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: GenerateHabitsRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json<ErrorResponse>(
        { error: INPUT_ERRORS.INVALID_INPUT, code: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json<ErrorResponse>(
        { error: validation.error!, code: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    const goal = body.goal.trim()

    // Generate habits with retry logic
    const habits = await withRetry(async () => {
      return await generateHabits(goal)
    })

    // Format successful response
    const response: GenerateHabitsResponse = {
      habits,
      goalAnalysis: `Generated ${habits.length} habit${habits.length > 1 ? 's' : ''} for your goal`
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in generate-habits API:', error)

    // Handle OpenAI service errors
    if (error instanceof OpenAIServiceError) {
      const errorCode = mapErrorToCode(error)
      const errorMessage = getUserErrorMessage(error)

      const statusCode = errorCode === 'RATE_LIMIT' ? 429 : 500

      return NextResponse.json<ErrorResponse>(
        { error: errorMessage, code: errorCode },
        { status: statusCode }
      )
    }

    // Handle unexpected errors
    return NextResponse.json<ErrorResponse>(
      { error: ERROR_MESSAGES.GENERIC, code: ERROR_CODES.SERVER_ERROR },
      { status: 500 }
    )
  }
}
