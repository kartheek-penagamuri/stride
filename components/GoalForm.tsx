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
    if (isOverLimit) return 'text-[#8B3A2B]'
    if (characterCount > MAX_CHARACTERS * 0.9) return 'text-[#B05A2C]'
    return 'text-[#6F5C46]'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Goal statement</p>
            <p className="text-sm text-[#70665A]">Write as if you were explaining it to a friend.</p>
          </div>
          <span className={`text-xs font-semibold ${getCharacterCountColor()}`}>
            {characterCount} / {MAX_CHARACTERS}
          </span>
        </div>
        <div
          className={`rounded-2xl border ${
            error ? 'border-[#E3C9C4] shadow-[0_0_0_1px_rgba(139,58,43,0.25)]' : 'border-[#D9D0C0]'
          } bg-white/80 transition-colors`}
        >
          <textarea
            id="goal-input"
            value={goal}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Example: I want consistent, energizing movement in the morning without adding stress to my schedule."
            className="w-full bg-transparent px-4 py-4 rounded-2xl text-base leading-relaxed text-[#1B1917] focus:outline-none focus:ring-2 focus:ring-[#1B1917]/10 disabled:cursor-not-allowed"
            rows={6}
            maxLength={MAX_CHARACTERS + 50}
          />
        </div>
        <div className="flex justify-between text-xs text-[#70665A]">
          <span>
            {isUnderMinimum && (
              <span className="text-[#B05A2C]">
                {MIN_CHARACTERS - characterCount} more characters to unlock precise suggestions
              </span>
            )}
          </span>
          {isOverLimit && <span className="text-[#8B3A2B]">Please trim your goal for clarity.</span>}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-[#8B3A2B]">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
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

      <button
        type="submit"
        disabled={isLoading || isOverLimit}
        className={`w-full rounded-[18px] py-4 px-6 text-base font-semibold tracking-tight text-white transition-all shadow-[0_18px_45px_rgba(27,25,23,0.25)] ${
          isLoading || isOverLimit ? 'bg-[#BCB3A8] cursor-not-allowed' : 'bg-[#1B1917] hover:bg-black'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Processing
          </span>
        ) : (
          'Generate my habits'
        )}
      </button>

      <p className="text-xs text-center text-[#70665A]">
        Your words stay private and only help us craft a plan rooted in the four laws.
      </p>
    </form>
  )
}
