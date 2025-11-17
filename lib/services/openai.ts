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

interface OpenAIQuestionsResponse {
  questions: string[]
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
 * System prompt for asking clarifying questions
 */
const CLARIFYING_QUESTIONS_PROMPT = `You are an expert habit coach trained in James Clear's Atomic Habits methodology. 
Your role is to ask thoughtful clarifying questions to understand the user's context before creating habit recommendations.

Based on the user's goal, generate 5-7 specific, relevant questions that will help you create a truly personalized habit plan.

Questions should cover:
- Current situation and baseline
- Available time and schedule constraints
- Environment and context
- Preferences and past experiences
- Specific obstacles or challenges
- Motivation and desired outcomes

Return your response as valid JSON matching this exact structure:
{
  "questions": [
    "What does your typical daily schedule look like?",
    "What time of day do you feel most energized?",
    "What has prevented you from achieving this goal in the past?",
    "How much time can you realistically dedicate to this each day?",
    "Where will you be doing this activity? (home, gym, office, etc.)"
  ]
}

Make questions specific to their goal, conversational, and easy to answer.`

/**
 * System prompt for generating habits with context
 */
const HABIT_GENERATION_PROMPT = `You are an expert habit coach trained in James Clear's Atomic Habits methodology. 
Your role is to analyze user goals and their specific context to create personalized, actionable habit recommendations.

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
- Are tailored to the user's specific context and constraints

Return your response as valid JSON matching this exact structure:
{
  "goalAnalysis": "Brief analysis of the user's goal and context",
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
 * Generates clarifying questions based on user's goal
 */
export async function generateClarifyingQuestions(goal: string): Promise<string[]> {
  if (!goal || goal.trim().length === 0) {
    throw new OpenAIServiceError('Goal cannot be empty', 'AI_ERROR')
  }

  if (goal.length > 500) {
    throw new OpenAIServiceError('Goal is too long (max 500 characters)', 'AI_ERROR')
  }

  const client = getOpenAIClient()

  const userPrompt = `User's goal: ${goal}

Generate 5-7 clarifying questions to better understand their context and create a personalized habit plan.`

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: CLARIFYING_QUESTIONS_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new OpenAIServiceError('No response from OpenAI', 'AI_ERROR')
    }

    let parsedResponse: OpenAIQuestionsResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent)
      throw new OpenAIServiceError('Invalid JSON response from AI', 'PARSE_ERROR')
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new OpenAIServiceError('Invalid response structure from AI', 'PARSE_ERROR')
    }

    if (parsedResponse.questions.length === 0) {
      throw new OpenAIServiceError('No questions generated', 'AI_ERROR')
    }

    return parsedResponse.questions

  } catch (error: any) {
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

    console.error('OpenAI API error:', error)
    throw new OpenAIServiceError(
      error.message || 'Failed to generate questions',
      'AI_ERROR'
    )
  }
}

/**
 * Generates habit recommendations from a user's goal and context using OpenAI
 */
export async function generateHabits(
  goal: string, 
  context?: { questions: string[]; answers: string[] }
): Promise<AIGeneratedHabit[]> {
  if (!goal || goal.trim().length === 0) {
    throw new OpenAIServiceError('Goal cannot be empty', 'AI_ERROR')
  }

  if (goal.length > 500) {
    throw new OpenAIServiceError('Goal is too long (max 500 characters)', 'AI_ERROR')
  }

  const client = getOpenAIClient()

  // Build context string if provided
  let contextString = ''
  if (context && context.questions.length > 0 && context.answers.length > 0) {
    contextString = '\n\nUser Context:\n'
    context.questions.forEach((q, i) => {
      if (context.answers[i]) {
        contextString += `Q: ${q}\nA: ${context.answers[i]}\n\n`
      }
    })
  }

  const userPrompt = `User's goal: ${goal}${contextString}

Generate habit recommendations in JSON format as specified in the system prompt. Use the context provided to make the habits highly personalized.`

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: HABIT_GENERATION_PROMPT },
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
