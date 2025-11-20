'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GoalForm } from './GoalForm'
import { ClarifyingQuestionsForm } from './ClarifyingQuestionsForm'
import { LoadingState } from './LoadingState'
import { HabitReviewCard } from './HabitReviewCard'
import { AIGeneratedHabit, CreateHabitRequest, Habit, ErrorResponse, ErrorCode, GenerateHabitsResponse } from '@/lib/types'
import { habitApi, aiApi } from '@/lib/api'
import { 
  ERROR_MESSAGES, 
  isRetryableError,
  ERROR_CODES 
} from '@/lib/constants'

interface GoalInputModalProps {
  isOpen: boolean
  onClose: () => void
  onHabitsAdded?: (habits: Habit[]) => void
}

type ModalStep = 'input' | 'questions' | 'loading' | 'review' | 'error' | 'success'

interface ModalState {
  step: ModalStep
  goal: string
  clarifyingQuestions: string[]
  answers: string[]
  generatedHabits: AIGeneratedHabit[]
  goalAnalysis: string
  selectedHabitIds: string[]
  error: string | null
  errorCode: ErrorCode | null
  isSubmitting: boolean
  savedHabitsCount: number
  canRetry: boolean
}

type TimelineStage = 'input' | 'questions' | 'review'

const STAGE_ORDER: TimelineStage[] = ['input', 'questions', 'review']

const TIMELINE_STEPS: Array<{ id: TimelineStage; title: string; description: string; optional?: boolean }> = [
  { id: 'input', title: 'Define focus', description: 'Share the change you want to see.' },
  { id: 'questions', title: 'Add context', description: 'Answer optional prompts for nuance.', optional: true },
  { id: 'review', title: 'Curate stack', description: 'Approve the rituals that resonate.' }
]

const HABIT_GENERATION_TIMEOUT_MS = 90000

const isGenerateHabitsResponse = (payload: unknown): payload is GenerateHabitsResponse => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const maybeResponse = payload as Partial<GenerateHabitsResponse>
  return Array.isArray(maybeResponse.habits) && typeof maybeResponse.goalAnalysis === 'string'
}

const STEP_COPY: Record<ModalStep, { title: string; description: string }> = {
  input: {
    title: 'Design your intention',
    description: 'Tell us what you want to change and why it matters.'
  },
  questions: {
    title: 'Add nuance',
    description: 'These prompts sharpen the plan. Answer what feels useful.'
  },
  loading: {
    title: 'Composing your stack',
    description: 'Our AI is translating your goal into cue, action, reward.'
  },
  review: {
    title: 'Review your habits',
    description: 'Select the rituals that belong on your dashboard.'
  },
  error: {
    title: "Let's adjust",
    description: 'Something interrupted the flow. Your input is still safe.'
  },
  success: {
    title: 'Habits added',
    description: 'We saved them to your dashboard and will redirect shortly.'
  }
}

