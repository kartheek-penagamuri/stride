'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Compass,
  Globe2,
  Heart,
  MapPin,
  Search,
  Sparkles
} from 'lucide-react'
import { GoalInputModal } from '@/components/GoalInputModal'

type Collection = {
  title: string
  copy: string
  chip: string
  gradient: string
}

type PromiseCard = {
  title: string
  description: string
  icon: React.ReactNode
  tag: string
}

const collections: Collection[] = [
  {
    title: 'Morning reset',
    copy: 'Two-minute openings that feel as easy as grabbing keys on the way out.',
    chip: 'Gentle AM',
    gradient: 'from-[#f7f9fc] via-white to-[#eef4ff]'
  },
  {
    title: 'Focus sprint',
    copy: 'Workday rituals with breaks, light movement, and screens-off cues baked in.',
    chip: 'Deep work',
    gradient: 'from-[#f7fafd] via-white to-[#eef5ff]'
  },
  {
    title: 'Wind-down stay',
    copy: 'Evening stacks that trade doomscrolling for breathing, stretching, and sleep.',
    chip: 'Night reset',
    gradient: 'from-[#f5f9ff] via-white to-[#eef4ff]'
  },
  {
    title: 'Move more, kindly',
    copy: 'Micro-strength, walks, and mobility stacked like an expert-curated itinerary.',
    chip: 'Movement',
    gradient: 'from-[#f6fbff] via-white to-[#eef6ff]'
  }
]

const promises: PromiseCard[] = [
  {
    title: 'Designed like a concierge',
    description: 'Pick your vibe and cadence, and we arrange the details in a calm, guided flow.',
    icon: <Globe2 className="h-5 w-5 text-[var(--accent)]" />,
    tag: 'Concierge'
  },
  {
    title: 'Safety built in',
    description: 'Guardrails, reminders, and soft prompts mean you always know the next gentle step.',
    icon: <ShieldIcon />,
    tag: 'Safety'
  },
  {
    title: 'Human tone',
    description: 'Copy, nudges, and rewards sound like someone kind—not another productivity robot.',
    icon: <Heart className="h-5 w-5 text-[var(--accent)]" />,
    tag: 'Calm'
  }
]

const itinerary = [
  { title: 'Share what needs care', detail: 'Tell us the friction point and the feeling you want more of.' },
  { title: 'Add dates + vibe', detail: 'Pick mornings, afternoons, or evenings and the pace you prefer.' },
  { title: 'Approve the plan', detail: 'Review each habit card and save only what feels right.' }
]

