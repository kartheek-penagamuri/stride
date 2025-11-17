'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GoalForm } from './GoalForm'
import { ClarifyingQuestionsForm } from './ClarifyingQuestionsForm'
import { LoadingState } from './LoadingState'
import { HabitReviewCard } from './HabitReviewCard'
import { AIGeneratedHabit, CreateHabitRequest, Habit, ErrorResponse, ErrorCode } from '@/lib/types'
import { habitApi, aiApi } from '@/lib/api'
import { 
  ERROR_MESSAGES, 
  getErrorMessage, 
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
  selectedHabitIds: string[]
  error: string | null
  errorCode: ErrorCode | null
  isSubmitting: boolean
  savedHabitsCount: number
  canRetry: boolean
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

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && state.step !== 'loading') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, state.step])

  const handleClose = () => {
    if (state.step !== 'loading' && state.step !== 'success' && !state.isSubmitting) {
      onClose()
    }
  }

  const handleGoalSubmit = async (goal: string) => {
    setState(prev => ({ 
      ...prev, 
      goal, 
      step: 'loading', 
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
      
    } catch (error: any) {
      console.error('Error generating questions:', error)
      
      let errorMessage: string = ERROR_MESSAGES.GENERIC
      let errorCode: ErrorCode = ERROR_CODES.AI_ERROR
      
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
      error: null, 
      errorCode: null 
    }))

    await generateHabitsWithContext(answers)
  }

  const handleSkipQuestions = async () => {
    setState(prev => ({ 
      ...prev, 
      step: 'loading', 
      error: null, 
      errorCode: null 
    }))

    await generateHabitsWithContext([])
  }

  const generateHabitsWithContext = async (answers: string[]) => {
    try {
      // Build context if answers provided
      const context = answers.length > 0 && answers.some(a => a.trim().length > 0)
        ? {
            questions: state.clarifyingQuestions,
            answers: answers
          }
        : undefined

      const response = await fetch('/api/ai/generate-habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          goal: state.goal,
          context 
        }),
        signal: AbortSignal.timeout(35000) // 35 second timeout
      })

      let data: any
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

      // Successfully generated habits
      const habits = data.habits || []
      
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
      const validHabits = habits.filter((h: any) => 
        h.id && h.title && h.cue && h.action && h.reward
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
        selectedHabitIds: allHabitIds,
        error: null,
        errorCode: null
      }))
    } catch (error: any) {
      console.error('Error generating habits:', error)
      
      let errorMessage: string = ERROR_MESSAGES.GENERIC
      let errorCode: ErrorCode = ERROR_CODES.NETWORK_ERROR
      
      // Handle specific error types
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        errorMessage = ERROR_MESSAGES.TIMEOUT
        errorCode = ERROR_CODES.TIMEOUT
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
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

    } catch (error: any) {
      console.error('Error saving habits:', error)
      
      let errorMessage: string = ERROR_MESSAGES.SAVE_FAILED
      let errorCode: ErrorCode = ERROR_CODES.SERVER_ERROR
      
      if (error.message?.includes('timeout')) {
        errorMessage = ERROR_MESSAGES.TIMEOUT
        errorCode = ERROR_CODES.TIMEOUT
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
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
      error: null,
      errorCode: null,
      canRetry: true
    }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">
          <div 
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {state.step !== 'loading' && state.step !== 'success' && (
              <button
                onClick={handleClose}
                disabled={state.isSubmitting}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 active:scale-95 z-10 p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close modal"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            )}

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="mb-6 animate-fade-in-up">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {state.step === 'input' && 'Start Your Journey'}
                  {state.step === 'questions' && 'Tell Us More'}
                  {state.step === 'loading' && 'Creating Your Habits'}
                  {state.step === 'review' && 'Review Your Habits'}
                  {state.step === 'error' && 'Oops!'}
                  {state.step === 'success' && 'Success!'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {state.step === 'input' && 'Tell us about your goal and we\'ll create personalized habits for you'}
                  {state.step === 'questions' && 'Help us understand your context to create truly personalized habits'}
                  {state.step === 'loading' && 'Our AI is analyzing your goal and crafting the perfect habits'}
                  {state.step === 'review' && 'Select the habits you want to add to your dashboard'}
                  {state.step === 'error' && 'Something went wrong, but don\'t worry - we can try again'}
                  {state.step === 'success' && 'Your habits have been added to your dashboard'}
                </p>
              </div>

              {/* Step Content */}
              {state.step === 'input' && (
                <GoalForm
                  onSubmit={handleGoalSubmit}
                  isLoading={false}
                  initialValue={state.goal}
                />
              )}

              {state.step === 'questions' && (
                <ClarifyingQuestionsForm
                  questions={state.clarifyingQuestions}
                  onSubmit={handleQuestionsSubmit}
                  onSkip={handleSkipQuestions}
                  isLoading={false}
                />
              )}

              {state.step === 'loading' && (
                <LoadingState showTimeoutWarning={true} />
              )}

              {state.step === 'review' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Habits List */}
                  <div className="space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {state.generatedHabits.map((habit, index) => (
                      <div 
                        key={habit.id}
                        className="animate-slide-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <HabitReviewCard
                          habit={habit}
                          isSelected={state.selectedHabitIds.includes(habit.id)}
                          onToggle={handleHabitToggle}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Error Message */}
                  {state.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                      <div className="flex items-center">
                        <svg 
                          className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <p className="text-sm text-red-800">{state.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleClose}
                      disabled={state.isSubmitting}
                      className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddHabits}
                      disabled={state.isSubmitting || state.selectedHabitIds.length === 0}
                      className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {state.isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg 
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                            />
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        `Add ${state.selectedHabitIds.length} Habit${state.selectedHabitIds.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {state.step === 'error' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Error Display */}
                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl animate-shake">
                    <div className="flex items-start">
                      <svg 
                        className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 mb-1">
                          {state.errorCode === ERROR_CODES.RATE_LIMIT ? 'Rate Limit Reached' : 
                           state.errorCode === ERROR_CODES.TIMEOUT ? 'Request Timed Out' :
                           state.errorCode === ERROR_CODES.NETWORK_ERROR ? 'Connection Issue' :
                           state.errorCode === ERROR_CODES.INVALID_INPUT ? 'Invalid Input' :
                           'Error'}
                        </h3>
                        <p className="text-sm text-red-800">
                          {state.error || ERROR_MESSAGES.GENERIC}
                        </p>
                        {state.errorCode && (
                          <p className="text-xs text-red-600 mt-2 font-mono">
                            Error Code: {state.errorCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Help Text for Specific Errors */}
                  {state.errorCode === ERROR_CODES.RATE_LIMIT && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-800">
                        💡 <strong>Tip:</strong> Please wait a minute before trying again. This helps us maintain service quality for everyone.
                      </p>
                    </div>
                  )}
                  
                  {state.errorCode === ERROR_CODES.NETWORK_ERROR && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Check your internet connection and try again. Your goal text has been saved.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      Cancel
                    </button>
                    {state.canRetry && (
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
                      >
                        <span className="flex items-center justify-center">
                          <svg 
                            className="w-5 h-5 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                            />
                          </svg>
                          Try Again
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {state.step === 'success' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Success Display */}
                  <div className="p-6 bg-green-50 border border-green-200 rounded-xl animate-bounce-in">
                    <div className="flex items-start">
                      <svg 
                        className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900 mb-1">
                          Habits Added Successfully!
                        </h3>
                        <p className="text-sm text-green-800">
                          {state.savedHabitsCount} habit{state.savedHabitsCount !== 1 ? 's have' : ' has'} been added to your dashboard. Redirecting you now...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Loading indicator */}
                  <div className="flex justify-center">
                    <svg 
                      className="animate-spin h-8 w-8 text-indigo-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
