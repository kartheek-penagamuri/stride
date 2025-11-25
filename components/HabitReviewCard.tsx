import React from 'react'
import { Check } from 'lucide-react'
import { AIGeneratedHabit, AtomicPrinciple } from '@/lib/types'

interface HabitReviewCardProps {
  habit: AIGeneratedHabit
  isSelected: boolean
  onToggle: (id: string) => void
}

const PRINCIPLE_LABELS: Record<AtomicPrinciple, { label: string; color: string }> = {
  [AtomicPrinciple.OBVIOUS]: { label: 'Make it Obvious', color: 'bg-white text-[var(--muted)] border-[var(--border)]' },
  [AtomicPrinciple.ATTRACTIVE]: { label: 'Make it Attractive', color: 'bg-white text-[var(--accent)] border-[var(--accent-soft)]' },
  [AtomicPrinciple.EASY]: { label: 'Make it Easy', color: 'bg-[#ecfbf7] text-[var(--spruce)] border-[var(--border)]' },
  [AtomicPrinciple.SATISFYING]: { label: 'Make it Satisfying', color: 'bg-white text-[var(--accent)] border-[var(--accent-soft)]' }
}

export const HabitReviewCard: React.FC<HabitReviewCardProps> = ({ habit, isSelected, onToggle }) => {
  return (
    <div
      className={`relative rounded-[28px] border p-6 sm:p-8 transition-all cursor-pointer ${
        isSelected
          ? 'border-[var(--accent)] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.12)]'
          : 'border-[var(--border)] bg-white/95 hover:border-[var(--border)]'
      }`}
      onClick={() => onToggle(habit.id)}
    >
      <input type="checkbox" checked={isSelected} onChange={() => onToggle(habit.id)} className="sr-only" readOnly />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-[var(--ink)]">{habit.title}</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            {habit.category ? habit.category : 'Atomic Habit'}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
            isSelected ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)] text-[var(--muted)]'
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
          <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">{item.label}</p>
            <p className="text-sm text-[var(--ink)] mt-2 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--ink)]">Suggested time / {habit.suggestedTime}</p>
        <p className="text-xs text-[var(--muted)] mt-1">{habit.timeReasoning}</p>
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
