'use client'

import React, { useState, useEffect } from 'react'

interface LoadingStateProps {
  /** Optional custom status message to display */
  statusMessage?: string
  /** Whether to show the timeout warning (after 30 seconds) */
  showTimeoutWarning?: boolean
}

const LOADING_PHASES = [
  'Analyzing your goal...',
  'Applying Atomic Habits principles...',
  'Generating personalized habits...',
  'Crafting your action plan...'
]

const PHASE_DURATION = 7500 // 7.5 seconds per phase
const TIMEOUT_WARNING_THRESHOLD = 30000 // 30 seconds

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  statusMessage,
  showTimeoutWarning = false
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [showTimeout, setShowTimeout] = useState(false)

  // Cycle through loading phases
  useEffect(() => {
    if (statusMessage) return // Don't cycle if custom message provided

    const interval = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length)
    }, PHASE_DURATION)

    return () => clearInterval(interval)
  }, [statusMessage])

  // Show timeout warning after 30 seconds
  useEffect(() => {
    if (!showTimeoutWarning) return

    const timeout = setTimeout(() => {
      setShowTimeout(true)
    }, TIMEOUT_WARNING_THRESHOLD)

    return () => clearTimeout(timeout)
  }, [showTimeoutWarning])

  const displayMessage = statusMessage || LOADING_PHASES[currentPhaseIndex]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 animate-fade-in">
      {/* Animated Spinner */}
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse opacity-50" />
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-indigo-600" />
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center space-y-4">
        <p className="text-base sm:text-lg font-semibold text-gray-800 animate-pulse">
          {displayMessage}
        </p>
        
        <p className="text-xs sm:text-sm text-gray-600 max-w-md px-4">
          Our AI is working hard to create the perfect habit recommendations for you.
        </p>
      </div>

      {/* Timeout Warning */}
      {showTimeout && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-md mx-4 animate-fade-in-up">
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                This is taking longer than expected
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Please wait while we complete your request. This may take a few more moments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Dots Animation */}
      <div className="flex space-x-2 mt-6">
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
