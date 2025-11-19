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

type OpenAIAPIErrorLike = {
  status?: number
  code?: string | number
  message?: string
}

function isOpenAIAPIErrorLike(error: unknown): error is OpenAIAPIErrorLike {
  return typeof error === 'object' && error !== null
}

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
 * Instructions for asking clarifying questions
 */
const CLARIFYING_QUESTIONS_INSTRUCTIONS = `You are an expert habit coach trained in James Clear's Atomic Habits methodology who responds with a therapist-like level of empathy and personalization.
Your role is to ask thoughtful clarifying questions to understand the user's context before creating habit recommendations.

Guidelines:
- Analyze the user's stated goal deeply before deciding what to ask.
- Ask only the most relevant, high-leverage questions needed to craft a personalized plan; skip anything that feels like filler.
- Each question must be a single line, conversational, and easy to answer.
- Typically ask between 2 and 6 questions; exceed six only when the goal clearly spans multiple domains and more detail is essential.
- Draw from topics like baseline routines, time constraints, environment, preferences, past attempts, obstacles, or motivation as appropriate instead of covering every category by default.
- Mirror the user's tone respectfully and keep the wording concise yet supportive.

Make questions specific to their goal, conversational, and easy to answer while keeping the list as short as possible without losing essential context.`

const CLARIFYING_QUESTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      description: 'Ordered list of concise, single-line clarifying questions',
      items: {
        type: 'string',
        minLength: 1,
        description: 'A conversational clarifying question tailored to the user goal'
      },
      minItems: 1,
      maxItems: 10
    }
  }
} as const


/**
 * Instructions for generating habits with context
 */
const HABIT_GENERATION_INSTRUCTIONS = `You are an expert habit coach trained in James Clear's Atomic Habits methodology who speaks with a therapist-like blend of empathy, candor, and strategic thinking.
Your role is to analyze user goals plus their specific context to create deeply personalized, actionable habit recommendations.

Every response must include:
1. "goalAnalysis" - Summarize the user's needs, constraints, and motivational levers in no more than two short paragraphs. Keep the tone respectful, motivating, and concise, and speak directly to them using "you/your" language.
2. "habits" - An array of habit plans where each habit entry contains:
   - A clear, specific title
   - An explicit cue (existing behavior or specific time)
   - A simple, repeatable action
   - An immediate reward
   - Suggested time of day with reasoning written like a compassionate coach
   - Which Atomic Habits principles apply (obvious, attractive, easy, satisfying)

Habit generation guidelines:
- Decide dynamically how many habits are truly needed. Provide at least one habit and generally keep to six or fewer unless the user's data clearly demands more support.
- Keep each cue/action/reward sentence concise (one line) so guidance stays easy to scan.
- Ensure each habit is simple (under 5 minutes initially), stacks logically, and grows from easiest to more challenging.
- Tailor every habit to the user's schedule, environment, motivation, and prior experiences. Do not include filler habits.
- Maintain a therapist-coach tone that addresses mindset and practical execution equally.
- When referencing the user, always address them directly (e.g., "You have..." instead of "The user has...").
- Stacking order should start at 1 and increase sequentially without gaps.

Categories must be one of: health, learning, productivity, mindfulness, fitness, general
Atomic principles must be from: obvious, attractive, easy, satisfying
Stacking order should mirror the logical sequence of the habit ladder.`

