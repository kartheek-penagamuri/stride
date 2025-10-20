'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SprintType } from '@/types'
import { Users, ArrowRight, Clock, Globe } from 'lucide-react'

interface MatchingQuickStartProps {
  sprintType: SprintType
  className?: string
}

export function MatchingQuickStart({ sprintType, className = '' }: MatchingQuickStartProps) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  const handleStartMatching = async () => {
    setIsStarting(true)
    try {
      router.push(`/matching?sprint=${sprintType}`)
    } catch (error) {
      console.error('Error starting matching:', error)
      setIsStarting(false)
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

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Find Your Learning Pod
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Get matched with 2-4 compatible learners for your {formatSprintType(sprintType)} sprint.
            We&apos;ll find people with similar schedules and learning styles.
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Usually takes &lt; 5 minutes</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>Timezone-aware matching</span>
            </div>
          </div>

          <button
            onClick={handleStartMatching}
            disabled={isStarting}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Matching
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="ml-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-xs text-gray-500">
            2-4 members
          </div>
        </div>
      </div>
    </div>
  )
}

interface MatchingStatusCardProps {
  status: 'searching' | 'waitlisted' | 'matched'
  sprintType: SprintType
  expiresAt?: Date
  podId?: string
  className?: string
}

export function MatchingStatusCard({ 
  status, 
  sprintType, 
  expiresAt, 
  podId, 
  className = '' 
}: MatchingStatusCardProps) {
  const router = useRouter()

  const handleViewPod = () => {
    if (podId) {
      router.push(`/pods/${podId}`)
    }
  }

  const handleViewMatching = () => {
    router.push(`/matching?sprint=${sprintType}`)
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

  const getStatusConfig = () => {
    switch (status) {
      case 'searching':
        return {
          icon: <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />,
          title: 'Finding Your Pod',
          description: 'We\'re analyzing compatibility with other learners...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          action: { label: 'View Progress', onClick: handleViewMatching }
        }
      case 'waitlisted':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          title: 'On Waitlist',
          description: expiresAt 
            ? `We'll find matches by ${expiresAt.toLocaleDateString()}`
            : 'We\'ll notify you when compatible learners are found',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          action: { label: 'Check Status', onClick: handleViewMatching }
        }
      case 'matched':
        return {
          icon: <Users className="w-5 h-5 text-green-600" />,
          title: 'Pod Ready!',
          description: 'You\'ve been matched with compatible learners',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          action: { label: 'View Pod', onClick: handleViewPod }
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`${config.bgColor} rounded-lg border ${config.borderColor} p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {config.icon}
            <h3 className={`text-lg font-semibold ${config.textColor}`}>
              {config.title}
            </h3>
          </div>
          
          <p className="text-gray-600 mb-2">
            {formatSprintType(sprintType)} Sprint
          </p>
          
          <p className="text-gray-600 mb-4">
            {config.description}
          </p>

          <button
            onClick={config.action.onClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              status === 'matched' 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : status === 'waitlisted'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {config.action.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}