'use client'

import { SprintTemplate } from '@/types'
import { Clock, Users, Target, CheckCircle } from 'lucide-react'

interface SprintTemplateCardProps {
  template: SprintTemplate
  selected: boolean
  onSelect: (templateId: string) => void
}

export function SprintTemplateCard({ template, selected, onSelect }: SprintTemplateCardProps) {
  const handleClick = () => {
    onSelect(template.id)
  }

  const getDurationText = (duration: number) => {
    if (duration >= 7) {
      const weeks = Math.floor(duration / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''}`
    }
    return `${duration} day${duration > 1 ? 's' : ''}`
  }

  const getFrequencyText = (frequency: string, defaultSlots: { dayOfWeek: number; startTime: string; duration: number }[]) => {
    if (frequency === 'weekly') {
      return `${defaultSlots.length}× per week`
    }
    return 'Daily'
  }

  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={handleClick}
    >
      {selected && (
        <div className="absolute top-4 right-4">
          <CheckCircle className="w-6 h-6 text-blue-500" />
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {template.name}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {template.description}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-700">
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          <span>{getDurationText(template.duration)} sprint</span>
        </div>

        <div className="flex items-center text-sm text-gray-700">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <span>{getFrequencyText(template.frequency, template.defaultSchedule.defaultSlots)} sessions</span>
        </div>

        <div className="flex items-center text-sm text-gray-700">
          <Target className="w-4 h-4 mr-2 text-gray-500" />
          <span>{template.proofMethods.length} proof method{template.proofMethods.length > 1 ? 's' : ''} available</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <strong>Proof methods:</strong> {template.proofMethods.slice(0, 2).join(', ')}
          {template.proofMethods.length > 2 && ` +${template.proofMethods.length - 2} more`}
        </div>
      </div>
    </div>
  )
}