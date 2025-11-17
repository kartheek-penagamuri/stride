import { NextRequest, NextResponse } from 'next/server'
import { generateClarifyingQuestions, OpenAIServiceError } from '@/lib/services/openai'
import { 
  GenerateClarifyingQuestionsRequest, 
  GenerateClarifyingQuestionsResponse, 
  ErrorResponse 
} from '@/lib/types'
import { ERROR_MESSAGES, ERROR_CODES, INPUT_ERRORS } from '@/lib/constants'

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
 * POST /api/ai/clarifying-questions
 * Generates clarifying questions based on user's goal
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: GenerateClarifyingQuestionsRequest
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

    // Generate clarifying questions
    const questions = await generateClarifyingQuestions(goal)

    // Format successful response
    const response: GenerateClarifyingQuestionsResponse = {
      questions
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in clarifying-questions API:', error)

    // Handle OpenAI service errors
    if (error instanceof OpenAIServiceError) {
      const statusCode = error.code === 'RATE_LIMIT' ? 429 : 500

      return NextResponse.json<ErrorResponse>(
        { error: error.message, code: error.code },
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
