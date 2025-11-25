# Design Document: AI Goal-to-Habits Feature

## Overview

This feature introduces an AI-powered goal analysis system that transforms user-defined goals into actionable, Atomic Habits-based recommendations. When users click "Start Your Journey" on the home page, a modal interface captures their goal, sends it to an OpenAI-powered backend service, and returns structured habit recommendations with explicit cues, actions, rewards, and optimal timing.

The system leverages OpenAI's GPT models through the official OpenAI SDK to analyze natural language goals and generate personalized habit stacks that follow James Clear's Atomic Habits framework.

## Architecture

### High-Level Flow

```
User clicks "Start Your Journey" 
  → Modal opens with goal input form
  → User enters goal and submits
  → Frontend sends POST request to /api/ai/generate-habits
  → Backend calls OpenAI API with structured prompt
  → OpenAI returns habit recommendations
  → Backend formats and validates response
  → Frontend displays habits in review interface
  → User selects habits to add
  → Selected habits saved via existing /api/habits endpoint
  → User redirected to dashboard
```

### System Components

1. **Frontend Components**
   - GoalInputModal: Main modal container
   - GoalForm: Input form with validation
   - LoadingState: AI processing indicator
   - HabitReviewList: Display generated habits
   - HabitReviewCard: Individual habit display with selection

2. **Backend Services**
   - AI Habit Generator API Route: `/api/ai/generate-habits`
   - OpenAI Service: Wrapper for OpenAI SDK interactions
   - Prompt Engineering Module: Structured prompts for habit generation

3. **Data Flow**
   - Client → API → OpenAI → API → Client
   - Client → Existing Habits API (for saving selected habits)

## Components and Interfaces

### Frontend Components

#### 1. GoalInputModal Component

**Location**: `components/GoalInputModal.tsx`

**Purpose**: Main modal container that orchestrates the goal-to-habits flow

**Props**:
```typescript
interface GoalInputModalProps {
  isOpen: boolean
  onClose: () => void
  onHabitsAdded?: (habits: Habit[]) => void
}
```

**State Management**:
```typescript
interface ModalState {
  step: 'input' | 'loading' | 'review' | 'error'
  goal: string
  generatedHabits: AIGeneratedHabit[]
  selectedHabitIds: string[]
  error: string | null
  isSubmitting: boolean
}
```

**Key Methods**:
- `handleGoalSubmit()`: Sends goal to AI API
- `handleHabitSelection()`: Toggles habit selection
- `handleAddHabits()`: Saves selected habits
- `handleRetry()`: Retries after error
- `resetModal()`: Resets to initial state

#### 2. GoalForm Component

**Location**: `components/GoalForm.tsx`

**Purpose**: Input form for goal entry with validation

**Props**:
```typescript
interface GoalFormProps {
  onSubmit: (goal: string) => void
  isLoading: boolean
  initialValue?: string
}
```

**Features**:
- Multi-line textarea (500 char limit)
- Character counter
- Placeholder with examples
- Client-side validation
- Submit button with loading state

#### 3. HabitReviewCard Component

**Location**: `components/HabitReviewCard.tsx`

**Purpose**: Display individual habit recommendation with selection control

**Props**:
```typescript
interface HabitReviewCardProps {
  habit: AIGeneratedHabit
  isSelected: boolean
  onToggle: (id: string) => void
}
```

**Display Elements**:
- Habit title
- Cue-Action-Reward breakdown
- Suggested time with reasoning
- Checkbox for selection
- Visual indicators for Atomic Habits principles

#### 4. LoadingState Component

**Location**: `components/LoadingState.tsx`

**Purpose**: Animated loading indicator during AI processing

**Features**:
- Animated spinner or progress indicator
- Status messages ("Analyzing your goal...", "Generating habits...")
- Timeout warning after 30 seconds

### Backend API Routes

#### 1. Generate Habits Endpoint

**Route**: `app/api/ai/generate-habits/route.ts`

**Method**: POST

**Request Body**:
```typescript
interface GenerateHabitsRequest {
  goal: string
}
```

**Response**:
```typescript
interface GenerateHabitsResponse {
  habits: AIGeneratedHabit[]
  goalAnalysis?: string
}

interface AIGeneratedHabit {
  id: string // Temporary ID for frontend selection
  title: string
  cue: string
  action: string
  reward: string
  suggestedTime: string
  timeReasoning: string
  category: HabitCategory
  atomicPrinciples: string[] // Which of the 4 laws apply
}
```

