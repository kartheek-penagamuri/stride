'use client'

import { useState, useEffect } from 'react'
import { SprintTemplate, TimeSlot, Schedule } from '@/types'
import { TimeSlotSelector } from './TimeSlotSelector'
import { 
  getCommonTimezones, 
  ifThenPlanSchema, 
  type IfThenPlanInput 
} from '@/lib/validations/schedule-validation'
import { Plus, Clock, MapPin, Target } from 'lucide-react'

interface IfThenPlanBuilderProps {
  template: SprintTemplate
  onPlanComplete: (plan: IfThenPlanInput) => void
  className?: string
}

export function IfThenPlanBuilder({ template, onPlanComplete, className = '' }: IfThenPlanBuilderProps) {
  const [schedule, setSchedule] = useState<Schedule>(() => ({
    ...template.defaultSchedule,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }))
  
  const [selectedProofMethod, setSelectedProofMethod] = useState<string>('')
  const [personalGoal, setPersonalGoal] = useState<string>('')
  const [availabilityNotes, setAvailabilityNotes] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const timezones = getCommonTimezones()

  useEffect(() => {
    // Initialize with template's default schedule but user's timezone
    setSchedule(prev => ({
      ...template.defaultSchedule,
      timezone: prev.timezone
    }))
  }, [template])

  const validateAndSubmit = () => {
    const planData: IfThenPlanInput = {
      templateId: template.id,
      schedule,
      proofMethod: selectedProofMethod,
      personalGoal: personalGoal || undefined,
      availabilityNotes: availabilityNotes || undefined
    }

    const result = ifThenPlanSchema.safeParse(planData)
    
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        newErrors[path] = issue.message
      })
      setErrors(newErrors)
      return
    }

    setErrors({})
    onPlanComplete(result.data)
  }

  const updateDefaultSlot = (index: number, slot: TimeSlot) => {
    const newSlots = [...schedule.defaultSlots]
    newSlots[index] = slot
    setSchedule(prev => ({ ...prev, defaultSlots: newSlots }))
  }

  const removeDefaultSlot = (index: number) => {
    if (schedule.defaultSlots.length > 1) {
      const newSlots = schedule.defaultSlots.filter((_, i) => i !== index)
      setSchedule(prev => ({ ...prev, defaultSlots: newSlots }))
    }
  }

  const addDefaultSlot = () => {
    if (schedule.defaultSlots.length < 7) {
      const newSlot: TimeSlot = {
        dayOfWeek: 1, // Monday
        startTime: '18:00',
        duration: 90
      }
      setSchedule(prev => ({ 
        ...prev, 
        defaultSlots: [...prev.defaultSlots, newSlot] 
      }))
    }
  }

  const updateBackupSlot = (slot: TimeSlot) => {
    setSchedule(prev => ({ ...prev, backupSlot: slot }))
  }

  const updateTimezone = (timezone: string) => {
    setSchedule(prev => ({ ...prev, timezone }))
  }

  const isFormValid = () => {
    return schedule.defaultSlots.length > 0 && 
           schedule.timezone && 
           selectedProofMethod &&
           Object.keys(errors).length === 0
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Your If-Then Plan
        </h2>
        <p className="text-gray-600">
          Define when and how you&apos;ll complete your {template.name} sprint. 
          This creates accountability and makes it easier to stick to your commitment.
        </p>
      </div>

      {/* Template Summary */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Selected Sprint: {template.name}</h3>
        <p className="text-blue-800 text-sm">{template.description}</p>
      </div>

      <div className="space-y-8">
        {/* Timezone Selection */}
        <div>
          <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <MapPin className="w-5 h-5 mr-2" />
            Your Timezone
          </label>
          <select
            value={schedule.timezone}
            onChange={(e) => updateTimezone(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label} ({tz.offset})
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
          )}
        </div>

        {/* Default Time Slots */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center text-lg font-semibold text-gray-900">
              <Clock className="w-5 h-5 mr-2" />
              Regular Session Times
            </label>
            {schedule.defaultSlots.length < 7 && (
              <button
                type="button"
                onClick={addDefaultSlot}
                className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Slot
              </button>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Choose your preferred times for sessions. You need at least one slot, 
            but can add up to 7 for maximum flexibility.
          </p>

          <div className="space-y-4">
            {schedule.defaultSlots.map((slot, index) => (
              <TimeSlotSelector
                key={index}
                slot={slot}
                onUpdate={(newSlot) => updateDefaultSlot(index, newSlot)}
                onRemove={schedule.defaultSlots.length > 1 ? () => removeDefaultSlot(index) : undefined}
                label={`Session ${index + 1}`}
                error={errors[`defaultSlots.${index}`]}
              />
            ))}
          </div>
          {errors.defaultSlots && (
            <p className="mt-2 text-sm text-red-600">{errors.defaultSlots}</p>
          )}
        </div>

        {/* Backup Slot */}
        <div>
          <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <Clock className="w-5 h-5 mr-2" />
            Backup Time Slot
          </label>
          <p className="text-gray-600 text-sm mb-4">
            Choose a backup time in case your regular sessions need to be rescheduled.
            This should be different from your regular slots.
          </p>
          
          <TimeSlotSelector
            slot={schedule.backupSlot}
            onUpdate={updateBackupSlot}
            label="Backup Session"
            isBackup={true}
            error={errors.backupSlot}
          />
        </div>

        {/* Proof Method Selection */}
        <div>
          <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <Target className="w-5 h-5 mr-2" />
            How Will You Prove Completion?
          </label>
          <p className="text-gray-600 text-sm mb-4">
            Choose how you&apos;ll demonstrate that you completed each session or daily goal.
          </p>
          
          <div className="grid gap-3 md:grid-cols-2">
            {template.proofMethods.map((method) => (
              <label
                key={method}
                className={`
                  flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                  ${selectedProofMethod === method 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="proofMethod"
                  value={method}
                  checked={selectedProofMethod === method}
                  onChange={(e) => setSelectedProofMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`
                  w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                  ${selectedProofMethod === method 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                  }
                `}>
                  {selectedProofMethod === method && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">{method}</span>
              </label>
            ))}
          </div>
          {errors.proofMethod && (
            <p className="mt-2 text-sm text-red-600">{errors.proofMethod}</p>
          )}
        </div>

        {/* Optional Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              Personal Goal (Optional)
            </label>
            <p className="text-gray-600 text-sm mb-3">
              Add a specific personal goal to make this sprint more meaningful to you.
            </p>
            <textarea
              value={personalGoal}
              onChange={(e) => setPersonalGoal(e.target.value)}
              placeholder="e.g., 'Lose 10 pounds and build strength' or 'Build a complete .NET web API'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              Availability Notes (Optional)
            </label>
            <p className="text-gray-600 text-sm mb-3">
              Any additional notes about your availability or preferences for your pod partners.
            </p>
            <textarea
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              placeholder="e.g., 'I travel frequently on weekends' or 'I prefer morning sessions when possible'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={validateAndSubmit}
            disabled={!isFormValid()}
            className={`
              px-6 py-3 rounded-md font-medium transition-colors
              ${isFormValid()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue to Goal Creation
          </button>
        </div>
      </div>
    </div>
  )
}