function ShieldIcon() {
  return (
    <svg
      className="h-5 w-5 text-[var(--accent)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12 4.5l7.5 3.2v4.3c0 3.4-2.5 6.6-7.5 7.5-5-0.9-7.5-4.1-7.5-7.5V7.7L12 4.5z"
      />
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  const handleDashboardNavigation = () => {
    router.push('/dashboard')
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-10">
          <header className="sticky top-4 z-40 mb-10">
            <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--border)] bg-white/90 px-4 py-3 shadow-[0_14px_45px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold uppercase text-white shadow-[0_14px_35px_rgba(0,132,137,0.28)]">
                  ST
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Stride</p>
                  <p className="text-lg font-semibold">Personal Rituals</p>
                </div>
              </div>

              <div className="hidden flex-1 items-center justify-center md:flex">
                <div className="flex w-full max-w-xl items-center divide-x divide-[var(--border)] rounded-full border border-[var(--border)] bg-[var(--card)] px-2 shadow-sm">
                  <button className="flex flex-1 flex-col px-4 py-2 text-left transition hover:rounded-full hover:bg-[var(--accent-soft)]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Need help with</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">Morning energy</span>
                  </button>
                  <button className="flex flex-col px-4 py-2 text-left transition hover:rounded-full hover:bg-[var(--accent-soft)]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">When</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">Next 7 days</span>
                  </button>
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  >
                    <Search className="h-4 w-4" />
                    Plan it
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={handleDashboardNavigation}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:shadow-md"
                >
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-20">
            <section className="hero-surface rounded-[38px] border border-[var(--border)] px-6 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.08)] sm:px-8 lg:px-12">
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--accent)] shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    New: Ritual concierge with a human touch
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold leading-tight text-[var(--ink)] sm:text-5xl lg:text-6xl">
                      Plan rituals with a calm, personal guide.
                    </h1>
                    <p className="max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
                      Tell us what matters, pick your vibe, and approve a stack that feels curated—not clinical. Stride blends
                      atomic habits with calm guidance built in.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsGoalModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(0,132,137,0.28)] transition hover:bg-[var(--accent-strong)]"
                    >
                      Start planning
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDashboardNavigation}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:shadow-md"
                    >
                      View dashboard
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: '0 to plan', value: '60 seconds' },
                      { label: 'Kept after 2 weeks', value: '92%' },
                      { label: 'Steps per ritual', value: '3 – 7' }
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-3xl border border-[var(--border)] bg-white/90 px-5 py-4 shadow-sm">
                        <p className="text-2xl font-semibold text-[var(--ink)]">{stat.value}</p>
                        <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="pill-card glass relative overflow-hidden rounded-[30px] border border-[var(--border)]">
                    <div className="absolute inset-0 opacity-70" aria-hidden>
                      <div className="h-full w-full bg-gradient-to-br from-[var(--accent-soft)] via-white to-[#e8f7ff]" />
                    </div>
                    <div className="relative space-y-6 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] shadow-sm">
                            <Search className="h-5 w-5 text-[var(--accent)]" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Ritual planner</p>
                            <p className="text-base font-semibold text-[var(--ink)]">Concierge mode</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-[var(--muted)] shadow-sm">
                          Live preview
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl bg-white/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                          <MapPin className="h-5 w-5 text-[var(--accent)]" />
                          <div className="flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Where do you need support?</p>
                            <p className="text-sm font-semibold text-[var(--ink)]">Morning routine at home</p>
                          </div>
                          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--accent)]">Flexible</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                            <Calendar className="h-5 w-5 text-[var(--accent)]" />
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Cadence</p>
                              <p className="text-sm font-semibold text-[var(--ink)]">Weekdays</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                            <Clock3 className="h-5 w-5 text-[var(--accent)]" />
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Length</p>
                              <p className="text-sm font-semibold text-[var(--ink)]">11 minutes</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-white/90 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[var(--ink)]">Suggested rituals</p>
                            <span className="text-[11px] font-semibold text-[var(--muted)]">Curated for you</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              'Drink water before screens',
                              'Sunlight on the patio for 5 minutes',
                              'Stretch + two deep breaths',
                              'Set one intention in Notes'
                            ].map((item) => (
                              <div key={item} className="flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--ink)]">
                                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/90 px-4 py-3 shadow-sm">
                        <div className="flex -space-x-2">
                          {[1, 2, 3, 4].map((item) => (
                            <div
                              key={item}
                              className="h-8 w-8 rounded-full border border-white bg-gradient-to-br from-[var(--accent-soft)] to-[#e6f5ff] shadow-sm"
                            />
                          ))}
                        </div>
                        <div className="text-sm text-[var(--muted)]">
                          <span className="font-semibold text-[var(--ink)]">Guides are ready</span> to keep you on track daily.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="collections" className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">Collections</p>
                  <h2 className="text-3xl font-bold text-[var(--ink)]">Pick a vibe like choosing a stay.</h2>
                  <p className="text-base text-[var(--muted)]">Every collection is ready-made with steps you can edit or swap.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
                >
                  Browse and customize
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {collections.map((collection) => (
                  <div
                    key={collection.title}
                    className={`pill-card relative overflow-hidden border-[var(--border)] bg-gradient-to-br ${collection.gradient}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,132,137,0.08),transparent_45%)] opacity-50" aria-hidden />
                    <div className="relative flex flex-col gap-4 p-6">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                          {collection.chip}
                        </span>
                        <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Curated</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-[var(--ink)]">{collection.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{collection.copy}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-semibold text-[var(--ink)] shadow-sm">
                          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                          Save to dashboard
                        </span>
                        <button
                          className="font-semibold text-[var(--accent)] hover:underline"
                          onClick={() => setIsGoalModalOpen(true)}
                        >
                          Preview stack
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="method" className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">Method</p>
                  <h2 className="text-3xl font-bold text-[var(--ink)]">Your itinerary, calmly approved.</h2>
                  <p className="text-base text-[var(--muted)]">We guide you with clear steps and adapt if plans change.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Compass className="h-4 w-4 text-[var(--accent)]" />
                  Always editable before it ships to your dashboard
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="soft-card space-y-6 p-6">
                  {itinerary.map((item, index) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[var(--ink)]">{item.title}</p>
                        <p className="text-sm text-[var(--muted)]">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-3 pt-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-2 font-semibold text-[var(--accent)]">
                      <Heart className="h-4 w-4" />
                      Friendly tone, always
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f7ff] px-3 py-2 font-semibold text-[var(--spruce)]">
                      <Globe2 className="h-4 w-4" />
                      Works worldwide
                    </span>
                  </div>
                </div>

                <div className="soft-card space-y-5 p-6">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">Peace of mind</div>
                    <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Always-on</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {promises.map((promise) => (
                      <div key={promise.title} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-[var(--accent)]">
                          {promise.icon}
                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{promise.tag}</span>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{promise.title}</p>
                        <p className="text-sm text-[var(--muted)]">{promise.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
                        4.9
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[var(--ink)]">Guests-turned-creators love the vibe</p>
                        <p className="text-sm text-[var(--muted)]">“The planner feels like booking a weekend away. No pressure, just clarity.”</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[var(--border)] bg-white/95 px-6 py-10 shadow-[0_26px_75px_rgba(0,0,0,0.08)] sm:px-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">Stay on</p>
                  <h2 className="text-3xl font-bold text-[var(--ink)]">Ready to launch your next ritual?</h2>
                  <p className="text-base text-[var(--muted)]">Jump into the dashboard or compose a new stack in one click.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGoalModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(0,132,137,0.28)] transition hover:bg-[var(--accent-strong)]"
                  >
                    Compose a stack
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDashboardNavigation}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:shadow-md"
                  >
                    Go to dashboard
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <GoalInputModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />
    </>
  )
}
