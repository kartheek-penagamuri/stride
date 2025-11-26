'use client'

import React, { useMemo } from 'react'
import { X, Flame, Check, Calendar, Tag, ArrowRight } from 'lucide-react'
import { Habit } from '@/lib/types'

interface HabitDetailModalProps {
    habit: Habit | null
    isOpen: boolean
    onClose: () => void
}

const dateKey = (date: Date) => date.toISOString().slice(0, 10)

const getLastNDates = (days: number) => {
    const list: { label: string; key: string }[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = dateKey(d)
        const label = d.toLocaleDateString(undefined, { weekday: 'short' })
        list.push({ label, key })
    }
    return list
}

const normalizeDateStrings = (dates?: string[]) =>
    new Set(
        (dates || [])
            .map((d) => {
                // Extract just the date portion (YYYY-MM-DD) to avoid timezone issues
                // Database stores as "YYYY-MM-DD HH:MM:SS" in UTC
                const dateOnly = d.slice(0, 10)
                return dateOnly
            })
            .filter(Boolean) as string[]
    )

export function HabitDetailModal({ habit, isOpen, onClose }: HabitDetailModalProps) {
    const last7Days = useMemo(() => getLastNDates(7), [])

    const completionSet = useMemo(() => {
        if (!habit) return new Set<string>()
        const todayKey = dateKey(new Date())
        const base = normalizeDateStrings(habit.completedDates)
        if (habit.completedToday) {
            base.add(todayKey)
        }
        return base
    }, [habit])

    // Parse implementation intention from description
    const parsedDescription = useMemo(() => {
        if (!habit) return null

        const desc = habit.description

        // Try to parse "After/When [cue], [action], and then [reward]" pattern
        const afterMatch = desc.match(/^(After|When)\s+(.+?),\s*(.+?),\s*and then\s+(.+)$/i)
        if (afterMatch) {
            return {
                trigger: afterMatch[1],
                cue: afterMatch[2].trim(),
                action: afterMatch[3].trim(),
                reward: afterMatch[4].trim()
            }
        }

        // If no pattern match, return plain description
        return null
    }, [habit])

    if (!isOpen || !habit) return null

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never'
        const date = new Date(dateString)
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-[var(--ink)]">{habit.title}</h2>
                            {habit.completedToday && (
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                                    <Check className="h-4 w-4" />
                                    <span className="text-xs font-semibold">Done Today</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                            <Tag className="h-4 w-4" />
                            <span className="capitalize">{habit.category}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--page-bg)] transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Description - Structured if it matches the pattern */}
                <div className="mb-6">
                    {parsedDescription ? (
                        <>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
                                Implementation Plan
                            </h3>
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                                        {parsedDescription.trigger} (Cue)
                                    </div>
                                    <p className="text-[var(--ink)] leading-relaxed">{parsedDescription.cue}</p>
                                </div>
                                <div className="flex justify-center">
                                    <ArrowRight className="h-5 w-5 text-[var(--muted)]" />
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
                                        Action
                                    </div>
                                    <p className="text-[var(--ink)] leading-relaxed">{parsedDescription.action}</p>
                                </div>
                                <div className="flex justify-center">
                                    <ArrowRight className="h-5 w-5 text-[var(--muted)]" />
                                </div>
                                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-1">
                                        Reward
                                    </div>
                                    <p className="text-[var(--ink)] leading-relaxed">{parsedDescription.reward}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                                Description
                            </h3>
                            <p className="text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
                                {habit.description}
                            </p>
                        </>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-[var(--page-bg)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--muted)] mb-1">
                            <Flame className="h-4 w-4 text-[var(--warm)]" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--ink)]">{habit.streak} days</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--page-bg)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--muted)] mb-1">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Completions</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--ink)]">{habit.totalCompletions || 0}</div>
                    </div>
                </div>

                {/* Last Completed */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-[var(--muted)] mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Last Completed</span>
                    </div>
                    <p className="text-[var(--ink)] font-medium">{formatDate(habit.lastCompleted)}</p>
                </div>

                {/* Weekly Progress */}
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
                        Last 7 Days
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                        {last7Days.map((day) => {
                            const isCompleted = completionSet.has(day.key)
                            return (
                                <div key={day.key} className="flex flex-col items-center gap-2">
                                    <div className="text-xs font-medium text-[var(--muted)]">{day.label}</div>
                                    <div
                                        className={`h-12 w-full rounded-xl transition-colors ${isCompleted
                                                ? 'bg-[var(--accent)] border-2 border-[var(--accent)]'
                                                : 'bg-[var(--page-bg)] border-2 border-[var(--border)]'
                                            }`}
                                        title={`${day.label}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                                    >
                                        {isCompleted && (
                                            <div className="h-full flex items-center justify-center">
                                                <Check className="h-5 w-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Created Date */}
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)]">
                        Created {formatDate(habit.createdAt)}
                    </p>
                </div>
            </div>
        </div>
    )
}
