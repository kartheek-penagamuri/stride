'use client'

import React, { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

type AuthMode = 'login' | 'register'

interface AuthFormProps {
    onSuccess?: () => void
    redirectTo?: string
}

type FormState = {
    name: string
    email: string
    password: string
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, redirectTo = '/dashboard' }) => {
    const [mode, setMode] = useState<AuthMode>('login')
    const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' })
    const [status, setStatus] = useState<{ loading: boolean; error: string | null; message: string | null }>({
        loading: false,
        error: null,
        message: null
    })

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
                message: mode === 'login' ? 'Signed in. Welcome back!' : 'Account created. Welcome!'
            })

            if (onSuccess) {
                onSuccess()
            } else {
                setTimeout(() => {
                    window.location.href = redirectTo
                }, 300)
            }
        } catch (error) {
            console.error('Auth failed:', error)
            setStatus({ loading: false, error: 'Network error. Please try again.', message: null })
        }
    }

    return (
        <section className="soft-card space-y-6 rounded-3xl border border-[var(--border)] bg-white p-8 shadow-xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>

            <div className="flex gap-2 rounded-full bg-[#f2f2f2] p-1 text-sm font-semibold text-[var(--muted)]">
                <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'login' ? 'bg-white text-[var(--ink)] shadow-sm' : 'opacity-70'
                        }`}
                >
                    I already have an account
                </button>
                <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'register' ? 'bg-white text-[var(--ink)] shadow-sm' : 'opacity-70'
                        }`}
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
                    <div className="rounded-2xl border border-[var(--danger)]/20 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
                        {status.error}
                    </div>
                )}

                {status.message && (
                    <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status.loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {status.loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </section>
    )
}
