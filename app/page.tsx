'use client'

import React, { useEffect, useState } from 'react'
import {
  Eye,
  Target,
  Zap,
  PartyPopper,
  ArrowRight,
  Sparkles,
  Feather,
  Layers,
  LineChart,
  Clock
} from 'lucide-react'
import { GoalInputModal } from '@/components/GoalInputModal'
import { useRouter } from 'next/navigation'

interface PrincipleCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

interface HabitStackProps {
  title: string
  subtitle: string
  badgeLabel: string
  badgeClass: string
  items: string[]
}

interface Principle {
  icon: React.ReactNode
  title: string
  description: string
}

interface MethodStep {
  title: string
  description: string
  detail: string
  icon: React.ReactNode
}

const navLinks = [
  { label: 'Method', id: 'method' },
  { label: 'Principles', id: 'principles' },
  { label: 'Stacks', id: 'stacks' },
  { label: 'Get Started', id: 'start' }
]

const heroMetrics = [
  { value: '< 60s', label: 'Average plan time' },
  { value: '92%', label: 'Habits kept after 2 weeks' },
  { value: '3 - 7', label: 'Steps per stack' }
]

const methodSteps: MethodStep[] = [
  {
    title: 'Define your focus',
    description: 'Describe the outcome you want and the friction you feel.',
    detail: 'We translate your narrative into leverage points.',
    icon: <Feather className="w-5 h-5" />
  },
  {
    title: 'Add context',
    description: 'Answer lightweight prompts to capture constraints and cadence.',
    detail: 'Optional questions sharpen the recommendation engine.',
    icon: <Layers className="w-5 h-5" />
  },
  {
    title: 'Curate the stack',
    description: 'Review the proposed rituals and keep what resonates.',
    detail: 'Every habit still maps to the four laws.',
    icon: <LineChart className="w-5 h-5" />
  }
]

const principles: Principle[] = [
  {
    icon: <Eye className="w-5 h-5 text-slate-900" />,
    title: 'Make it Obvious',
    description:
      'Design visible cues and implementation intentions so your environment nudges the right move.'
  },
  {
    icon: <Target className="w-5 h-5 text-slate-900" />,
    title: 'Make it Attractive',
    description:
      'Bundle the habit with something you already crave and highlight the immediate upside.'
  },
  {
    icon: <Zap className="w-5 h-5 text-slate-900" />,
    title: 'Make it Easy',
    description:
      'Shrink the opening move to two minutes or less and remove unnecessary choices.'
  },
  {
    icon: <PartyPopper className="w-5 h-5 text-slate-900" />,
    title: 'Make it Satisfying',
    description:
      'Close every rep with a reward or reflection so your brain notes the win.'
  }
]

const morningStack: string[] = [
  'After waking, drink a tall glass of water to reset and hydrate.',
  'After water, perform 10 push-ups to spark circulation.',
  'After movement, sit for five mindful breaths to center attention.',
  "After centering, note three gratitudes before touching your phone."
]

const eveningStack: string[] = [
  'After dinner, park your phone in another room to reduce noise.',
  'After stepping away, read for 20 minutes to calm your mind.',
  'After reading, stage tomorrow’s wardrobe to lighten the morning.',
  'After prep, write a five-line reflection to log the day.'
]

const curatedStacks: HabitStackProps[] = [
  {
    title: 'Morning Activation',
    subtitle: 'Prime your energy before noon steals it.',
    badgeLabel: 'AM Ritual · 4 steps',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    items: morningStack
  },
  {
    title: 'Evening Wind Down',
    subtitle: 'Close open loops and signal rest.',
    badgeLabel: 'PM Reset · 4 steps',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    items: eveningStack
  }
]

const PrincipleCard: React.FC<PrincipleCardProps> = ({ icon, title, description }) => (
  <div className="soft-card border border-slate-200 bg-white/95 p-6 flex flex-col gap-4 h-full">
    <div className="w-12 h-12 rounded-2xl bg-slate-900/90 text-white flex items-center justify-center">
      {icon}
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
)

