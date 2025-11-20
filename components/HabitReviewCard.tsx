import React from 'react'
import { Check } from 'lucide-react'
import { AIGeneratedHabit, AtomicPrinciple } from '@/lib/types'

interface HabitReviewCardProps {
  habit: AIGeneratedHabit
  isSelected: boolean
  onToggle: (id: string) => void
}

const PRINCIPLE_LABELS: Record<AtomicPrinciple, { label: string; color: string }> = {
  [AtomicPrinciple.OBVIOUS]: { label: 'Make it Obvious', color: 'bg-[#F1E9DD] text-[#4F463A] border-[#D9D0C0]' },
  [AtomicPrinciple.ATTRACTIVE]: { label: 'Make it Attractive', color: 'bg-[#F6E8E1] text-[#7A3C2F] border-[#E4CBBE]' },
  [AtomicPrinciple.EASY]: { label: 'Make it Easy', color: 'bg-[#E5EEE8] text-[#2F4A33] border-[#C1D8CB]' },
  [AtomicPrinciple.SATISFYING]: { label: 'Make it Satisfying', color: 'bg-[#F3EBE1] text-[#5E3C2B] border-[#DEC9B6]' }
}

export const HabitReviewCard: React.FC<HabitReviewCardProps> = ({ habit, isSelected, onToggle }) => {
  return (
    <div
      className={`relative rounded-[28px] border p-6 sm:p-8 transition-all cursor-pointer ${
        isSelected
          ? 'border-[#1B1917] bg-[#F4EEE3] shadow-[0_25px_60px_rgba(17,13,10,0.2)]'
          : 'border-[#D9D0C0] bg-white/95 hover:border-[#CBBFAE]'
      }`}
      onClick={() => onToggle(habit.id)}
    >
      <input type="checkbox" checked={isSelected} onChange={() => onToggle(habit.id)} className="sr-only" readOnly />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-[#1B1917]">{habit.title}</p>
          <p className="text-sm text-[#70665A] mt-1">
            {habit.category ? habit.category : 'Atomic Habit'}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
            isSelected ? 'bg-[#1B1917] text-white border-[#1B1917]' : 'border-[#D9D0C0] text-[#4F463A]'
          }`}
        >
          {isSelected ? <Check className="w-5 h-5" /> : <span className="text-xs font-semibold">Add</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Cue', text: habit.cue },
          { label: 'Action', text: habit.action },
          { label: 'Reward', text: habit.reward }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#E6DED2] bg-[#F7F2EA] p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">{item.label}</p>
            <p className="text-sm text-[#2C241A] mt-2 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[#CBBFAE] bg-[#F5EFE6] p-4">
        <p className="text-sm font-semibold text-[#1B1917]">Suggested time / {habit.suggestedTime}</p>
        <p className="text-xs text-[#4F463A] mt-1">{habit.timeReasoning}</p>
      </div>

      {habit.atomicPrinciples && habit.atomicPrinciples.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {habit.atomicPrinciples.map((principle) => {
            const principleInfo = PRINCIPLE_LABELS[principle]
            return (
              <span
                key={principle}
                className={`text-xs font-medium px-3 py-1 rounded-full border ${principleInfo.color}`}
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
