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
      <div className="rounded-[32px] border border-[var(--border)] bg-white p-10 text-center space-y-8 max-w-xl w-full shadow-[0_30px_90px_rgba(0,0,0,0.12)]">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
          <div className="absolute inset-1 rounded-full border-4 border-[var(--border)]/80 border-t-[var(--accent)] animate-spin" />
          <div className="h-12 w-12 rounded-full bg-white" />
        </div>

        <div className="space-y-3">
          <p className="text-lg font-semibold text-[var(--ink)]">{displayMessage}</p>
          <p className="text-sm text-[var(--muted)]">
            Our AI is sketching the cue, action, and reward so you get a thoughtful stack.
          </p>
        </div>

        {showTimeout && (
          <div className="rounded-2xl border border-[var(--accent-soft)] bg-white p-4 text-left space-y-1">
            <p className="text-sm font-semibold text-[var(--muted)]">This is taking a bit longer.</p>
            <p className="text-xs text-[var(--muted)]">
              Stay with us -- your goal is safe and we&apos;re finalizing the recommendation.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-8 rounded-full bg-[var(--border)] animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
