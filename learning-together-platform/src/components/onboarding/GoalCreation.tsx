'use client'

import { useState } from 'react'
import { SprintTemplate } from '@/types'
import { IfThenPlanInput } from '@/lib/validations/schedule-validation'
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

interface GoalCreationProps {
  template: SprintTemplate
  plan: IfThenPlanInput
  onGoalCreated: (goalId: string) => void
  className?: string
}

export function GoalCreation({ template, plan, onGoalCreated, className = '' }: GoalCreationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCreateGoal = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(plan)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create goal')
      }

      setSuccess(true)
      setTimeout(() => {
        onGoalCreated(data.data.goal.id)
      }, 2000)
    } catch (err) {
      console.error('Error creating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeSlot = (slot: { dayOfWeek: number; startTime: string; duration: number }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const duration = slot.duration >= 60 
      ? `${Math.floor(slot.duration / 60)}h${slot.duration % 60 > 0 ? ` ${slot.duration % 60}m` : ''}`
      : `${slot.duration}m`
    return `${days[slot.dayOfWeek]} ${slot.startTime} (${duration})`
  }

  if (success) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Goal Created Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Your {template.name} sprint is ready. You&apos;ll now be matched with learning partners 
          who share similar goals and schedules.
        </p>
        <div className="animate-pulse text-blue-600">
          Redirecting to matching...
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Goal
        </h2>
        <p className="text-gray-600">
          Review your sprint setup and create your goal to start your learning journey.
        </p>
      </div>

      {/* Goal Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Summary</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Sprint Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div><strong>Type:</strong> {template.name}</div>
              <div><strong>Duration:</strong> {template.duration} days</div>
              <div><strong>Timezone:</strong> {plan.schedule.timezone}</div>
              <div><strong>Proof Method:</strong> {plan.proofMethod}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Regular Sessions:</strong></div>
              {plan.schedule.defaultSlots.map((slot, index) => (
                <div key={index} className="ml-2">
                  • {formatTimeSlot(slot)}
                </div>
              ))}
              <div className="mt-2"><strong>Backup:</strong></div>
              <div className="ml-2">
                • {formatTimeSlot(plan.schedule.backupSlot)}
              </div>
            </div>
          </div>
        </div>

        {plan.personalGoal && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Personal Goal</h4>
            <p className="text-sm text-gray-600">{plan.personalGoal}</p>
          </div>
        )}

        {plan.availabilityNotes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Availability Notes</h4>
            <p className="text-sm text-gray-600">{plan.availabilityNotes}</p>
          </div>
        )}
      </div>

      {/* What Happens Next */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">What Happens Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              1
            </div>
            <div>
              <div className="font-medium text-blue-900">Matching</div>
              <div className="text-blue-700 text-sm">
                We&apos;ll find 2-3 other learners with compatible schedules and goals
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              2
            </div>
            <div>
              <div className="font-medium text-blue-900">Pod Formation</div>
              <div className="text-blue-700 text-sm">
                Your learning pod will be created and you&apos;ll receive an invitation
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              3
            </div>
            <div>
              <div className="font-medium text-blue-900">First Session</div>
              <div className="text-blue-700 text-sm">
                Your first session will be scheduled within 24-48 hours
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <div className="font-medium text-red-800">Error Creating Goal</div>
              <div className="text-red-700 text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreateGoal}
          disabled={loading}
          className={`
            flex items-center px-8 py-3 rounded-md font-medium transition-colors
            ${loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating Goal...
            </>
          ) : (
            <>
              Create Goal & Find Partners
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}