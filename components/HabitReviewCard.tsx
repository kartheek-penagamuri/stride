import React from 'react'
import { AIGeneratedHabit, AtomicPrinciple } from '@/lib/types'

interface HabitReviewCardProps {
  habit: AIGeneratedHabit
  isSelected: boolean
  onToggle: (id: string) => void
}

const PRINCIPLE_LABELS: Record<AtomicPrinciple, { label: string; color: string }> = {
  [AtomicPrinciple.OBVIOUS]: { label: 'Make it Obvious', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  [AtomicPrinciple.ATTRACTIVE]: { label: 'Make it Attractive', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  [AtomicPrinciple.EASY]: { label: 'Make it Easy', color: 'bg-green-100 text-green-700 border-green-300' },
  [AtomicPrinciple.SATISFYING]: { label: 'Make it Satisfying', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
}

export const HabitReviewCard: React.FC<HabitReviewCardProps> = ({ habit, isSelected, onToggle }) => {
  return (
    <div 
      className={`
        relative rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer
        glass border-2 transform hover:scale-[1.02] active:scale-[0.98]
        ${isSelected 
          ? 'border-indigo-500 shadow-lg shadow-indigo-200/50 bg-indigo-50/30' 
          : 'border-white/30 hover:border-indigo-300 hover:shadow-md'
        }
      `}
      onClick={() => onToggle(habit.id)}
    >
      {/* Checkbox */}
      <div className="absolute top-4 right-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(habit.id)}
          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-transform hover:scale-110"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Habit Title */}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 pr-8">
        {habit.title}
      </h3>

      {/* Cue, Action, Reward Structure */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
            C
          </span>
          <div>
            <p className="text-sm font-medium text-gray-700">Cue</p>
            <p className="text-sm text-gray-600">{habit.cue}</p>
          </div>
        </div>

        <div className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
            A
          </span>
          <div>
            <p className="text-sm font-medium text-gray-700">Action</p>
            <p className="text-sm text-gray-600">{habit.action}</p>
          </div>
        </div>

        <div className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
            R
          </span>
          <div>
            <p className="text-sm font-medium text-gray-700">Reward</p>
            <p className="text-sm text-gray-600">{habit.reward}</p>
          </div>
        </div>
      </div>

      {/* Suggested Time */}
      <div className="bg-white/50 rounded-lg p-3 mb-4 transition-colors hover:bg-white/70">
        <div className="flex items-center mb-1">
          <svg 
            className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className="text-sm font-semibold text-gray-800">
            Suggested Time: {habit.suggestedTime}
          </span>
        </div>
        <p className="text-xs text-gray-600 ml-6">
          {habit.timeReasoning}
        </p>
      </div>

      {/* Atomic Principles Badges */}
      {habit.atomicPrinciples && habit.atomicPrinciples.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {habit.atomicPrinciples.map((principle) => {
            const principleInfo = PRINCIPLE_LABELS[principle]
            return (
              <span
                key={principle}
                className={`
                  text-xs font-medium px-3 py-1 rounded-full border
                  ${principleInfo.color}
                `}
              >
                {principleInfo.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
