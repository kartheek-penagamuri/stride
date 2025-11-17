'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'

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
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-800">
          Let's personalize your plan
        </h3>
        <p className="text-sm text-gray-600">
          Answer a few questions to help us create habits that truly fit your lifestyle. 
          You can skip any question or skip all to get general recommendations.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span>{answeredCount} of {questions.length} answered</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="space-y-2">
            <label 
              htmlFor={`question-${index}`} 
              className="block text-sm font-medium text-gray-700"
            >
              <span className="text-indigo-600 font-semibold">{index + 1}.</span> {question}
            </label>
            <textarea
              id={`question-${index}`}
              value={answers[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={isLoading}
              placeholder="Your answer (optional)..."
              className={`w-full px-4 py-2 rounded-lg border ${
                errors[index] ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 ${
                isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-indigo-300'
              }`}
              rows={2}
            />
          </div>
        ))}

        {/* Error Message */}
        {errors.some(e => e) && (
          <div className="text-sm text-red-600 flex items-center animate-fade-in">
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
            Please answer at least one question or skip to continue
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip All
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
              isLoading
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
                Generating...
              </span>
            ) : (
              'Generate My Habits'
            )}
          </button>
        </div>
      </form>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 text-center">
        The more details you provide, the more personalized your habit plan will be.
      </p>
    </div>
  )
}
