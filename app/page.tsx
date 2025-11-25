'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Shield,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Star
} from 'lucide-react'
import { GoalInputModal } from '@/components/GoalInputModal'

export default function HomePage() {
  const router = useRouter()
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const handleDashboardNavigation = () => {
    router.push('/dashboard')
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const navItems = [
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)] font-sans selection:bg-[var(--accent-soft)] selection:text-[var(--accent-strong)]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--ink)]">Stride</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-strong)] hover:shadow-md"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[var(--muted)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-white px-4 py-6 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block text-base font-medium text-[var(--muted)] hover:text-[var(--ink)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full rounded-lg border border-[var(--border)] px-4 py-2 text-center text-sm font-semibold text-[var(--ink)]"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setIsGoalModalOpen(true)
                }}
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] mb-6">
                  <Sparkles className="h-3 w-3" />
                  New: AI Habit Concierge
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl mb-6">
                  Turn your goals into <span className="text-[var(--accent)]">tiny, doable habits.</span>
                </h1>
                <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">
                  Set a meaningful goal, and our AI habit coach breaks it into small, stacked habits you can actually follow. Build calm, sustainable routines without the overwhelm.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:bg-[var(--accent-strong)] hover:-translate-y-0.5"
                  >
                    Create My First Goal
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDashboardNavigation}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-8 py-4 text-base font-semibold text-[var(--ink)] transition-all hover:bg-[var(--page-bg)]"
                  >
                    View Dashboard
                  </button>
                </div>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  No credit card required · Free forever plan available
                </p>
              </div>

              <div className="relative lg:ml-auto">
                <div className="relative rounded-2xl border border-[var(--border)] bg-white shadow-2xl overflow-hidden max-w-md mx-auto lg:max-w-none">
                  <div className="bg-[var(--page-bg)] px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/20"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400/20"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400/20"></div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm uppercase tracking-wider text-[var(--muted)] font-semibold">Current Goal</h3>
                      <div className="text-xl font-semibold text-[var(--ink)]">Reduce morning anxiety</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/10">
                        <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs">1</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--ink)]">Drink a glass of water</div>
                          <div className="text-xs text-[var(--muted)]">Right after waking up</div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[var(--border)] opacity-60">
                        <div className="h-6 w-6 rounded-full bg-[var(--muted)]/20 flex items-center justify-center text-[var(--muted)] text-xs">2</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--ink)]">5 mins of deep breathing</div>
                          <div className="text-xs text-[var(--muted)]">After drinking water</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[var(--border)] opacity-60">
                        <div className="h-6 w-6 rounded-full bg-[var(--muted)]/20 flex items-center justify-center text-[var(--muted)] text-xs">3</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--ink)]">Write 3 priorities</div>
                          <div className="text-xs text-[var(--muted)]">Before opening email</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute -z-10 top-1/2 -right-12 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl"></div>
                <div className="absolute -z-10 -bottom-12 -left-12 w-64 h-64 bg-[var(--warm)]/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 bg-white border-y border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-[var(--ink)] sm:text-4xl mb-4">
                Small steps, big peace of mind.
              </h2>
              <p className="text-lg text-[var(--muted)]">
                We don't believe in "grinding". We believe in consistency through clarity and calm.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Layers className="h-6 w-6 text-[var(--accent)]" />,
                  title: "Stack habits simply",
                  desc: "Link new habits to existing ones so they become automatic without willpower."
                },
                {
                  icon: <Shield className="h-6 w-6 text-[var(--accent)]" />,
                  title: "Reduce overwhelm",
                  desc: "Break big, scary goals into tiny, non-threatening steps you can do in minutes."
                },
                {
                  icon: <Sparkles className="h-6 w-6 text-[var(--accent)]" />,
                  title: "AI-powered guidance",
                  desc: "Don't know where to start? Our AI suggests the perfect first steps for any goal."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-[var(--page-bg)] border border-[var(--border)] hover:shadow-lg transition-shadow duration-300">
                  <div className="h-12 w-12 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--ink)] mb-3">{feature.title}</h3>
                  <p className="text-[var(--muted)] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-[var(--page-bg)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--ink)] sm:text-4xl mb-4">
                From vague goal to daily routine.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-[var(--border)] -z-10"></div>

              {[
                {
                  step: "1",
                  title: "Set a meaningful goal",
                  desc: "Choose something that matters to your mental health or well-being."
                },
                {
                  step: "2",
                  title: "Get tiny habits",
                  desc: "Our AI breaks it down into small, actionable steps you can stack."
                },
                {
                  step: "3",
                  title: "Follow your routine",
                  desc: "Check off your stack daily and watch your consistency grow."
                }
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-[var(--page-bg)] shadow-sm flex items-center justify-center mb-6 z-10">
                    <span className="text-3xl font-bold text-[var(--accent)]">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--ink)] mb-3">{item.title}</h3>
                  <p className="text-[var(--muted)] max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-white border-y border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[var(--ink)] text-center mb-16">
              Trusted by calm achievers.
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  quote: "I finally stopped beating myself up for missing days. Stride makes it easy to get back on track.",
                  author: "Sarah J.",
                  role: "Designer"
                },
                {
                  quote: "The habit stacking approach changed how I view my morning routine. It feels effortless now.",
                  author: "Mark T.",
                  role: "Developer"
                },
                {
                  quote: "Less anxiety, more doing. The AI suggestions were surprisingly spot on for my situation.",
                  author: "Elena R.",
                  role: "Student"
                }
              ].map((t, i) => (
                <div key={i} className="p-8 rounded-2xl bg-[var(--page-bg)] border border-[var(--border)]">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-[var(--warm)] text-[var(--warm)]" />
                    ))}
                  </div>
                  <p className="text-[var(--ink)] mb-6 font-medium">"{t.quote}"</p>
                  <div>
                    <div className="font-semibold text-[var(--ink)]">{t.author}</div>
                    <div className="text-sm text-[var(--muted)]">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-[var(--page-bg)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--ink)] sm:text-4xl mb-4">
                Simple, transparent pricing.
              </h2>
              <p className="text-[var(--muted)]">Invest in your peace of mind.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Tier */}
              <div className="p-8 rounded-3xl bg-white border border-[var(--border)] shadow-sm">
                <h3 className="text-xl font-semibold text-[var(--ink)] mb-2">Starter</h3>
                <div className="text-4xl font-bold text-[var(--ink)] mb-6">$0<span className="text-lg font-normal text-[var(--muted)]">/mo</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-[var(--muted)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /> 3 Active Goals
                  </li>
                  <li className="flex items-center gap-3 text-[var(--muted)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /> Basic Habit Stacking
                  </li>
                  <li className="flex items-center gap-3 text-[var(--muted)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /> 7-Day History
                  </li>
                </ul>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--page-bg)] transition-colors"
                >
                  Start for Free
                </button>
              </div>

              {/* Pro Tier */}
              <div className="p-8 rounded-3xl bg-[var(--ink)] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-6">$9<span className="text-lg font-normal text-gray-400">/mo</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /> Unlimited Goals
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /> Advanced AI Coaching
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /> Unlimited History & Trends
                  </li>
                </ul>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="w-full rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] transition-colors"
                >
                  Get Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-white border-t border-[var(--border)]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[var(--ink)] text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "What kind of goals can I set?",
                  a: "Anything from 'reduce anxiety' to 'learn spanish' or 'sleep better'. Our AI helps break down any goal into manageable steps."
                },
                {
                  q: "How does the AI help?",
                  a: "It analyzes your goal and suggests scientifically-backed habits (cues, actions, rewards) that fit your lifestyle."
                },
                {
                  q: "Is this safe for my mental health?",
                  a: "Yes. We prioritize gentle, non-judgmental progress. However, Stride is a self-help tool, not a replacement for professional therapy."
                },
                {
                  q: "How much time per day will this take?",
                  a: "Most habits we suggest take less than 2 minutes. The goal is consistency, not intensity."
                }
              ].map((item, i) => (
                <div key={i} className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-[var(--page-bg)] transition-colors"
                  >
                    <span className="font-semibold text-[var(--ink)]">{item.q}</span>
                    <ChevronDown className={`h-5 w-5 text-[var(--muted)] transition-transform ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaqIndex === i && (
                    <div className="px-6 pb-6 pt-0 text-[var(--muted)] bg-white">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--page-bg)] border-t border-[var(--border)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)] text-white">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-bold text-[var(--ink)]">Stride</span>
          </div>
          <div className="flex gap-8 text-sm text-[var(--muted)]">
            <a href="#" className="hover:text-[var(--ink)]">About</a>
            <a href="#" className="hover:text-[var(--ink)]">Privacy</a>
            <a href="#" className="hover:text-[var(--ink)]">Terms</a>
            <a href="#" className="hover:text-[var(--ink)]">Contact</a>
          </div>
          <div className="text-sm text-[var(--muted)]">
            © {new Date().getFullYear()} Stride. All rights reserved.
          </div>
        </div>
      </footer>

      <GoalInputModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />
    </div>
  )
}
