'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { Plus, Check, Trash2, LogIn, UserPlus, Sparkles, Flame } from 'lucide-react'
import { CreateHabitRequest } from '@/lib/types'
import { GoalInputModal } from '@/components/GoalInputModal'

const dateKey = (date: Date) => date.toISOString().slice(0, 10)

const getBucketLabel = (category?: string) => {
  if (!category) return 'Flexible'
  const normalized = category.toLowerCase()
  if (['health', 'fitness'].includes(normalized)) return 'Morning'
  if (['productivity', 'learning'].includes(normalized)) return 'Midday'
  if (['mindfulness'].includes(normalized)) return 'Evening'
  return 'Flexible'
}

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

export default function Dashboard() {
  const [user, setUser] = useState<{ id: number; email: string; name?: string } | null>(null)
  const { habits, loading, error, createHabit, completeHabit, deleteHabit, fetchHabits } = useHabits(user || undefined)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showStreaksModal, setShowStreaksModal] = useState(false)
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
  const [selectedDay, setSelectedDay] = useState<string>(dateKey(new Date()))

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
  const last35Days = useMemo(() => getLastNDates(35), [])

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

  const completionsForDay = (day: string) => {
    const byHabit = habits.filter((habit) => completionSets[habit.id]?.has(day))
    return {
      total: byHabit.length,
      byHabit
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-6 py-4 shadow-sm text-[var(--muted)] flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden />
          Loading your rituals...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
      {showAuthPrompt && (
        <div className="fixed right-4 top-4 z-50 rounded-[18px] border border-[var(--border)] bg-white/95 px-4 py-3 text-sm text-[var(--muted)] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          Please sign in to save and update your habits.
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <header className="rounded-[30px] border border-[var(--border)] bg-white/90 px-5 py-4 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
                Ritual dashboard
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-semibold uppercase text-white shadow-[0_15px_35px_rgba(0,0,0,0.18)]">
                  ST
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold sm:text-4xl">Stacks you keep coming back to</h1>
                  <p className="text-sm text-[var(--muted)]">
                    Calm, host-inspired overview of your routines, streaks, and wins today.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-[var(--muted)] shadow-sm">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                  <span className="hidden sm:inline">Signed in as</span>
                  <span className="font-semibold text-[var(--ink)]">{user.email}</span>
                </div>
              ) : null}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
                >
                  Logout
                </button>
              ) : null}

              <button
                onClick={() => setShowStreaksModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
              >
                <Flame className="h-4 w-4 text-[var(--accent)]" />
                Streaks
              </button>
              <button
                onClick={openGoalModal}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
              >
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                Compose a stack
              </button>
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:bg-[var(--accent-strong)]"
              >
                <Plus className="h-4 w-4" />
                Add habit
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)] shadow-sm">
            Error: {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Active rituals', value: habits.length || 0, hint: 'Saved habits with streak tracking' },
            { label: 'Completed today', value: completedTodayCount, hint: 'Wins already recorded' },
            { label: 'Best streak', value: `${bestStreak}d`, hint: 'Top run without a miss' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="soft-card flex flex-col gap-2 rounded-[24px] border-[var(--border)] bg-white/90 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)]"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[var(--ink)]">{stat.value}</span>
                <span className="text-xs text-[var(--muted)]">{stat.hint}</span>
              </div>
            </div>
          ))}
        </section>

        {!user && (
          <section className="soft-card rounded-[32px] border-[var(--border)] bg-white/95 p-6 sm:p-8 shadow-[0_22px_65px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Account</p>
                <h2 className="text-2xl font-semibold text-[var(--ink)]">Sign in to save your stacks</h2>
                <p className="text-sm text-[var(--muted)] max-w-2xl">
                  Your streaks, completions, and AI-crafted plans stay tied to your account. Sign in or create a profile to keep them.
                </p>
              </div>
              <div className="flex rounded-full border border-[var(--border)] bg-white p-1 text-sm font-semibold">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                    authMode === 'login' ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--muted)]'
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                    authMode === 'signup' ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--muted)]'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </button>
              </div>
            </div>

            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Name (optional)</label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--ink)] placeholder:text-[#b1b1b1] focus:border-[var(--accent)] focus:outline-none"
                    placeholder="How should we greet you?"
                  />
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Email</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--ink)] placeholder:text-[#b1b1b1] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--ink)] placeholder:text-[#b1b1b1] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={authStatus.loading}
                  className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[#cfcfcf]"
                >
                  {authStatus.loading ? 'Working...' : authMode === 'login' ? 'Login' : 'Create account'}
                </button>
                {authStatus.error && <span className="text-sm text-[var(--accent-strong)]">{authStatus.error}</span>}
                {authStatus.message && <span className="text-sm text-[var(--spruce)]">{authStatus.message}</span>}
              </div>
            </form>
          </section>
        )}

        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="max-w-md w-full rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.12)] animate-scale-in">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">New habit</p>
                  <h2 className="text-2xl font-semibold text-[var(--ink)]">Create a gentle cue</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--accent)]"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--muted)]">Title</label>
                  <input
                    type="text"
                    value={newHabit.title}
                    onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                    className="w-full rounded-[16px] border border-[var(--border)] bg-white/90 px-3 py-2 text-[var(--ink)] placeholder:text-[#b1b1b1] focus:border-[var(--accent)] focus:outline-none"
                    placeholder="e.g., Morning water"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--muted)]">Description</label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    className="w-full rounded-[16px] border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[#b1b1b1] focus:border-[var(--accent)] focus:outline-none"
                    placeholder="e.g., Drink a tall glass right after waking"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--muted)]">Category</label>
                  <select
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                    className="w-full rounded-[16px] border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="general">General</option>
                    <option value="health">Health</option>
                    <option value="fitness">Fitness</option>
                    <option value="learning">Learning</option>
                    <option value="productivity">Productivity</option>
                    <option value="mindfulness">Mindfulness</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-[16px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(0,0,0,0.12)] transition hover:bg-[var(--accent-strong)]"
                  >
                    Create habit
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

        {showStreaksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-3xl rounded-[32px] border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.12)] animate-scale-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Streaks</p>
                  <h2 className="text-2xl font-semibold text-[var(--ink)]">Keep the gentle run going</h2>
                  <p className="text-sm text-[var(--muted)]">Last 14 days per habit, no pressure — just visibility.</p>
                </div>
                <button
                  onClick={() => setShowStreaksModal(false)}
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--accent)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="soft-card rounded-[20px] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Active rituals</p>
                  <p className="text-3xl font-semibold text-[var(--ink)]">{habits.length || 0}</p>
                  <p className="text-xs text-[var(--muted)]">Tracked habits</p>
                </div>
                <div className="soft-card rounded-[20px] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Best streak</p>
                  <p className="text-3xl font-semibold text-[var(--ink)]">{bestStreak}d</p>
                  <p className="text-xs text-[var(--muted)]">Longest run</p>
                </div>
                <div className="soft-card rounded-[20px] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Done today</p>
                  <p className="text-3xl font-semibold text-[var(--ink)]">{completedTodayCount}</p>
                  <p className="text-xs text-[var(--muted)]">Wins logged</p>
                </div>
              </div>

              <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {habits.map((habit) => {
                  const habitCompletions = completionSets[habit.id] || new Set<string>()
                  return (
                    <div
                      key={habit.id}
                      className="rounded-[20px] border border-[var(--border)] bg-white/95 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink)]">{habit.title}</p>
                          <p className="text-xs text-[var(--muted)]">{habit.description}</p>
                        </div>
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                          {habit.streak}d streak
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {getLastNDates(14).map((d) => (
                          <span
                            key={d.key}
                            className={`h-3.5 w-3.5 rounded-full border ${
                              habitCompletions.has(d.key)
                                ? 'bg-[var(--accent)] border-[var(--accent)]'
                                : 'bg-[var(--accent-soft)] border-[var(--border)]'
                            }`}
                            title={`${d.label}`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <section className="rounded-[32px] border border-[var(--border)] bg-white/95 p-6 sm:p-8 shadow-[0_22px_65px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Calendar</p>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">Quiet overview</h2>
              <p className="text-sm text-[var(--muted)]">Heatmap of completions with a gentle day detail panel.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-white to-[#f2f4f8] border border-[var(--border)]" /> Planned
              <span className="inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-[#edf3ff] via-[#e3ecff] to-[#dbe6ff] border border-[var(--border)]" /> Done
              <span className="inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-[#c2f5ec] via-[#7ddad0] to-[#4fc0b9] border border-[var(--border)]" /> Very active
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-7 gap-2">
              {last35Days.map((day) => {
                const { total } = completionsForDay(day.key)
                const intensityClass =
                  total === 0
                    ? 'bg-gradient-to-br from-white to-[#f7f7f7] border-[var(--border)] text-[var(--muted)]'
                    : total > 2
                    ? 'bg-gradient-to-br from-[#b5f2e7] via-[#6ed6c9] to-[#32b3a8] border-[var(--border)] text-white shadow-[0_12px_30px_rgba(50,179,168,0.35)]'
                    : 'bg-gradient-to-br from-[#edf3ff] via-[#e1ebff] to-[#d5e2ff] border-[var(--border)] text-[var(--ink)] shadow-[0_10px_26px_rgba(70,130,255,0.12)]'
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`aspect-square rounded-[14px] border text-[11px] font-semibold transition-transform duration-200 ${intensityClass} ${
                      selectedDay === day.key
                        ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-white scale-[1.03]'
                        : 'hover:scale-[1.02]'
                    }`}
                    title={day.key}
                  >
                    {new Date(day.key).getDate()}
                  </button>
                )
              })}
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Day</p>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {new Date(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)] border border-[var(--border)]">
                  {completionsForDay(selectedDay).total} done
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {['Morning', 'Midday', 'Evening', 'Flexible'].map((bucket) => {
                  const bucketHabits = completionsForDay(selectedDay).byHabit.filter(
                    (habit) => getBucketLabel(habit.category) === bucket
                  )
                  return (
                    <div key={bucket} className="rounded-[16px] border border-[var(--border)] bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{bucket}</p>
                        <span className="text-xs text-[var(--muted)]">{bucketHabits.length} done</span>
                      </div>
                      {bucketHabits.length === 0 ? (
                        <p className="mt-2 text-xs text-[var(--muted)]">No completions logged here.</p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-sm text-[var(--ink)]">
                          {bucketHabits.map((habit) => (
                            <li key={habit.id} className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                              {habit.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Habits</p>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">Daily stacks</h2>
            </div>
            <button
              onClick={openCreateForm}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              <Plus className="h-4 w-4" />
              New habit
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      <Flame className="h-3.5 w-3.5 text-[var(--accent)]" />
                      {habit.category}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--ink)]">{habit.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{habit.description}</p>
                    </div>
                    <div className="flex items-center gap-1" aria-label="Last 7 days">
                      {last7Days.map((day) => (
                        <span
                          key={`${habit.id}-${day.key}`}
                          className={`h-2.5 w-5 rounded-full border ${
                            completionSets[habit.id]?.has(day.key)
                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                            : 'bg-[#f7f7f7] border-[var(--border)]'
                          }`}
                          title={day.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-right">
                    <p className="text-2xl font-semibold text-[var(--ink)]">{habit.streak}</p>
                    <p className="text-xs text-[var(--muted)]">day streak</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {habit.completedToday ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#C8E6D7] bg-[#ecfbf7] px-3 py-1 text-xs font-semibold text-[var(--spruce)]">
                      <Check className="h-3.5 w-3.5" />
                      Completed today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      Hold your streak
                    </span>
                  )}
                  {habit.completedToday && habit.lastCompleted ? (
                    <span className="text-xs text-[var(--muted)]">Last done {new Date(habit.lastCompleted).toLocaleDateString()}</span>
                  ) : null}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleCompleteHabit(habit.id)}
                    disabled={habit.completedToday}
                    className={`flex-1 rounded-[14px] px-4 py-3 text-sm font-semibold transition ${
                      habit.completedToday
                        ? 'cursor-not-allowed bg-[#ecfbf7] text-[var(--spruce)]'
                        : 'bg-[var(--accent)] text-white shadow-[0_18px_36px_rgba(0,0,0,0.12)] hover:bg-[var(--accent-strong)]'
                    }`}
                  >
                    {habit.completedToday ? 'Done' : 'Complete for today'}
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="rounded-[14px] border border-[var(--border)] bg-white px-3 py-3 text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {habits.length === 0 && !loading && (
            <div className="rounded-[28px] border border-[var(--border)] bg-white/90 p-10 text-center shadow-[0_22px_65px_rgba(0,0,0,0.06)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-[var(--ink)]">No habits yet</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Create a forgiving ritual and we will track streaks and completions here.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:bg-[var(--accent-strong)]"
                >
                  <Plus className="h-4 w-4" />
                  Create your first habit
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
