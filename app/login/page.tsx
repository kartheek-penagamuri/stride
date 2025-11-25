'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ShieldCheck, Globe2, Heart } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'

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

          <AuthForm redirectTo="/dashboard" />
        </main>
      </div>
    </div>
  )
}
