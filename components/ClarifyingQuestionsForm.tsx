'use client'

import React, { useState, FormEvent } from 'react'

interface ClarifyingQuestionsFormProps {
  questions: string[]
  onSubmit: (answers: string[]) => void
  onSkip: () => void
  isLoading: boolean
}

export const ClarifyingQuestionsForm: React.FC<ClarifyingQuestionsFormProps> = ({ 
  questions, 
  onSubmit,
  onSkip,
  isLoading 
}) => {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''))
  const [errors, setErrors] = useState<boolean[]>(new Array(questions.length).fill(false))

  const handleChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
    
    // Clear error for this field
    if (errors[index]) {
      const newErrors = [...errors]
      newErrors[index] = false
      setErrors(newErrors)
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate that at least some questions are answered
    const answeredCount = answers.filter(a => a.trim().length > 0).length
    
    if (answeredCount === 0) {
      // Mark all as errors
      setErrors(new Array(questions.length).fill(true))
      return
    }
    
    onSubmit(answers)
  }

  const answeredCount = answers.filter(a => a.trim().length > 0).length
  const progressPercentage = (answeredCount / questions.length) * 100

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Context</p>
        <h3 className="text-2xl font-semibold text-slate-900">Tell us more about your environment.</h3>
        <p className="text-sm text-slate-500">
          These prompts are optional. Share what feels helpful and skip the rest.
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>
            {answeredCount} of {questions.length} answered
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <label htmlFor={`question-${index}`} className="block text-sm font-semibold text-slate-700">
              <span className="text-slate-400 mr-2">{index + 1}.</span>
              {question}
            </label>
            <textarea
              id={`question-${index}`}
              value={answers[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={isLoading}
              placeholder="Your answer (optional)..."
              className={`w-full rounded-2xl border ${
                errors[index] ? 'border-rose-400' : 'border-transparent'
              } bg-slate-50/60 px-4 py-3 text-sm text-slate-700 focus:border-slate-900/40 focus:outline-none focus:ring-0 disabled:cursor-not-allowed`}
              rows={2}
            />
          </div>
        ))}

        {errors.some((e) => e) && (
          <div className="flex items-center gap-2 text-sm text-rose-600">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Please answer at least one question or skip to continue.
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="rounded-[18px] border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-500 transition-colors disabled:cursor-not-allowed flex-1"
          >
            Skip all
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-[18px] px-6 py-3 text-sm font-semibold text-white transition-colors flex-1 ${
              isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Generating
              </span>
            ) : (
              'Generate my habits'
            )}
          </button>
        </div>
      </form>

      <p className="text-xs text-center text-slate-500">
        The more context you include, the more the plan fits into your life.
      </p>
    </div>
  )
}
