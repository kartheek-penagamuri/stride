'use client'

import { useState, useEffect } from 'react'
import { UserPreferences, TimeSlot } from '@/types'

interface UserPreferencesFormProps {
  onSave?: (preferences: UserPreferences) => void
  onCancel?: () => void
}

export default function UserPreferencesForm({ onSave, onCancel }: UserPreferencesFormProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    timezone: 'UTC',
    availabilityWindows: [],
    notificationSettings: {
      email: true,
      push: true,
      sms: false,
      quietHours: {
        start: '22:00',
        end: '08:00',
      },
    },
    collaborationStyle: 'structured',
    experienceLevel: 'beginner',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load current preferences
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/users/me/preferences')
        if (response.ok) {
          const result = await response.json()
          setPreferences(result.data)
        }
      } catch (err) {
        console.error('Failed to load preferences:', err)
      }
    }

    loadPreferences()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update preferences')
      }

      const result = await response.json()
      onSave?.(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addAvailabilityWindow = () => {
    const newWindow: TimeSlot = {
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      duration: 60, // 1 hour
    }
    setPreferences(prev => ({
      ...prev,
      availabilityWindows: [...prev.availabilityWindows, newWindow],
    }))
  }

  const removeAvailabilityWindow = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.filter((_, i) => i !== index),
    }))
  }

  const updateAvailabilityWindow = (index: number, field: keyof TimeSlot, value: string | number) => {
    setPreferences(prev => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.map((window, i) =>
        i === index ? { ...window, [field]: value } : window
      ),
    }))
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Collaboration Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Collaboration Style
        </label>
        <div className="space-y-2">
          {(['structured', 'flexible', 'casual'] as const).map((style) => (
            <label key={style} className="flex items-center">
              <input
                type="radio"
                name="collaborationStyle"
                value={style}
                checked={preferences.collaborationStyle === style}
                onChange={(e) => setPreferences(prev => ({ ...prev, collaborationStyle: e.target.value as 'structured' | 'flexible' | 'casual' }))}
                className="mr-2"
              />
              <span className="capitalize">{style}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience Level
        </label>
        <div className="space-y-2">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <label key={level} className="flex items-center">
              <input
                type="radio"
                name="experienceLevel"
                value={level}
                checked={preferences.experienceLevel === level}
                onChange={(e) => setPreferences(prev => ({ ...prev, experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                className="mr-2"
              />
              <span className="capitalize">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification Preferences
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.notificationSettings.email}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                notificationSettings: { ...prev.notificationSettings, email: e.target.checked }
              }))}
              className="mr-2"
            />
            Email notifications
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.notificationSettings.push}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                notificationSettings: { ...prev.notificationSettings, push: e.target.checked }
              }))}
              className="mr-2"
            />
            Push notifications
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.notificationSettings.sms}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                notificationSettings: { ...prev.notificationSettings, sms: e.target.checked }
              }))}
              className="mr-2"
            />
            SMS notifications
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quiet Hours (no notifications)
        </label>
        <div className="flex space-x-4">
          <div>
            <label className="block text-xs text-gray-500">Start</label>
            <input
              type="time"
              value={preferences.notificationSettings.quietHours.start}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                notificationSettings: {
                  ...prev.notificationSettings,
                  quietHours: { ...prev.notificationSettings.quietHours, start: e.target.value }
                }
              }))}
              className="border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">End</label>
            <input
              type="time"
              value={preferences.notificationSettings.quietHours.end}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                notificationSettings: {
                  ...prev.notificationSettings,
                  quietHours: { ...prev.notificationSettings.quietHours, end: e.target.value }
                }
              }))}
              className="border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </div>
      </div>

      {/* Availability Windows */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Availability Windows
          </label>
          <button
            type="button"
            onClick={addAvailabilityWindow}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Window
          </button>
        </div>
        <div className="space-y-3">
          {preferences.availabilityWindows.map((window, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded">
              <select
                value={window.dayOfWeek}
                onChange={(e) => updateAvailabilityWindow(index, 'dayOfWeek', parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                {dayNames.map((day, dayIndex) => (
                  <option key={dayIndex} value={dayIndex}>{day}</option>
                ))}
              </select>
              <input
                type="time"
                value={window.startTime}
                onChange={(e) => updateAvailabilityWindow(index, 'startTime', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
              <select
                value={window.duration}
                onChange={(e) => updateAvailabilityWindow(index, 'duration', parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
              <button
                type="button"
                onClick={() => removeAvailabilityWindow(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}