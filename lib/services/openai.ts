import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { HabitCategory, AtomicPrinciple, AIGeneratedHabit } from '@/lib/types'

interface OpenAIHabitResponse {
  goalAnalysis: string
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

// Error types
export class OpenAIServiceError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_API_KEY' | 'AI_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'PARSE_ERROR' | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'OpenAIServiceError'
  }
}

// OpenAI client singleton
let openaiClient: OpenAI | null = null

/**
 * Validates that the OpenAI API key is configured
 */
export function validateApiKey(): boolean {
  const apiKey = process.env.OPENAI_API_KEY
  return !!(apiKey && apiKey.trim().length > 0 && apiKey.startsWith('sk-'))
}

/**
 * Gets or creates the OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  if (!validateApiKey()) {
    throw new OpenAIServiceError(
      'OpenAI API key is not configured or invalid',
      'INVALID_API_KEY'
    )
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

/**
 * System prompt for the AI habit coach
 */
const SYSTEM_PROMPT = `You are an expert habit coach trained in James Clear's Atomic Habits methodology. 
Your role is to analyze user goals and create specific, actionable habit recommendations.

For each habit, you must provide:
1. A clear, specific title
2. An explicit cue (existing behavior or specific time)
3. A simple, repeatable action
4. An immediate reward
5. Suggested time of day with reasoning
6. Which Atomic Habits principles apply (obvious, attractive, easy, satisfying)

Generate 3-7 habits that:
- Are simple and take less than 5 minutes initially
- Stack logically on each other
- Follow the format: "After [CUE], I will [ACTION], and then [REWARD]"
- Progress from easiest to more challenging
- Are specific and measurable
- Build upon each other in a logical sequence

Return your response as valid JSON matching this exact structure:
{
  "goalAnalysis": "Brief analysis of the user's goal",
  "habits": [
    {
      "title": "Habit name",
      "cue": "After I wake up",
      "action": "I will drink a full glass of water",
      "reward": "I will feel refreshed and energized",
      "suggestedTime": "6:30 AM",
      "timeReasoning": "Best done immediately upon waking",
      "category": "health",
      "atomicPrinciples": ["obvious", "easy"],
      "stackingOrder": 1
    }
  ]
}

Categories must be one of: health, learning, productivity, mindfulness, fitness, general
Atomic principles must be from: obvious, attractive, easy, satisfying
Stacking order should be 1-7 based on logical sequence.`

/**
 * Generates habit recommendations from a user's goal using OpenAI
 */
export async function generateHabits(goal: string): Promise<AIGeneratedHabit[]> {
  if (!goal || goal.trim().length === 0) {
    throw new OpenAIServiceError('Goal cannot be empty', 'AI_ERROR')
  }

  if (goal.length > 500) {
    throw new OpenAIServiceError('Goal is too long (max 500 characters)', 'AI_ERROR')
  }

  const client = getOpenAIClient()

  const userPrompt = `User's goal: ${goal}

Generate habit recommendations in JSON format as specified in the system prompt.`

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new OpenAIServiceError('No response from OpenAI', 'AI_ERROR')
    }

    // Parse the JSON response
    let parsedResponse: OpenAIHabitResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent)
      throw new OpenAIServiceError('Invalid JSON response from AI', 'PARSE_ERROR')
    }

    // Validate response structure
    if (!parsedResponse.habits || !Array.isArray(parsedResponse.habits)) {
      throw new OpenAIServiceError('Invalid response structure from AI', 'PARSE_ERROR')
    }

    if (parsedResponse.habits.length === 0) {
      throw new OpenAIServiceError('No habits generated', 'AI_ERROR')
    }

    // Transform and validate habits
    const habits = parsedResponse.habits.map((habit) => {
      // Validate required fields
      if (!habit.title || !habit.cue || !habit.action || !habit.reward) {
        throw new OpenAIServiceError('Missing required habit fields', 'PARSE_ERROR')
      }

      return {
        id: uuidv4(), // Generate unique ID for frontend tracking
        title: habit.title,
        cue: habit.cue,
        action: habit.action,
        reward: habit.reward,
        suggestedTime: habit.suggestedTime || 'Flexible',
        timeReasoning: habit.timeReasoning || 'Can be done at any convenient time',
        category: (habit.category || 'general') as HabitCategory,
        atomicPrinciples: (habit.atomicPrinciples || []) as AtomicPrinciple[],
        stackingOrder: habit.stackingOrder || 1
      }
    })

    return habits

  } catch (error: any) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAIServiceError) {
      throw error
    }

    if (error.status === 429) {
      throw new OpenAIServiceError(
        'Rate limit exceeded. Please try again in a moment.',
        'RATE_LIMIT'
      )
    }

    if (error.status === 401) {
      throw new OpenAIServiceError(
        'Invalid API key',
        'INVALID_API_KEY'
      )
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new OpenAIServiceError(
        'Request timed out. Please try again.',
        'TIMEOUT'
      )
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new OpenAIServiceError(
        'Network error. Please check your connection.',
        'NETWORK_ERROR'
      )
    }

    // Generic error
    console.error('OpenAI API error:', error)
    throw new OpenAIServiceError(
      error.message || 'Failed to generate habits',
      'AI_ERROR'
    )
  }
}
