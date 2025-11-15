'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { INPUT_ERRORS } from '@/lib/constants'

interface GoalFormProps {
  onSubmit: (goal: string) => void
  isLoading: boolean
  initialValue?: string
}

const MAX_CHARACTERS = 500
const MIN_CHARACTERS = 10

export const GoalForm: React.FC<GoalFormProps> = ({ 
  onSubmit, 
  isLoading, 
  initialValue = '' 
}) => {
  const [goal, setGoal] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  const characterCount = goal.length
  const isOverLimit = characterCount > MAX_CHARACTERS
  const isUnderMinimum = characterCount > 0 && characterCount < MIN_CHARACTERS

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setGoal(value)
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate empty input
    if (!goal.trim()) {
      setError(INPUT_ERRORS.EMPTY_GOAL)
      return
    }
    
    // Validate minimum length
    if (goal.trim().length < MIN_CHARACTERS) {
      setError(INPUT_ERRORS.GOAL_TOO_SHORT)
      return
    }
    
    // Validate maximum length
    if (goal.length > MAX_CHARACTERS) {
      setError(INPUT_ERRORS.GOAL_TOO_LONG)
      return
    }
    
    // Clear error and submit
    setError(null)
    onSubmit(goal.trim())
  }

  const getCharacterCountColor = () => {
    if (isOverLimit) return 'text-red-500'
    if (characterCount > MAX_CHARACTERS * 0.9) return 'text-yellow-500'
    return 'text-gray-400'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
      <div>
        <label htmlFor="goal-input" className="block text-sm font-medium text-gray-700 mb-2">
          What goal would you like to achieve?
        </label>
        <textarea
          id="goal-input"
          value={goal}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Example: I want to improve my physical fitness and have more energy throughout the day. I currently don't exercise regularly and want to build a sustainable routine that fits into my busy schedule."
          className={`w-full px-4 py-3 rounded-xl border ${
            error ? 'border-red-500 animate-shake' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 ${
            isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-indigo-300'
          }`}
          rows={6}
          maxLength={MAX_CHARACTERS + 50} // Allow typing a bit over to show error
        />
        
        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {isUnderMinimum && (
              <span className="text-yellow-600">
                {MIN_CHARACTERS - characterCount} more characters needed
              </span>
            )}
          </div>
          <div className={`text-xs font-medium ${getCharacterCountColor()}`}>
            {characterCount} / {MAX_CHARACTERS}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
            <svg 
              className="w-4 h-4 mr-1 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isOverLimit}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
          isLoading || isOverLimit
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:scale-105 active:scale-95'
        }`}
      >
        {isLoading ? (
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
            Processing...
          </span>
        ) : (
          'Generate My Habits'
        )}
      </button>
      
      {/* Helper Text */}
      <p className="text-xs text-gray-500 text-center">
        Our AI will analyze your goal and create personalized habit recommendations based on Atomic Habits principles.
      </p>
    </form>
  )
}
