'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { PodSuggestionCard } from './PodSuggestionCard'
import { PodSuggestion } from '@/lib/services/matching-service'
import { SprintType } from '@/types'
import { Loader2, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface MatchingInterfaceProps {
  sprintType: SprintType
  onMatchAccepted?: (podId: string) => void
  onRematchRequested?: () => void
}

interface MatchingState {
  status: 'idle' | 'searching' | 'matches_found' | 'waitlisted' | 'matched' | 'error'
  suggestions: PodSuggestion[]
  message?: string
  expiresAt?: Date
  error?: string
}

export function MatchingInterface({ 
  sprintType, 
  onMatchAccepted, 
  onRematchRequested 
}: MatchingInterfaceProps) {
  const { data: session } = useSession()
  const [matchingState, setMatchingState] = useState<MatchingState>({
    status: 'idle',
    suggestions: []
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const requestMatching = async () => {
    if (!session?.user?.id) return

    setMatchingState({ status: 'searching', suggestions: [] })

    try {
      const response = await fetch('/api/matching/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sprintType }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to request matching')
      }

      if (result.data.status === 'waitlisted') {
        setMatchingState({
          status: 'waitlisted',
          suggestions: [],
          message: result.data.message,
          expiresAt: new Date(result.data.expiresAt)
        })
      } else if (result.data.status === 'matches_found') {
        setMatchingState({
          status: 'matches_found',
          suggestions: result.data.suggestions,
          expiresAt: new Date(result.data.expiresAt)
        })
      }

    } catch (error) {
      console.error('Matching request error:', error)
      setMatchingState({
        status: 'error',
        suggestions: [],
        error: error instanceof Error ? error.message : 'An error occurred'
      })
    }
  }

  const acceptMatch = async (suggestion: PodSuggestion) => {
    if (!session?.user?.id) return

    setIsProcessing(true)

    try {
      const requestBody = suggestion.podId
        ? {
            podId: suggestion.podId,
            sprintType,
            compatibilityScore: suggestion.compatibilityScore
          }
        : {
            memberIds: suggestion.members.map(m => m.userId),
            sprintType,
            compatibilityScore: suggestion.compatibilityScore
          }

      const response = await fetch('/api/matching/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to accept match')
      }

      setMatchingState({
        status: 'matched',
        suggestions: [],
        message: 'Successfully joined pod!'
      })

      onMatchAccepted?.(result.data.pod.id)

    } catch (error) {
      console.error('Accept match error:', error)
      setMatchingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to accept match'
      }))
    } finally {
      setIsProcessing(false)
    }
  }

  const requestRematch = async () => {
    if (!session?.user?.id) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/matching/rematch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'incompatible',
          description: 'Requested new matches'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to request rematch')
      }

      // Reset to searching state
      setMatchingState({ status: 'idle', suggestions: [] })
      onRematchRequested?.()

    } catch (error) {
      console.error('Rematch request error:', error)
      setMatchingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request rematch'
      }))
    } finally {
      setIsProcessing(false)
    }
  }

  const formatSprintType = (sprintType: SprintType) => {
    switch (sprintType) {
      case SprintType.GYM_3X_WEEK:
        return 'Gym 3×/week'
      case SprintType.NET_PROMPTING:
        return '.NET Prompting'
      default:
        return sprintType
    }
  }

  const renderContent = () => {
    switch (matchingState.status) {
      case 'idle':
        return (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Find Your Learning Pod
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get matched with 2-4 compatible learners for your {formatSprintType(sprintType)} sprint.
              We&apos;ll find people with similar timezones, experience levels, and collaboration styles.
            </p>
            <button
              onClick={requestMatching}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Start Matching
            </button>
          </div>
        )

      case 'searching':
        return (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Finding Your Perfect Pod
            </h3>
            <p className="text-gray-600">
              Analyzing compatibility with other learners...
            </p>
          </div>
        )

      case 'matches_found':
        return (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pod Matches Found!
              </h3>
              <p className="text-gray-600">
                We found {matchingState.suggestions.length} compatible pod{matchingState.suggestions.length !== 1 ? 's' : ''} for you.
                {matchingState.expiresAt && (
                  <span className="block mt-1 text-sm">
                    These matches expire on {matchingState.expiresAt.toLocaleDateString()} at {matchingState.expiresAt.toLocaleTimeString()}.
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-4">
              {matchingState.suggestions.map((suggestion, index) => (
                <PodSuggestionCard
                  key={`${suggestion.podId || 'new'}-${index}`}
                  suggestion={suggestion}
                  onAccept={acceptMatch}
                  onRematch={requestRematch}
                  isLoading={isProcessing}
                />
              ))}
            </div>
          </div>
        )

      case 'waitlisted':
        return (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Added to Waitlist
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              {matchingState.message}
            </p>
            {matchingState.expiresAt && (
              <p className="text-sm text-gray-500 mb-6">
                We&apos;ll check for new matches until {matchingState.expiresAt.toLocaleDateString()} at {matchingState.expiresAt.toLocaleTimeString()}.
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={requestMatching}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Check for New Matches
              </button>
              <div className="text-sm text-gray-500">
                <p>Tips while you wait:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Try adjusting your availability windows</li>
                  <li>• Consider a different collaboration style</li>
                  <li>• Check back during peak hours</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'matched':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Successfully Matched!
            </h3>
            <p className="text-gray-600">
              {matchingState.message}
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something Went Wrong
            </h3>
            <p className="text-red-600 mb-6">
              {matchingState.error}
            </p>
            <button
              onClick={() => setMatchingState({ status: 'idle', suggestions: [] })}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderContent()}
    </div>
  )
}