**Error Response**:
```typescript
interface ErrorResponse {
  error: string
  code: 'INVALID_INPUT' | 'AI_ERROR' | 'RATE_LIMIT' | 'SERVER_ERROR'
}
```

**Implementation Flow**:
1. Validate request body
2. Check for API key configuration
3. Call OpenAI service with structured prompt
4. Parse and validate AI response
5. Format habits with temporary IDs
6. Return structured response

#### 2. OpenAI Service Module

**Location**: `lib/services/openai.ts`

**Purpose**: Encapsulate OpenAI SDK interactions

**Key Functions**:

```typescript
interface OpenAIService {
  generateHabits(goal: string): Promise<AIGeneratedHabit[]>
  validateApiKey(): boolean
}
```

**Configuration**:
- API key from environment variable: `OPENAI_API_KEY`
- Model: `gpt-4-turbo-preview` or `gpt-3.5-turbo`
- Temperature: 0.7 (balance creativity and consistency)
- Max tokens: 2000

**Prompt Structure**:
```typescript
const systemPrompt = `You are an expert habit coach trained in James Clear's Atomic Habits methodology. 
Your role is to analyze user goals and create specific, actionable habit recommendations.

For each habit, you must provide:
1. A clear, specific title
2. An explicit cue (existing behavior or specific time)
3. A simple, repeatable action
4. An immediate reward
5. Suggested time of day with reasoning
6. Which Atomic Habits principles apply

Generate 3-7 habits that:
- Are simple and take less than 5 minutes initially
- Stack logically on each other
- Follow the format: "After [CUE], I will [ACTION], and then [REWARD]"
- Progress from easiest to more challenging
- Are specific and measurable`

const userPrompt = `User's goal: ${goal}

Generate habit recommendations in JSON format...`
```

## Data Models

### AIGeneratedHabit Type

```typescript
interface AIGeneratedHabit {
  id: string // UUID for frontend tracking
  title: string // e.g., "Morning Hydration"
  cue: string // e.g., "After I wake up"
  action: string // e.g., "I will drink a full glass of water"
  reward: string // e.g., "I will feel refreshed and energized"
  suggestedTime: string // e.g., "6:30 AM"
  timeReasoning: string // e.g., "Best done immediately upon waking to kickstart metabolism"
  category: HabitCategory // health, learning, productivity, etc.
  atomicPrinciples: AtomicPrinciple[] // Which laws apply
  stackingOrder: number // Order in the habit stack (1-7)
}
```

### AtomicPrinciple Enum

```typescript
enum AtomicPrinciple {
  OBVIOUS = 'obvious', // Make it Obvious
  ATTRACTIVE = 'attractive', // Make it Attractive
  EASY = 'easy', // Make it Easy
  SATISFYING = 'satisfying' // Make it Satisfying
}
```

### OpenAI Response Schema

The AI will be instructed to return JSON in this format:

```typescript
interface OpenAIHabitResponse {
  goalAnalysis: string // Brief analysis of the goal
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
```

## Error Handling

### Error Types and Handling Strategy

1. **Input Validation Errors**
   - Empty goal input
   - Goal too short (< 10 characters)
   - Goal too long (> 500 characters)
   - **Handling**: Display inline error message, prevent submission

2. **API Configuration Errors**
   - Missing OpenAI API key
   - Invalid API key
   - **Handling**: Log server-side, return generic error to client

3. **OpenAI API Errors**
   - Rate limiting (429)
   - Invalid request (400)
   - Server errors (500)
   - Timeout (> 30 seconds)
   - **Handling**: Retry logic with exponential backoff, user-friendly error messages

4. **Response Parsing Errors**
   - Invalid JSON from OpenAI
   - Missing required fields
   - **Handling**: Fallback to retry, log for debugging

5. **Network Errors**
   - Connection timeout
   - Network unavailable
   - **Handling**: Display connectivity error, offer retry

### Error Messages

```typescript
const ERROR_MESSAGES = {
  EMPTY_GOAL: 'Please enter your goal to get started',
  GOAL_TOO_SHORT: 'Please provide more details about your goal (at least 10 characters)',
  GOAL_TOO_LONG: 'Please keep your goal under 500 characters',
  AI_PROCESSING_ERROR: 'We had trouble generating habits. Please try again.',
  NETWORK_ERROR: 'Connection issue. Please check your internet and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again later.'
}
```

