'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHabits } from '@/hooks/useHabits'
import {
  Plus,
  Check,
  Trash2,
  LogIn,
  UserPlus,
  Sparkles,
  Flame,
  LayoutGrid,
  Calendar as CalendarIcon,
  Activity,
  Zap,
  Coffee,
  Moon,
  BookOpen,
  Dumbbell,
  Briefcase,
  Heart,
  MoreHorizontal
} from 'lucide-react'
import { CreateHabitRequest, Habit } from '@/lib/types'
import { GoalInputModal } from '@/components/GoalInputModal'
import { HabitDetailModal } from '@/components/HabitDetailModal'

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
        const parsed = new Date(d)
        if (Number.isNaN(parsed.getTime())) return null
        return dateKey(parsed)
      })
      .filter(Boolean) as string[]
  )

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  health: <Heart className="h-4 w-4" />,
  fitness: <Dumbbell className="h-4 w-4" />,
  learning: <BookOpen className="h-4 w-4" />,
  productivity: <Briefcase className="h-4 w-4" />,
  mindfulness: <Moon className="h-4 w-4" />,
  general: <Zap className="h-4 w-4" />,
  morning: <Coffee className="h-4 w-4" />
}

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health & Wellness',
  fitness: 'Movement',
  learning: 'Growth',
  productivity: 'Work & Focus',
  mindfulness: 'Mindfulness',
  general: 'General Habits'
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: number; email: string; name?: string } | null>(null)
  const { habits, loading, error, createHabit, completeHabit, deleteHabit, fetchHabits } = useHabits(user || undefined)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [newHabit, setNewHabit] = useState<CreateHabitRequest>({
    title: '',
    description: '',
    category: 'general'
  })
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
  const [authStatus, setAuthStatus] = useState<{ loading: boolean; error: string | null; message: string | null }>({
    loading: false,
    error: null,
    message: null
  })
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [showHabitDetail, setShowHabitDetail] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('strideUser') : null
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    if (!showAuthPrompt) return
    const timer = setTimeout(() => setShowAuthPrompt(false), 3200)
    return () => clearTimeout(timer)
  }, [showAuthPrompt])

  const completedTodayCount = useMemo(
    () => habits.filter((habit) => habit.completedToday).length,
    [habits]
  )
  const bestStreak = useMemo(
    () => habits.reduce((max, habit) => Math.max(max, habit.streak || 0), 0),
    [habits]
  )
  const last7Days = useMemo(() => getLastNDates(7), [])

  const completionSets = useMemo(() => {
    const todayKey = dateKey(new Date())
    return habits.reduce<Record<number, Set<string>>>((acc, habit) => {
      const base = normalizeDateStrings(habit.completedDates)
      if (habit.completedToday) {
        base.add(todayKey)
      }
      acc[habit.id] = base
      return acc
    }, {})
  }, [habits])

  // Group habits by category
  const habitsByCategory = useMemo(() => {
    const grouped: Record<string, Habit[]> = {}
    habits.forEach(habit => {
      const cat = habit.category || 'general'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(habit)
    })
    return grouped
  }, [habits])

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    if (!newHabit.title || !newHabit.description) {
      alert('Please fill in all fields')
      return
    }
    const success = await createHabit(newHabit)
    if (success) {
      setNewHabit({ title: '', description: '', category: 'general' })
      setShowCreateForm(false)
    }
  }

  const handleCompleteHabit = async (id: number) => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    await completeHabit(id)
  }

  const handleDeleteHabit = async (id: number) => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    if (confirm('Are you sure you want to delete this habit?')) {
      await deleteHabit(id)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthStatus({ loading: true, error: null, message: null })

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body =
      authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, name: authForm.name }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthStatus({ loading: false, error: data.error || 'Unable to authenticate.', message: null })
        return
      }
      localStorage.setItem('strideUser', JSON.stringify(data.user))
      setUser(data.user)
      setAuthStatus({
        loading: false,
        error: null,
        message: authMode === 'login' ? 'Signed in.' : 'Account created.'
      })
      setShowAuthPrompt(false)
    } catch (error) {
      console.error('Auth failed:', error)
      setAuthStatus({ loading: false, error: 'Network error. Please try again.', message: null })
    }
  }

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      localStorage.removeItem('strideUser')
      setUser(null)
      setShowCreateForm(false)
      router.push('/')
    })
  }

  const openCreateForm = () => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    setShowCreateForm(true)
  }

  const openGoalModal = () => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    setShowGoalModal(true)
  }

  const openHabitDetail = (habit: Habit) => {
    setSelectedHabit(habit)
    setShowHabitDetail(true)
  }

  const closeHabitDetail = () => {
    setShowHabitDetail(false)
    setSelectedHabit(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <p className="text-[var(--muted)] text-sm font-medium">Loading your routine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)] pb-20">
      {showAuthPrompt && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm text-[var(--ink)] shadow-lg animate-fade-in-up flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          Please sign in to save your progress.
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span className="font-bold text-[var(--ink)] hidden sm:inline-block">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--muted)] hidden sm:inline-block">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthMode('login')}
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                Sign In
              </button>
            )}
            <button
              onClick={openGoalModal}
              className="hidden sm:flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] transition-colors shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              New Goal
            </button>
            <button
              onClick={openCreateForm}
              className="sm:hidden rounded-full bg-[var(--accent)] p-2 text-white shadow-sm"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome & Stats */}
        <section>
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">
            {user?.name ? `Welcome back, ${user.name}` : 'Your Daily Routine'}
          </h1>
          <p className="text-[var(--muted)] mb-6">Small steps add up. Here's your progress.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
              </div>
              <div className="text-2xl font-bold text-[var(--ink)]">{habits.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-2">
                <Check className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Done Today</span>
              </div>
              <div className="text-2xl font-bold text-[var(--ink)]">{completedTodayCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-2">
                <Flame className="h-4 w-4 text-[var(--warm)]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Best Streak</span>
              </div>
              <div className="text-2xl font-bold text-[var(--ink)]">{bestStreak}d</div>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/10 shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:bg-[var(--accent)]/10 transition-colors" onClick={openGoalModal}>
              <Sparkles className="h-5 w-5 text-[var(--accent)] mb-1" />
              <span className="text-sm font-semibold text-[var(--accent-strong)]">Add New Goal</span>
            </div>
          </div>
        </section>

        {/* Auth Prompt (if not logged in) */}
        {!user && (
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Save your progress</h2>
                <p className="text-[var(--muted)] text-sm max-w-md">
                  Create an account to sync your habits across devices and keep your streaks alive.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${authMode === 'login' ? 'bg-[var(--ink)] text-white border-[var(--ink)]' : 'bg-white text-[var(--ink)] border-[var(--border)] hover:bg-[var(--page-bg)]'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${authMode === 'signup' ? 'bg-[var(--ink)] text-white border-[var(--ink)]' : 'bg-white text-[var(--ink)] border-[var(--border)] hover:bg-[var(--page-bg)]'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-6 max-w-md mx-auto md:mx-0 grid gap-4">
              {authMode === 'signup' && (
                <input
                  type="text"
                  placeholder="Your Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
              />
              <input
                type="password"
                placeholder="Password"
                required
                minLength={8}
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={authStatus.loading}
                className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] transition-colors disabled:opacity-50"
              >
                {authStatus.loading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
              {authStatus.error && <p className="text-sm text-[var(--danger)] text-center">{authStatus.error}</p>}
            </form>
          </section>
        )}

        {/* Habits List */}
        <section className="space-y-8">
          {Object.entries(habitsByCategory).length === 0 && !loading ? (
            <div className="text-center py-20 rounded-3xl border border-[var(--border)] bg-white border-dashed">
              <div className="h-16 w-16 rounded-full bg-[var(--page-bg)] flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">No habits yet</h3>
              <p className="text-[var(--muted)] max-w-sm mx-auto mt-2 mb-6">
                Start small. Create a goal and let our AI suggest a routine for you.
              </p>
              <button
                onClick={openGoalModal}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create First Goal
              </button>
            </div>
          ) : (
            Object.entries(habitsByCategory).map(([category, categoryHabits]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--muted)] px-1">
                  {CATEGORY_ICONS[category] || <LayoutGrid className="h-4 w-4" />}
                  <h3 className="text-sm font-semibold uppercase tracking-wider">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <span className="text-xs bg-[var(--border)] px-2 py-0.5 rounded-full text-[var(--ink)]">
                    {categoryHabits.length}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryHabits.map((habit) => (
                    <div
                      key={habit.id}
                      onClick={() => openHabitDetail(habit)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${habit.completedToday
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/20'
                        : 'bg-white border-[var(--border)] hover:border-[var(--accent)]/50 hover:shadow-md'
                        }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-semibold text-lg ${habit.completedToday ? 'text-[var(--accent-strong)]' : 'text-[var(--ink)]'}`}>
                            {habit.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${habit.completedToday ? 'bg-white text-[var(--accent)]' : 'bg-[var(--page-bg)] text-[var(--muted)]'
                              }`}>
                              {habit.streak}d
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4">
                          {habit.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Weekly Heatmap */}
                        <div className="flex items-center gap-1 justify-between px-1">
                          {last7Days.map((day) => {
                            const isCompleted = completionSets[habit.id]?.has(day.key)
                            return (
                              <div
                                key={`${habit.id}-${day.key}`}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                                  }`}
                                title={`${day.label}: ${isCompleted ? 'Done' : 'Missed'}`}
                              />
                            )
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCompleteHabit(habit.id)
                            }}
                            disabled={habit.completedToday}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${habit.completedToday
                              ? 'bg-white text-[var(--accent)] cursor-default'
                              : 'bg-[var(--ink)] text-white hover:bg-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/20'
                              }`}
                          >
                            {habit.completedToday ? (
                              <>
                                <Check className="h-4 w-4" /> Done
                              </>
                            ) : (
                              'Mark Complete'
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteHabit(habit.id)
                            }}
                            className="p-2.5 rounded-xl text-[var(--muted)] hover:bg-red-50 hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete habit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Manual Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <h2 className="text-xl font-bold text-[var(--ink)] mb-1">New Habit</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Add a simple habit to your routine.</p>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Title</label>
                <input
                  type="text"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  placeholder="e.g., Drink Water"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Description</label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  placeholder="When and where?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">Category</label>
                <select
                  value={newHabit.category}
                  onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                >
                  <option value="general">General</option>
                  <option value="health">Health</option>
                  <option value="fitness">Fitness</option>
                  <option value="learning">Learning</option>
                  <option value="productivity">Productivity</option>
                  <option value="mindfulness">Mindfulness</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--page-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GoalInputModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onHabitsAdded={() => {
          fetchHabits()
          setShowGoalModal(false)
        }}
      />

      <HabitDetailModal
        habit={selectedHabit}
        isOpen={showHabitDetail}
        onClose={closeHabitDetail}
      />
    </div>
  )
}
