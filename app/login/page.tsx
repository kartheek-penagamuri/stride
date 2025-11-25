'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, LogIn, ShieldCheck, Sparkles, UserPlus, Globe2, Heart } from 'lucide-react'

type AuthMode = 'login' | 'register'

type FormState = {
  name: string
  email: string
  password: string
}

const perks = [
  {
    title: 'Secure by design',
    description: 'Passwords are hashed and sessions stay httpOnly—your studio is for your eyes only.',
    icon: <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
  },
  {
    title: 'Context travels with you',
    description: 'Stacks, streaks, and clarifying answers stay tied to your account across devices.',
    icon: <Globe2 className="h-5 w-5 text-[var(--accent)]" />
  },
  {
    title: 'Friendly by default',
    description: 'Tone is calm, prompts are gentle, and we never push beyond your comfort.',
    icon: <Heart className="h-5 w-5 text-[var(--accent)]" />
  }
]

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' })
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; message: string | null }>({
    loading: false,
    error: null,
    message: null
  })

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('strideUser') : null
    if (storedUser) {
      setStatus({ loading: false, error: null, message: 'Welcome back. Redirecting you to your studio.' })
      const timer = setTimeout(() => router.push('/dashboard'), 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, error: null, message: null })

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body =
      mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus({ loading: false, error: data.error || 'Something went wrong.', message: null })
        return
      }

      localStorage.setItem('strideUser', JSON.stringify(data.user))
      setStatus({
        loading: false,
        error: null,
        message: mode === 'login' ? 'Signed in. Routing you to your dashboard.' : 'Account created. Welcome in.'
      })

      setTimeout(() => router.push('/dashboard'), 300)
    } catch (error) {
      console.error('Auth failed:', error)
      setStatus({ loading: false, error: 'Network error. Please try again.', message: null })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:px-10">
        <header className="mb-10 flex items-center justify-between rounded-full border border-[var(--border)] bg-white/90 px-4 py-3 shadow-[0_14px_45px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold uppercase text-white shadow-[0_14px_35px_rgba(0,132,137,0.28)]">
              ST
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Stride</p>
              <p className="text-lg font-semibold text-[var(--ink)]">Personal Rituals</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="hidden items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,132,137,0.28)] transition hover:bg-[var(--accent-strong)] sm:flex"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">Welcome</p>
              <h1 className="text-4xl font-bold leading-tight text-[var(--ink)] sm:text-5xl">
                Sign in to your calm, guided studio.
              </h1>
              <p className="text-lg leading-relaxed text-[var(--muted)]">
                Keep your rituals, streaks, and AI plans saved to your account.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {perks.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
                  <div className="rounded-full bg-[var(--accent-soft)] p-2 text-[var(--accent)]">{item.icon}</div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="text-sm text-[var(--muted)]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="soft-card space-y-6 rounded-[28px] border-[var(--border)] bg-white/95 p-8 shadow-[0_26px_75px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>

            <div className="flex gap-2 rounded-full bg-[#f2f2f2] p-1 text-sm font-semibold text-[var(--muted)]">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'login' ? 'bg-white text-[var(--ink)] shadow-sm' : 'opacity-70'}`}
              >
                I already have an account
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'register' ? 'bg-white text-[var(--ink)] shadow-sm' : 'opacity-70'}`}
              >
                I&apos;m new here
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="name">
                    Name <span className="text-[var(--accent)]">(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                    placeholder="How should we greet you?"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  placeholder="At least 8 characters"
                />
              </div>

              {status.error && (
                <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-sm text-[#374151]">
                  {status.error}
                </div>
              )}

              {status.message && (
                <div className="rounded-2xl border border-[#c3eadf] bg-[#ecfbf7] px-4 py-3 text-sm text-[#0e7d71]">
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={status.loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(0,132,137,0.28)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status.loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}