const HABIT_GENERATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['goalAnalysis', 'habits'],
  properties: {
    goalAnalysis: {
      type: 'string',
      description: 'Two short paragraphs summarizing the user\'s needs, constraints, and motivations'
    },
    habits: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'title',
          'cue',
          'action',
          'reward',
          'suggestedTime',
          'timeReasoning',
          'category',
          'atomicPrinciples',
          'stackingOrder'
        ],
        properties: {
          title: { type: 'string', minLength: 1 },
          cue: { type: 'string', minLength: 1 },
          action: { type: 'string', minLength: 1 },
          reward: { type: 'string', minLength: 1 },
          suggestedTime: { type: 'string', minLength: 1 },
          timeReasoning: { type: 'string', minLength: 1 },
          category: {
            type: 'string',
            enum: ['health', 'learning', 'productivity', 'mindfulness', 'fitness', 'general']
          },
          atomicPrinciples: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['obvious', 'attractive', 'easy', 'satisfying']
            },
            minItems: 1
          },
          stackingOrder: {
            type: 'integer',
            minimum: 1
          }
        }
      }
    }
  }
} as const


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
  const userInput = `User's goal: ${goal}

Identify only the most essential clarifying questions needed to create a personalized habit plan. Default to 2-6 concise, single-line questions and exceed that range only if the goal clearly requires more context.`

  try {
    const response = await client.responses.create({
      model: 'gpt-5.1',
      instructions: CLARIFYING_QUESTIONS_INSTRUCTIONS,
      input: userInput,
      temperature: 0.7,
      max_output_tokens: 1000,
      text: {
        format: {
          type: 'json_schema',
          name: 'clarifying_questions',
          schema: CLARIFYING_QUESTIONS_SCHEMA,
          strict: true
        }
      }
    })

    const responseContent = response.output_text

    if (!responseContent) {
      throw new OpenAIServiceError('No response from OpenAI', 'AI_ERROR')
    }

    let parsedResponse: OpenAIQuestionsResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent)
      console.error('Parse error:', parseError)
      throw new OpenAIServiceError('Invalid JSON response from AI', 'PARSE_ERROR')
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new OpenAIServiceError('Invalid response structure from AI', 'PARSE_ERROR')
    }

    if (parsedResponse.questions.length === 0) {
      throw new OpenAIServiceError('No questions generated', 'AI_ERROR')
    }

    return parsedResponse.questions

  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error
    }

    if (isOpenAIAPIErrorLike(error) && error.status === 429) {
      throw new OpenAIServiceError(
        'Rate limit exceeded. Please try again in a moment.',
        'RATE_LIMIT'
      )
    }

    if (isOpenAIAPIErrorLike(error) && error.status === 401) {
      throw new OpenAIServiceError(
        'Invalid API key',
        'INVALID_API_KEY'
      )
    }

    console.error('OpenAI API error:', error)
    throw new OpenAIServiceError(
      error instanceof Error ? error.message : 'Failed to generate questions',
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
): Promise<{ goalAnalysis: string; habits: AIGeneratedHabit[] }> {
  const normalizedGoal = (goal ?? '').trim()

  if (!normalizedGoal) {
    throw new OpenAIServiceError('Goal cannot be empty', 'AI_ERROR')
  }

  if (normalizedGoal.length > 500) {
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

  const userInput = `User's goal: ${normalizedGoal}${contextString}

Summarize the goal and context in no more than two short paragraphs and generate habit recommendations in JSON exactly as specified. Choose the number of habits based on what will be most impactful (aim for six or fewer unless the context clearly justifies more) and use the provided context to personalize every detail.`

  try {
    const response = await client.responses.create({
      model: 'gpt-5.1',
      instructions: HABIT_GENERATION_INSTRUCTIONS,
      input: userInput,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      max_output_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      text: {
        format: {
          type: 'json_schema',
          name: 'habit_plan',
          schema: HABIT_GENERATION_SCHEMA,
          strict: true
        }
      }
    })

    const responseContent = response.output_text

    if (!responseContent) {
      throw new OpenAIServiceError('No response from OpenAI', 'AI_ERROR')
    }

    let parsedResponse: OpenAIHabitResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent)
      console.error('Parse error:', parseError)
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

    const goalAnalysis = typeof parsedResponse.goalAnalysis === 'string'
      ? parsedResponse.goalAnalysis.trim()
      : ''

    const fallbackGoalAnalysis = normalizedGoal
      ? `Your personalized habit plan for "${normalizedGoal}".`
      : 'Your personalized habit plan.'

    return {
      goalAnalysis: goalAnalysis || fallbackGoalAnalysis,
      habits
    }

  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAIServiceError) {
      throw error
    }

    if (isOpenAIAPIErrorLike(error) && error.status === 429) {
      throw new OpenAIServiceError(
        'Rate limit exceeded. Please try again in a moment.',
        'RATE_LIMIT'
      )
    }

    if (isOpenAIAPIErrorLike(error) && error.status === 401) {
      throw new OpenAIServiceError(
        'Invalid API key',
        'INVALID_API_KEY'
      )
    }

    if (isOpenAIAPIErrorLike(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
      throw new OpenAIServiceError(
        'Request timed out. Please try again.',
        'TIMEOUT'
      )
    }

    if (isOpenAIAPIErrorLike(error) && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
      throw new OpenAIServiceError(
        'Network error. Please check your connection.',
        'NETWORK_ERROR'
      )
    }

    // Generic error
    console.error('OpenAI API error:', error)
    throw new OpenAIServiceError(
      error instanceof Error ? error.message : 'Failed to generate habits',
      'AI_ERROR'
    )
  }
}
