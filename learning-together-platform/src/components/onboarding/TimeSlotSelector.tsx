'use client'

import { TimeSlot } from '@/types'
import { getDayNames } from '@/lib/validations/schedule-validation'
import { X } from 'lucide-react'

interface TimeSlotSelectorProps {
  slot: TimeSlot
  onUpdate: (slot: TimeSlot) => void
  onRemove?: () => void
  label: string
  isBackup?: boolean
  error?: string
}

export function TimeSlotSelector({ 
  slot, 
  onUpdate, 
  onRemove, 
  label, 
  isBackup = false,
  error 
}: TimeSlotSelectorProps) {
  const dayNames = getDayNames()

  const handleDayChange = (dayOfWeek: number) => {
    onUpdate({ ...slot, dayOfWeek })
  }

  const handleTimeChange = (startTime: string) => {
    onUpdate({ ...slot, startTime })
  }

  const handleDurationChange = (duration: number) => {
    onUpdate({ ...slot, duration })
  }

  const getDurationOptions = () => {
    const options = []
    for (let minutes = 30; minutes <= 240; minutes += 30) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const label = hours > 0 
        ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
        : `${mins}m`
      options.push({ value: minutes, label })
    }
    return options
  }

  return (
    <div className={`p-4 border rounded-lg ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {isBackup && (
            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
              Backup
            </span>
          )}
        </label>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Day selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Day
          </label>
          <select
            value={slot.dayOfWeek}
            onChange={(e) => handleDayChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dayNames.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Time
          </label>
          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Duration selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Duration
          </label>
          <select
            value={slot.duration}
            onChange={(e) => handleDurationChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {getDurationOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}