export const GoalInputModal: React.FC<GoalInputModalProps> = ({
  isOpen,
  onClose,
  onHabitsAdded
}) => {
  const router = useRouter()
  const [state, setState] = useState<ModalState>({
    step: 'input',
    goal: '',
    clarifyingQuestions: [],
    answers: [],
    generatedHabits: [],
    goalAnalysis: '',
    selectedHabitIds: [],
    error: null,
    errorCode: null,
    isSubmitting: false,
    savedHabitsCount: 0,
    canRetry: true
  })

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setState({
        step: 'input',
        goal: '',
        clarifyingQuestions: [],
        answers: [],
        generatedHabits: [],
        goalAnalysis: '',
        selectedHabitIds: [],
        error: null,
        errorCode: null,
        isSubmitting: false,
        savedHabitsCount: 0,
        canRetry: true
      })
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (state.step !== 'loading' && state.step !== 'success' && !state.isSubmitting) {
      onClose()
    }
  }, [onClose, state.isSubmitting, state.step])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && state.step !== 'loading') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleClose, isOpen, state.step])

  const handleGoalSubmit = async (goal: string) => {
    setState(prev => ({ 
      ...prev, 
      goal, 
      step: 'loading', 
      goalAnalysis: '',
      error: null, 
      errorCode: null,
      canRetry: true 
    }))

    try {
      // First, generate clarifying questions
      const questionsResult = await aiApi.generateClarifyingQuestions(goal)
      
      if (questionsResult.error || !questionsResult.data) {
        throw new Error(questionsResult.error || 'Failed to generate questions')
      }

      const questions = questionsResult.data.questions

      // Move to questions step
      setState(prev => ({
        ...prev,
        step: 'questions',
        clarifyingQuestions: questions,
        answers: new Array(questions.length).fill(''),
        error: null,
        errorCode: null
      }))
      
    } catch (error) {
      console.error('Error generating questions:', error)
      
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC
      const errorCode: ErrorCode = ERROR_CODES.AI_ERROR
      
      setState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage,
        errorCode: errorCode,
        canRetry: true
      }))
    }
  }

  const handleQuestionsSubmit = async (answers: string[]) => {
    setState(prev => ({ 
      ...prev, 
      answers,
      step: 'loading', 
      goalAnalysis: '',
      error: null, 
      errorCode: null 
    }))

    await generateHabitsWithContext(answers)
  }

  const handleSkipQuestions = async () => {
    setState(prev => ({ 
      ...prev, 
      step: 'loading', 
      goalAnalysis: '',
      error: null, 
      errorCode: null 
    }))

    await generateHabitsWithContext([])
  }

  const generateHabitsWithContext = async (answers: string[]) => {
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    try {
      // Build context if answers provided
      const context = answers.length > 0 && answers.some(a => a.trim().length > 0)
        ? {
            questions: state.clarifyingQuestions,
            answers: answers
          }
        : undefined

      timeoutId = setTimeout(() => controller.abort(), HABIT_GENERATION_TIMEOUT_MS)

      const response = await fetch('/api/ai/generate-habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          goal: state.goal,
          context 
        }),
        signal: controller.signal
      })

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      let data: GenerateHabitsResponse | ErrorResponse
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        setState(prev => ({
          ...prev,
          step: 'error',
          error: ERROR_MESSAGES.PARSE_ERROR,
          errorCode: ERROR_CODES.PARSE_ERROR,
          canRetry: true
        }))
        return
      }

      if (!response.ok) {
        // Handle specific error codes from API
        const errorResponse = data as ErrorResponse
        let errorMessage = errorResponse.error || ERROR_MESSAGES.GENERIC
        let errorCode = errorResponse.code || ERROR_CODES.SERVER_ERROR
        
        // Map HTTP status codes to error messages if code not provided
        if (!errorResponse.code) {
          if (response.status === 429) {
            errorMessage = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
            errorCode = ERROR_CODES.RATE_LIMIT
          } else if (response.status === 400) {
            errorCode = ERROR_CODES.INVALID_INPUT
          } else if (response.status >= 500) {
            errorMessage = ERROR_MESSAGES.PROCESSING_ERROR
            errorCode = ERROR_CODES.AI_ERROR
          }
        }

        const canRetry = isRetryableError(errorCode)

        setState(prev => ({
          ...prev,
          step: 'error',
          error: errorMessage,
          errorCode: errorCode,
          canRetry: canRetry
        }))
        return
      }

      if (!isGenerateHabitsResponse(data)) {
        setState(prev => ({
          ...prev,
          step: 'error',
          error: ERROR_MESSAGES.INVALID_RESPONSE,
          errorCode: ERROR_CODES.PARSE_ERROR,
          canRetry: true
        }))
        return
      }

      // Successfully generated habits
      const habits = data.habits ?? []
      
      if (habits.length === 0) {
        setState(prev => ({
          ...prev,
          step: 'error',
          error: ERROR_MESSAGES.NO_HABITS_GENERATED,
          errorCode: ERROR_CODES.AI_ERROR,
          canRetry: true
        }))
        return
      }

      // Validate habit structure
      const validHabits = habits.filter((habit) => 
        Boolean(habit.id && habit.title && habit.cue && habit.action && habit.reward)
      )

      if (validHabits.length === 0) {
        setState(prev => ({
          ...prev,
          step: 'error',
          error: ERROR_MESSAGES.INVALID_RESPONSE,
          errorCode: ERROR_CODES.PARSE_ERROR,
          canRetry: true
        }))
        return
      }

      // Select all habits by default
      const allHabitIds = validHabits.map((h: AIGeneratedHabit) => h.id)

      setState(prev => ({
        ...prev,
        step: 'review',
        generatedHabits: validHabits,
        goalAnalysis: typeof data.goalAnalysis === 'string' ? data.goalAnalysis : '',
        selectedHabitIds: allHabitIds,
        error: null,
        errorCode: null
      }))
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      console.error('Error generating habits:', error)
      
      let errorMessage: string = ERROR_MESSAGES.GENERIC
      let errorCode: ErrorCode = ERROR_CODES.NETWORK_ERROR
      
      // Handle specific error types
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        errorMessage = ERROR_MESSAGES.TIMEOUT
        errorCode = ERROR_CODES.TIMEOUT
      } else if (error instanceof Error && (error.message?.includes('fetch') || error.message?.includes('network'))) {
        errorMessage = ERROR_MESSAGES.CONNECTION_ERROR
        errorCode = ERROR_CODES.NETWORK_ERROR
      }
      
      setState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage,
        errorCode: errorCode,
        canRetry: true
      }))
    }
  }

  const handleHabitToggle = (habitId: string) => {
    setState(prev => ({
      ...prev,
      selectedHabitIds: prev.selectedHabitIds.includes(habitId)
        ? prev.selectedHabitIds.filter(id => id !== habitId)
        : [...prev.selectedHabitIds, habitId]
    }))
  }

  const handleAddHabits = async () => {
    if (state.selectedHabitIds.length === 0) {
      setState(prev => ({
        ...prev,
        error: ERROR_MESSAGES.NO_HABITS_SELECTED,
        errorCode: ERROR_CODES.INVALID_INPUT
      }))
      return
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null, errorCode: null }))

    try {
      // Filter selected habits and map to CreateHabitRequest format
      const selectedHabits = state.generatedHabits
        .filter(habit => state.selectedHabitIds.includes(habit.id))
        .map((habit): CreateHabitRequest => ({
          title: habit.title,
          description: `After ${habit.cue}, ${habit.action}, and then ${habit.reward}`,
          category: habit.category
        }))

      // Save habits using bulk API function with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 30000)
      )
      
      const savePromise = habitApi.createBulk(selectedHabits)
      
      const result = await Promise.race([savePromise, timeoutPromise]) as Awaited<typeof savePromise>

      if (result.error) {
        throw new Error(result.error)
      }

      const savedHabits = result.data?.habits || []

      if (savedHabits.length === 0) {
        throw new Error('No habits were saved')
      }

      // Show success state
      setState(prev => ({
        ...prev,
        step: 'success',
        isSubmitting: false,
        savedHabitsCount: savedHabits.length,
        error: null,
        errorCode: null
      }))

      // Call callback if provided
      if (onHabitsAdded) {
        onHabitsAdded(savedHabits)
      }

      // Redirect to dashboard after showing success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('Error saving habits:', error)
      
      let errorMessage: string = ERROR_MESSAGES.SAVE_FAILED
      let errorCode: ErrorCode = ERROR_CODES.SERVER_ERROR
      
      if (error instanceof Error && error.message?.includes('timeout')) {
        errorMessage = ERROR_MESSAGES.TIMEOUT
        errorCode = ERROR_CODES.TIMEOUT
      } else if (error instanceof Error && (error.message?.includes('network') || error.message?.includes('fetch'))) {
        errorMessage = ERROR_MESSAGES.CONNECTION_ERROR
        errorCode = ERROR_CODES.NETWORK_ERROR
      }
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
        errorCode: errorCode
      }))
    }
  }

  const handleRetry = () => {
    // Preserve the goal text when retrying
    setState(prev => ({
      ...prev,
      step: 'input',
      goalAnalysis: '',
      error: null,
      errorCode: null,
      canRetry: true
    }))
  }

  const getActiveStage = (): TimelineStage => {
    if (state.step === 'review' || state.step === 'success') return 'review'
    if (state.step === 'questions') return 'questions'
    if (state.step === 'loading') {
      if (state.generatedHabits.length > 0 || state.selectedHabitIds.length > 0) {
        return 'review'
      }
      if (state.clarifyingQuestions.length > 0) {
        return 'questions'
      }
      return 'input'
    }
    if (state.step === 'error') {
      if (state.generatedHabits.length > 0 || state.selectedHabitIds.length > 0) {
        return 'review'
      }
      if (state.clarifyingQuestions.length > 0) {
        return 'questions'
      }
    }
    return 'input'
  }


  if (!isOpen) return null

  const activeStage = getActiveStage()
  const stageIndex = STAGE_ORDER.indexOf(activeStage)
  const currentCopy = STEP_COPY[state.step]

  const renderTimeline = (variant: 'dark' | 'light') => {
    const titleClass = 'text-[#2C241A]'
    const descriptionClass = variant === 'dark' ? 'text-[#6F5C46]' : 'text-[#70665A]'
    const optionalClass = 'text-[#A28D74]'
    const circleBase =
      variant === 'dark'
        ? 'border-[#D4C6B5] text-[#A28D74] bg-transparent'
        : 'border-[#E3D8C7] text-[#9C8B75] bg-white'
    const circleComplete =
      variant === 'dark'
        ? 'bg-white text-[#1B1917] border-transparent shadow-[0_6px_20px_rgba(38,32,26,0.18)]'
        : 'bg-[#E6DED2] text-[#1B1917] border-transparent'
    const circleActive = 'bg-[#1B1917] text-white border-[#1B1917]'

    return (
      <ol className="space-y-5">
        {TIMELINE_STEPS.map((step, index) => {
          const stepIndex = STAGE_ORDER.indexOf(step.id)
          const isCurrent = step.id === activeStage
          const isComplete = stepIndex < stageIndex || (state.step === 'success' && step.id === 'review')

          return (
            <li key={step.id} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full border text-xs font-semibold flex items-center justify-center ${
                  isCurrent ? circleActive : isComplete ? circleComplete : circleBase
                }`}
              >
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${titleClass}`}>{step.title}</p>
                  {step.optional && (
                    <span className={`text-[10px] uppercase tracking-[0.4em] ${optionalClass}`}>Optional</span>
                  )}
                </div>
                <p className={`text-xs ${descriptionClass}`}>{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-[#0B0704]/70 backdrop-blur-md z-40 animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div
          className="relative w-full max-w-5xl overflow-hidden rounded-[40px] border border-[#D9D0C0] bg-[#F9F5EE] shadow-[0_45px_100px_rgba(17,13,10,0.25)] grid lg:grid-cols-[280px,1fr]"
          onClick={(e) => e.stopPropagation()}
        >
          <aside className="hidden lg:flex flex-col gap-8 bg-[#F1E9DD] text-[#1B1917] p-8 border-r border-[#D9D0C0] relative overflow-hidden">
            <div className="absolute -top-8 -right-10 h-32 w-32 rounded-full bg-[#E6DED2] blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-10 -left-12 h-40 w-40 rounded-full bg-[#EFE7DA] blur-3xl" aria-hidden="true" />
            <div className="space-y-2 relative">
              <p className="text-xs uppercase tracking-[0.45em] text-[#8A7761]">Stride flow</p>
              <p className="text-xl font-semibold text-[#1B1917]">Habit Composer</p>
              <p className="text-sm text-[#574B3D]">Three gentle passes from intention to action.</p>
            </div>
            <div className="relative">{renderTimeline('dark')}</div>
            <div className="mt-auto space-y-1 text-sm text-[#6F5C46] relative">
              <p>Need a pause? Close this flow and come back without losing your goal.</p>
              <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Calm, human, grounded.</p>
            </div>
          </aside>

          <div className="relative bg-transparent">
            {state.step !== 'loading' && state.step !== 'success' && (
              <button
                onClick={handleClose}
                disabled={state.isSubmitting}
                className="absolute right-6 top-6 text-[#7C6B55] hover:text-[#1B1917] transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div className="lg:hidden border-b border-[#E6DED2] bg-[#F7F2EA] p-6 rounded-t-[24px]">{renderTimeline('light')}</div>

            <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-10 custom-scrollbar">
              <div className="space-y-3 pb-6 border-b border-[#E6DED2]">
                <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Step</p>
                <h2 className="text-2xl font-semibold text-[#1B1917]">{currentCopy.title}</h2>
                <p className="text-sm text-[#4F463A] max-w-2xl">{currentCopy.description}</p>
              </div>

              <div className="pt-6 space-y-8">
                {state.step === 'input' && (
                  <GoalForm onSubmit={handleGoalSubmit} isLoading={false} initialValue={state.goal} />
                )}

                {state.step === 'questions' && (
                  <ClarifyingQuestionsForm
                    questions={state.clarifyingQuestions}
                    onSubmit={handleQuestionsSubmit}
                    onSkip={handleSkipQuestions}
                    isLoading={false}
                  />
                )}

                {state.step === 'loading' && <LoadingState showTimeoutWarning={true} />}

                {state.step === 'review' && (
                  <div className="space-y-6">
                    {state.goalAnalysis && state.goalAnalysis.trim().length > 0 && (
                      <div className="rounded-2xl border border-[#D9D0C0] bg-[#F4EEE3] p-6 space-y-2">
                        <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Personalized overview</p>
                        <div className="space-y-2 text-sm text-[#4F463A]">
                          {state.goalAnalysis
                            .split(/\n+/)
                            .map((paragraph) => paragraph.trim())
                            .filter((paragraph) => paragraph.length > 0)
                            .map((paragraph, index) => (
                              <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {state.generatedHabits.map((habit) => (
                        <HabitReviewCard
                          key={habit.id}
                          habit={habit}
                          isSelected={state.selectedHabitIds.includes(habit.id)}
                          onToggle={handleHabitToggle}
                        />
                      ))}
                    </div>

                    {state.error && (
                      <div className="rounded-2xl border border-[#E3C9C4] bg-[#FAF2F0] p-4 text-sm text-[#8B3A2B]">
                        {state.error}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleClose}
                        disabled={state.isSubmitting}
                        className="flex-1 rounded-[18px] border border-[#CBBFAE] px-6 py-4 text-sm font-semibold text-[#4F463A] bg-white hover:bg-[#F4ECE1] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddHabits}
                        disabled={state.isSubmitting || state.selectedHabitIds.length === 0}
                        className={`flex-1 rounded-[18px] px-6 py-4 text-sm font-semibold text-white transition-colors shadow-[0_18px_45px_rgba(27,25,23,0.25)] ${
                          state.isSubmitting || state.selectedHabitIds.length === 0
                            ? 'bg-[#BCB3A8] cursor-not-allowed'
                            : 'bg-[#1B1917] hover:bg-black'
                        }`}
                      >
                        {state.isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            Saving
                          </span>
                        ) : (
                          `Add ${state.selectedHabitIds.length} habit${state.selectedHabitIds.length !== 1 ? 's' : ''}`
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {state.step === 'error' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-[#E3C9C4] bg-[#FAF1EF] p-6 space-y-2">
                      <p className="text-lg font-semibold text-[#53291E]">
                        {state.errorCode === ERROR_CODES.RATE_LIMIT
                          ? 'Too many requests'
                          : state.errorCode === ERROR_CODES.NETWORK_ERROR
                          ? 'Connection interrupted'
                          : state.errorCode === ERROR_CODES.INVALID_INPUT
                          ? 'Invalid input'
                          : 'Something went wrong'}
                      </p>
                      <p className="text-sm text-[#7C4C34]">{state.error || ERROR_MESSAGES.GENERIC}</p>
                      {state.errorCode && (
                        <p className="text-xs text-[#8B3A2B] uppercase tracking-[0.4em]">Code: {state.errorCode}</p>
                      )}
                    </div>

                    {state.errorCode === ERROR_CODES.RATE_LIMIT && (
                      <div className="rounded-2xl border border-[#E6D1A5] bg-[#F9F3E4] p-4 text-sm text-[#5E513F]">
                        Tip: pause for a minute before trying again so we can keep the experience smooth for everyone.
                      </div>
                    )}

                    {state.errorCode === ERROR_CODES.NETWORK_ERROR && (
                      <div className="rounded-2xl border border-[#CBBFAE] bg-[#F3EFE9] p-4 text-sm text-[#4F463A]">
                        Tip: check your connection and retry whenever you&apos;re ready. Your goal text is still here.
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleClose}
                        className="flex-1 rounded-[18px] border border-[#D9D0C0] px-6 py-4 text-sm font-semibold text-[#4F463A] bg-white hover:bg-[#F4ECE1] transition-colors"
                      >
                        Close
                      </button>
                      {state.canRetry && (
                        <button
                          onClick={handleRetry}
                          className="flex-1 rounded-[18px] bg-[#1B1917] px-6 py-4 text-sm font-semibold text-white hover:bg-black transition-colors shadow-[0_18px_45px_rgba(27,25,23,0.25)]"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {state.step === 'success' && (
                  <div className="space-y-6 text-center">
                    <div className="rounded-2xl border border-[#B9D5C6] bg-[#ECF4EF] p-6 space-y-2">
                      <p className="text-lg font-semibold text-[#1F2E24]">Habits added successfully</p>
                      <p className="text-sm text-[#1F2E24]">
                        {state.savedHabitsCount} habit{state.savedHabitsCount !== 1 ? 's have' : ' has'} been saved to your dashboard. Opening it now.
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="h-10 w-10 rounded-full border-2 border-[#D1E7DC] border-t-[#1F2E24] animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