### Retry Logic

```typescript
interface RetryConfig {
  maxRetries: 3
  initialDelay: 1000 // ms
  maxDelay: 10000 // ms
  backoffMultiplier: 2
}
```

## Testing Strategy

### Unit Tests

1. **Frontend Components**
   - GoalInputModal state transitions
   - GoalForm validation logic
   - HabitReviewCard selection toggling
   - LoadingState timeout behavior

2. **Backend Services**
   - OpenAI service prompt construction
   - Response parsing and validation
   - Error handling for various API responses
   - Retry logic with mocked failures

3. **API Routes**
   - Request validation
   - Response formatting
   - Error response structure

### Integration Tests

1. **End-to-End Flow**
   - Modal open → goal input → AI generation → habit review → save
   - Error scenarios with retry
   - Timeout handling

2. **API Integration**
   - Mock OpenAI responses
   - Test various goal types
   - Validate habit structure

### Manual Testing Scenarios

1. **Happy Path**
   - Enter clear, specific goal
   - Verify 3-7 habits generated
   - Check habit structure (cue, action, reward, time)
   - Select and save habits
   - Verify habits appear in dashboard

2. **Edge Cases**
   - Very short goal
   - Very long goal
   - Vague goal
   - Multiple goals in one input
   - Non-English input (if supported)

3. **Error Scenarios**
   - Network disconnection during processing
   - API key issues
   - Rate limiting
   - Timeout scenarios

4. **UI/UX Testing**
   - Modal responsiveness on mobile
   - Loading state visibility
   - Error message clarity
   - Habit selection interaction

## Implementation Phases

### Phase 1: Core Infrastructure
- Set up OpenAI SDK and configuration
- Create OpenAI service module
- Implement generate-habits API route
- Basic prompt engineering

### Phase 2: Frontend Components
- Build GoalInputModal structure
- Implement GoalForm with validation
- Create LoadingState component
- Build HabitReviewCard and list

### Phase 3: Integration
- Connect modal to "Start Your Journey" button
- Wire up API calls
- Implement habit selection logic
- Connect to existing habits API for saving

### Phase 4: Polish & Error Handling
- Comprehensive error handling
- Retry logic
- Loading states and animations
- Responsive design refinement

### Phase 5: Testing & Optimization
- Unit tests
- Integration tests
- Prompt optimization based on results
- Performance optimization

## Security Considerations

1. **API Key Protection**
   - Store OpenAI API key in environment variables
   - Never expose key to client
   - Use server-side API routes only

2. **Input Sanitization**
   - Validate and sanitize goal input
   - Prevent injection attacks
   - Limit input length

3. **Rate Limiting**
   - Implement rate limiting on generate-habits endpoint
   - Prevent abuse and cost overruns
   - Consider per-user limits

4. **Error Information**
   - Don't expose internal errors to client
   - Log detailed errors server-side
   - Return generic error messages

## Performance Considerations

1. **API Response Time**
   - OpenAI typically responds in 3-10 seconds
   - Show loading state immediately
   - Implement 30-second timeout

2. **Caching Strategy**
   - Consider caching common goal patterns (future enhancement)
   - Cache OpenAI responses for identical goals (with TTL)

3. **Optimization**
   - Use streaming responses if available (future enhancement)
   - Minimize token usage in prompts
   - Efficient JSON parsing

## Dependencies

### New Dependencies to Add

```json
{
  "dependencies": {
    "openai": "^4.20.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "uuid": "^9.0.0"
  }
}
```

### Environment Variables

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

## Future Enhancements

1. **Personalization**
   - Learn from user's existing habits
   - Adapt recommendations based on completion history
   - Consider user's schedule and preferences

2. **Advanced Features**
   - Multi-step goal breakdown
   - Progress tracking for goal achievement
   - Habit difficulty adjustment over time
   - Community-shared habit templates

3. **AI Improvements**
   - Fine-tuned model for habit generation
   - Context-aware recommendations
   - Integration with calendar apps for scheduling

4. **Analytics**
   - Track which AI-generated habits have highest completion rates
   - A/B test different prompt strategies
   - Measure goal achievement correlation