const HabitStackCard: React.FC<HabitStackProps> = ({
  title,
  subtitle,
  badgeLabel,
  badgeClass,
  items
}: HabitStackProps) => (
  <div className="soft-card border border-slate-200 bg-white/95 p-8 relative overflow-hidden">
    <div className="absolute inset-x-8 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
    <div className="relative flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Stack</p>
        <h3 className="text-2xl font-semibold text-slate-900 mt-2">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${badgeClass}`}>
        {badgeLabel}
      </span>
    </div>
    <div className="relative space-y-4">
      {items.map((item: string, index: number) => (
        <div key={index} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">
            {index + 1}
          </div>
          <p className="text-base text-slate-600 flex-1 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  </div>
)

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const yOffset = -90
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset

      window.scrollTo({
        top: y,
        behavior: 'smooth'
      })
    }
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleHabitsAdded = () => {
    router.push('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f5ff]">
      <div className="absolute inset-x-0 top-[-20%] h-[70%] hero-surface opacity-80 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/80 via-white/30 to-transparent pointer-events-none" />

      <header className="sticky top-6 z-40 px-4">
        <div
          className={`max-w-6xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-[32px] border border-white/70 bg-white/80 backdrop-blur ${
            isScrolled ? 'shadow-[0_20px_60px_rgba(15,23,42,0.12)]' : 'shadow-[0_12px_50px_rgba(15,23,42,0.08)]'
          } px-6 py-4 transition-all`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold tracking-tight">
              AH
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Atomic Habits</p>
              <p className="text-base font-semibold text-slate-900">Personal Habit Studio</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200 transition-colors"
            >
              Dashboard
              <ArrowRight className="w-4 h-4" />
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,1fr),360px] items-start">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/80 text-xs font-semibold tracking-[0.25em] uppercase text-slate-500">
                <Sparkles className="w-4 h-4 text-slate-900" />
                Precision Habits
              </span>
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-semibold leading-tight text-slate-900 tracking-tight">
                  Build habits with the calm, minimal tooling your focus deserves.
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                  Stride pairs the Atomic Habits framework with a gentle AI assistant. Describe where you&apos;re stuck,
                  add context in moments, and leave with a stack that feels effortless.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-900 text-white px-6 py-4 text-base font-semibold tracking-tight hover:bg-slate-800 transition-colors"
                >
                  Start a plan
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('method')}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-300 px-6 py-4 text-base font-semibold text-slate-700 hover:border-slate-500 transition-colors"
                >
                  See how it works
                </button>
              </div>
              <div className="grid gap-6 sm:grid-cols-3 border-t border-white/60 pt-6">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                    <p className="text-sm text-slate-500">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card border border-white/70 bg-white/90 shadow-[0_30px_70px_rgba(15,23,42,0.12)] p-8 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-300/40 to-purple-300/40 blur-3xl" />
              <div className="space-y-6 relative">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Flow preview</p>
                  <h3 className="text-2xl font-semibold text-slate-900 mt-2">Habit Composer</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    A calm sequence that moves from intent to precise ritual.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Define the moment',
                      description:
                        '“I doom-scroll after work and want a healthier decompression ritual.”',
                      icon: <Clock className="w-4 h-4" />
                    },
                    {
                      title: 'Add nuance',
                      description: 'Tell us about stress triggers, what has worked, and time of day.',
                      icon: <Layers className="w-4 h-4" />
                    },
                    {
                      title: 'Curate the stack',
                      description: 'Approve the cue, action, and reward for each habit we craft.',
                      icon: <LineChart className="w-4 h-4" />
                    }
                  ].map((item, index) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          {item.icon}
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">Context captured</p>
                  <p className="text-xs text-slate-500 mt-1">
                    AI uses your language to keep the plan human. No templates, no overwhelm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Method</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
                A thoughtful cadence from intention to action.
              </h2>
              <p className="text-base text-slate-600">
                Each step removes friction, surfaces context, and keeps you anchored to the four Atomic Habits laws.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {methodSteps.map((step) => (
                <div key={step.title} className="soft-card border border-slate-200 bg-white/95 p-6 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="principles" className="py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Principles</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
                The four laws sit underneath every recommendation.
              </h2>
              <p className="text-base text-slate-600">
                Your plan may be personal, but the structure never drifts from what makes habits remain.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {principles.map((principle, index) => (
                <PrincipleCard
                  key={`${principle.title}-${index}`}
                  icon={principle.icon}
                  title={principle.title}
                  description={principle.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="stacks" className="py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Examples</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Elegant habit stacks built in seconds.</h2>
              <p className="text-base text-slate-600">
                Use them as inspiration or as proof that a tiny, well-designed chain is all you need.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              {curatedStacks.map((stack) => (
                <HabitStackCard key={stack.title} {...stack} />
              ))}
            </div>
          </div>
        </section>

        <section id="start" className="py-20 px-4">
          <div className="max-w-5xl mx-auto soft-card border border-slate-200 bg-white/95 p-10 space-y-8 relative overflow-hidden">
            <div className="absolute inset-x-10 top-0 h-24 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
            <div className="relative space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Get Started</p>
              <h2 className="text-3xl font-semibold text-slate-900">Ready when you are.</h2>
              <p className="text-base text-slate-600 max-w-3xl">
                Bring one goal. Leave with a beautifully minimal plan and an optional dashboard to track progress.
                No noise, no guilt—just the next right move.
              </p>
            </div>
            <div className="relative flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-900 text-white px-8 py-4 text-base font-semibold tracking-tight hover:bg-slate-800 transition-colors flex-1"
              >
                Generate my habits
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 hover:border-slate-500 transition-colors flex-1"
              >
                Explore the dashboard
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-900" />
            <span className="font-semibold text-slate-900">Stride · Atomic Habits Studio</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Stride. Inspired by the ideas of James Clear.
          </p>
        </div>
      </footer>

      <GoalInputModal isOpen={isModalOpen} onClose={handleCloseModal} onHabitsAdded={handleHabitsAdded} />
    </div>
  )
}
