'use client'

import { useState } from 'react'
import { PodSuggestion } from '@/lib/services/matching-service'
import { SprintType } from '@/types'
import { Clock, Users, Globe, TrendingUp } from 'lucide-react'

interface PodSuggestionCardProps {
  suggestion: PodSuggestion
  onAccept: (suggestion: PodSuggestion) => Promise<void>
  onRematch: () => Promise<void>
  isLoading?: boolean
}

export function PodSuggestionCard({ 
  suggestion, 
  onAccept, 
  onRematch, 
  isLoading = false 
}: PodSuggestionCardProps) {
  const [accepting, setAccepting] = useState(false)
  const [rematching, setRematching] = useState(false)

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await onAccept(suggestion)
    } catch (error) {
      console.error('Error accepting match:', error)
    } finally {
      setAccepting(false)
    }
  }

  const handleRematch = async () => {
    setRematching(true)
    try {
      await onRematch()
    } catch (error) {
      console.error('Error requesting rematch:', error)
    } finally {
      setRematching(false)
    }
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent'
    if (score >= 0.6) return 'Good'
    return 'Fair'
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

  const isNewPod = !suggestion.podId
  const memberCount = suggestion.members.length
  const overallScore = suggestion.compatibilityScore.overall

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {isNewPod ? 'New Pod' : 'Join Existing Pod'}
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formatSprintType(suggestion.members[0]?.sprintType || SprintType.GYM_3X_WEEK)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                Starts {suggestion.estimatedStartDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Compatibility Score */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${getCompatibilityColor(overallScore)}`}>
            {Math.round(overallScore * 100)}%
          </div>
          <div className="text-sm text-gray-600">
            {getCompatibilityLabel(overallScore)} Match
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Pod Members</h4>
        <div className="space-y-2">
          {suggestion.members.map((member, index) => (
            <div key={member.userId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {member.userId.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Member {index + 1}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Globe className="w-3 h-3" />
                  <span>{member.timezone}</span>
                  <span>•</span>
                  <span className="capitalize">{member.preferences.experienceLevel}</span>
                  <span>•</span>
                  <span className="capitalize">{member.preferences.collaborationStyle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Compatibility Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <CompatibilityItem
            icon={<Globe className="w-4 h-4" />}
            label="Timezone"
            score={suggestion.compatibilityScore.timezoneMatch}
          />
          <CompatibilityItem
            icon={<TrendingUp className="w-4 h-4" />}
            label="Experience"
            score={suggestion.compatibilityScore.experienceLevel}
          />
          <CompatibilityItem
            icon={<Users className="w-4 h-4" />}
            label="Style"
            score={suggestion.compatibilityScore.collaborationStyle}
          />
          <CompatibilityItem
            icon={<Clock className="w-4 h-4" />}
            label="Availability"
            score={suggestion.compatibilityScore.availabilityOverlap}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={accepting || rematching || isLoading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {accepting ? 'Accepting...' : 'Accept Match'}
        </button>
        <button
          onClick={handleRematch}
          disabled={accepting || rematching || isLoading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {rematching ? 'Requesting...' : 'Request Rematch'}
        </button>
      </div>
    </div>
  )
}

interface CompatibilityItemProps {
  icon: React.ReactNode
  label: string
  score: number
}

function CompatibilityItem({ icon, label, score }: CompatibilityItemProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-sm font-medium ${getScoreColor(score)}`}>
        {Math.round(score * 100)}%
      </div>
    </div>
  )
}