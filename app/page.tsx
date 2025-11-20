 'use client'
 
 import React, { useState } from 'react'
 import { useRouter } from 'next/navigation'
 import {
   ArrowRight,
   Sparkles,
   Feather,
   Layers,
   ShieldCheck,
   Clock
 } from 'lucide-react'
 import { GoalInputModal } from '@/components/GoalInputModal'
 
 interface Stat {
   value: string
   label: string
 }
 
 interface FlowStage {
   detail: string
   title: string
   description: string
 }
 
 interface DetailHighlight {
   badge: string
   title: string
   description: string
   icon: React.ReactNode
 }
 
 interface RitualStack {
   title: string
   label: string
   highlight: string
   steps: string[]
 }
 
 interface Principle {
   title: string
   description: string
 }
 
 const navLinks = [
   { label: 'Method', id: 'method' },
   { label: 'Principles', id: 'principles' },
   { label: 'Stacks', id: 'stacks' },
   { label: 'Get Started', id: 'start' }
 ]
 
 const heroStats: Stat[] = [
   { value: '60 seconds', label: 'From idea to plan' },
   { value: '92%', label: 'Stacks kept after 2 weeks' },
   { value: '3 – 7', label: 'Steps per ritual' }
 ]
 
 const flowStages: FlowStage[] = [
   {
     detail: 'Clarity pass',
     title: 'Define your focus',
     description: 'Name the ritual, what feels stuck, and why it matters in your words.'
   },
  {
    detail: 'Context capture',
    title: 'Add optional nuance',
    description: 'Cadence, constraints, and energy give the assistant an Anthropic-like brief.'
  },
   {
     detail: 'Review layer',
     title: 'Curate the stack',
     description: 'Approve cues, actions, and rewards before they ever reach your dashboard.'
   }
 ]
 
 const detailHighlights: DetailHighlight[] = [
   {
     badge: 'Clarity',
     title: 'Capture the intention',
     description: 'Write naturally. We surface the friction to solve and the motivation to protect.',
     icon: <Feather className="h-6 w-6" />
   },
   {
     badge: 'Context',
     title: 'Layer the environment',
     description: 'Optional prompts gather cadence and constraints so every stack feels lived-in.',
     icon: <Layers className="h-6 w-6" />
   },
   {
     badge: 'Review',
     title: 'Guardrails before launch',
     description: 'Every suggestion ships with cues and rewards you can edit, decline, or save.',
     icon: <ShieldCheck className="h-6 w-6" />
   }
 ]
 
 const ritualStacks: RitualStack[] = [
   {
     title: 'Morning activation',
     label: 'AM ritual',
     highlight: 'Prime energy before the calendar steals it.',
     steps: [
       'After waking, drink a tall glass of water to reset and hydrate.',
       'Follow with 10 slow push-ups to signal movement.',
       'Sit for five mindful breaths before reading notifications.',
       'Note three gratitudes before touching your phone.'
     ]
   },
   {
     title: 'Nightly reset',
     label: 'PM ritual',
     highlight: 'Wind down the noise and enter tomorrow light.',
     steps: [
       'After dinner, park your phone in another room.',
       'Sit with a book for 20 minutes to calm the mind.',
       "Stage tomorrow's wardrobe and tools to reduce friction.",
       'Write a five-line reflection before lights out.'
     ]
   }
 ]
 
 const principles: Principle[] = [
   {
     title: 'Make it obvious',
     description: 'Cues and implementation intentions are written in your own language so the environment nudges the next move.'
   },
   {
     title: 'Make it attractive',
     description: 'We pair habits with micro-rewards or meaning you already crave, highlighting the immediate upside.'
   },
   {
     title: 'Make it easy',
     description: 'Stacks default to two-minute opening moves with no extra decisions, so momentum always has a foothold.'
   }
 ]
 
 export default function HomePage() {
   const router = useRouter()
   const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
 
   const handleDashboardNavigation = () => {
     router.push('/dashboard')
   }
 
   return (
     <>
       <div className="min-h-screen bg-[#F5EFE6] text-[#1B1917]">
         <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
           <nav className="sticky top-6 z-30 mb-12 rounded-full border border-[#D9D0C0] bg-[#FCF8F0]/90 px-5 py-4 backdrop-blur">
             <div className="flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1B1917] text-sm font-semibold uppercase text-white">
                   ST
                 </div>
                 <div>
                   <p className="text-xs uppercase tracking-[0.4em] text-[#7F6D5B]">Stride</p>
                   <p className="text-lg font-semibold text-[#1B1917]">Habit Studio</p>
                 </div>
               </div>
 
               <div className="hidden flex-1 justify-center gap-8 text-sm text-[#4F463A] md:flex">
                 {navLinks.map((link) => (
                   <a key={link.id} href={`#${link.id}`} className="transition hover:text-[#1B1917]">
                     {link.label}
                   </a>
                 ))}
               </div>
 
               <div className="flex items-center gap-3">
                 <button
                   type="button"
                   onClick={() => setIsGoalModalOpen(true)}
                   className="hidden rounded-full border border-[#D0C5B5] px-4 py-2 text-sm font-semibold text-[#4F463A] transition hover:border-[#1B1917] hover:text-[#1B1917] md:block"
                 >
                   Compose a stack
                 </button>
                 <button
                   type="button"
                   onClick={handleDashboardNavigation}
                   className="flex items-center gap-2 rounded-full bg-[#1B1917] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                 >
                   Dashboard
                   <ArrowRight className="h-4 w-4" />
                 </button>
               </div>
             </div>
           </nav>
 
           <main className="flex-1 space-y-24">
             <section
               id="start"
               className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start"
             >
               <div className="space-y-10">
                 <div className="space-y-4">
                   <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">
                     Calm, safety-first rituals
                   </p>
                   <h1 className="text-4xl font-semibold leading-tight text-[#1B1917] sm:text-5xl lg:text-6xl">
                     AI rituals that put{' '}
                     <span className="underline decoration-[#D96941] decoration-4 underline-offset-8">
                       humans
                     </span>{' '}
                     at the frontier.
                   </h1>
                   <p className="text-lg leading-relaxed text-[#4F463A]">
                    Stride pairs atomic habits with a gentle AI planner.
                     Describe the friction, add context in moments, and keep stacks that feel hand-crafted.
                   </p>
                 </div>
 
                 <div className="flex flex-wrap gap-4">
                   <button
                     type="button"
                     onClick={() => setIsGoalModalOpen(true)}
                     className="flex items-center gap-2 rounded-full bg-[#1B1917] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
                   >
                     Start a plan
                     <ArrowRight className="h-4 w-4" />
                   </button>
                   <button
                     type="button"
                     onClick={() => router.push('/method')}
                     className="rounded-full border border-[#DCCFBC] px-6 py-3 text-sm font-semibold text-[#4F463A] transition hover:border-[#B05A2C] hover:text-[#B05A2C]"
                   >
                     See how it works
                   </button>
                 </div>
 
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   {heroStats.map((stat) => (
                     <div
                       key={stat.label}
                       className="rounded-3xl border border-[#DDD2C0] bg-white/70 px-6 py-5 shadow-sm"
                     >
                       <p className="text-2xl font-semibold text-[#1B1917]">{stat.value}</p>
                       <p className="mt-2 text-sm text-[#6B5C4C]">{stat.label}</p>
                     </div>
                   ))}
                 </div>
               </div>
 
               <div className="rounded-[32px] border border-[#D9D0C0] bg-[#FBF8F1] p-8 shadow-[0_30px_70px_rgba(57,46,34,0.08)]">
                 <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#AD7C52]">
                   <Sparkles className="h-4 w-4" />
                   Flow preview
                 </div>
                 <div className="mt-8 space-y-6">
                   {flowStages.map((stage) => (
                     <div
                       key={stage.title}
                       className="rounded-2xl border border-[#E5DBCD] bg-white/60 p-5"
                     >
                       <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B18560]">
                         {stage.detail}
                       </p>
                       <p className="mt-2 text-xl font-semibold text-[#1B1917]">{stage.title}</p>
                       <p className="mt-2 text-sm leading-relaxed text-[#5C5143]">{stage.description}</p>
                     </div>
                   ))}
                 </div>
                 <div className="mt-8 flex flex-col gap-3 rounded-3xl bg-[#1B1917] px-6 py-5 text-white">
                   <div className="flex items-center justify-between text-sm font-semibold">
                     <span>Streak protection</span>
                     <Clock className="h-5 w-5" />
                   </div>
                   <p className="text-3xl font-semibold">12d</p>
                   <p className="text-sm text-white/80">
                     Green only shows up after a habit is done. We celebrate with reflection, not dopamine spikes.
                   </p>
                 </div>
               </div>
             </section>
 
             <section id="method" className="space-y-12">
               <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                 <div className="space-y-2">
                   <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Method</p>
                   <h2 className="text-3xl font-semibold text-[#1B1917]">
                     A calm cadence from intention to action.
                   </h2>
                   <p className="text-base text-[#4F463A]">
                     Each layer removes friction so your rituals stay simple, clear, and kind.
                   </p>
                 </div>
                 <button
                   type="button"
                   onClick={() => router.push('/learn')}
                   className="self-start rounded-full border border-[#DCCFBC] px-6 py-3 text-sm font-semibold text-[#4F463A] transition hover:border-[#B05A2C] hover:text-[#B05A2C]"
                 >
                   View sample plan
                 </button>
               </div>
 
               <div className="grid gap-6 md:grid-cols-3">
                 {detailHighlights.map((highlight) => (
                   <div
                     key={highlight.title}
                     className="rounded-[28px] border border-[#E0D4C4] bg-white/70 p-6 shadow-[0_16px_60px_rgba(40,31,22,0.06)]"
                   >
                     <div className="flex items-center gap-3 text-[#B05A2C]">
                       <div className="rounded-full bg-[#F5E5D4] p-2">{highlight.icon}</div>
                       <span className="text-xs uppercase tracking-[0.3em]">{highlight.badge}</span>
                     </div>
                     <p className="mt-4 text-xl font-semibold text-[#1B1917]">{highlight.title}</p>
                     <p className="mt-3 text-sm leading-relaxed text-[#5C5143]">{highlight.description}</p>
                   </div>
                 ))}
               </div>
             </section>
 
             <section id="stacks" className="space-y-10 rounded-[40px] border border-[#D9D0C0] bg-[#FCFAF5] px-6 py-10 sm:px-10">
               <div className="space-y-3">
                 <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Stacks</p>
                 <h2 className="text-3xl font-semibold text-[#1B1917]">Flow previews built to feel human.</h2>
                 <p className="text-base text-[#4F463A]">
                   We keep prompts light but thorough so each suggestion sounds like something you actually said.
                 </p>
               </div>
 
               <div className="grid gap-8 md:grid-cols-2">
                 {ritualStacks.map((stack) => (
                   <div
                     key={stack.title}
                     className="flex flex-col gap-6 rounded-[28px] border border-[#E3D8C7] bg-white/80 p-6"
                   >
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-xs uppercase tracking-[0.4em] text-[#B05A2C]">{stack.label}</p>
                         <h3 className="mt-2 text-2xl font-semibold text-[#1B1917]">{stack.title}</h3>
                         <p className="mt-1 text-sm text-[#5C5143]">{stack.highlight}</p>
                       </div>
                       <span className="rounded-full bg-[#F4E3D0] px-4 py-1 text-xs font-semibold text-[#5C5143]">
                         {stack.steps.length} steps
                       </span>
                     </div>
                     <ul className="space-y-3 text-sm leading-relaxed text-[#3C342C]">
                       {stack.steps.map((step) => (
                         <li key={step} className="flex items-start gap-3">
                           <span className="mt-1 h-2 w-2 rounded-full bg-[#C05A2C]" />
                           <span>{step}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             </section>
 
             <section id="principles" className="space-y-8">
               <div className="space-y-3">
                 <p className="text-xs uppercase tracking-[0.4em] text-[#8A7761]">Principles</p>
                 <h2 className="text-3xl font-semibold text-[#1B1917]">Safety-first behaviors guide every ritual.</h2>
               </div>
               <div className="grid gap-6 md:grid-cols-3">
                 {principles.map((principle) => (
                   <div
                     key={principle.title}
                     className="rounded-[28px] border border-[#E0D4C4] bg-white/70 p-6"
                   >
                     <h3 className="text-2xl font-semibold text-[#1B1917]">{principle.title}</h3>
                     <p className="mt-3 text-sm leading-relaxed text-[#5C5143]">{principle.description}</p>
                   </div>
                 ))}
               </div>
             </section>
 
             <section className="rounded-[40px] border border-[#D9D0C0] bg-[#1B1917] px-6 py-10 text-white sm:px-10">
               <div className="space-y-6">
                 <p className="text-xs uppercase tracking-[0.4em] text-white/70">Begin</p>
                 <div className="space-y-4">
                   <h2 className="text-4xl font-semibold">Start softer. Stay longer.</h2>
                   <p className="text-base text-white/80">
                     Tell the assistant what needs care, capture two minutes of context, and approve a ritual that feels like you.
                   </p>
                 </div>
                 <div className="flex flex-wrap gap-4">
                   <button
                     type="button"
                     onClick={() => setIsGoalModalOpen(true)}
                     className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1B1917] transition hover:bg-[#F4EFE6]"
                   >
                     Start a plan
                     <ArrowRight className="h-4 w-4" />
                   </button>
                   <button
                     type="button"
                     onClick={handleDashboardNavigation}
                     className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                   >
                     View dashboard
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
