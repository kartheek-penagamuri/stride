'use client'

import React, { useEffect, useState } from 'react'
import { Eye, Target, Zap, PartyPopper, ArrowRight, Sparkles } from 'lucide-react'

interface PrincipleCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

interface StackItemProps {
  number: number
  text: string
}

interface HabitStackProps {
  title: string
  items: string[]
}

interface Principle {
  icon: React.ReactNode
  title: string
  description: string
}

const PrincipleCard: React.FC<PrincipleCardProps> = ({ icon, title, description }: PrincipleCardProps) => (
  <div className="card-hover bg-white rounded-2xl p-8 text-center border-l-4 border-indigo-500 shadow-lg">
    <div className="text-5xl mb-4 flex justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
)

const StackItem: React.FC<StackItemProps> = ({ number, text }: StackItemProps) => (
  <div className="flex items-center p-4 bg-white/5 rounded-xl mb-3">
    <div className="bg-yellow-400 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
      {number}
    </div>
    <div className="text-white">{text}</div>
  </div>
)

const HabitStack: React.FC<HabitStackProps> = ({ title, items }: HabitStackProps) => (
  <div className="glass rounded-2xl p-6 border-l-4 border-yellow-400">
    <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
    {items.map((item: string, index: number) => (
      <StackItem key={index} number={index + 1} text={item} />
    ))}
  </div>
)

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const principles: Principle[] = [
    {
      icon: <Eye className="w-12 h-12 text-indigo-600" />,
      title: "Make it Obvious",
      description: "Design your environment to make good habits visible and bad habits invisible. Use implementation intentions and habit stacking."
    },
    {
      icon: <Target className="w-12 h-12 text-indigo-600" />,
      title: "Make it Attractive", 
      description: "Bundle habits you need to do with habits you want to do. Use temptation bundling to make habits irresistible."
    },
    {
      icon: <Zap className="w-12 h-12 text-indigo-600" />,
      title: "Make it Easy",
      description: "Reduce friction for good habits and increase friction for bad ones. Follow the 2-minute rule to start small."
    },
    {
      icon: <PartyPopper className="w-12 h-12 text-indigo-600" />,
      title: "Make it Satisfying",
      description: "Use immediate rewards and habit tracking to make good habits feel good. Never miss twice in a row."
    }
  ]

  const morningStack: string[] = [
    "After I wake up, I will drink a glass of water",
    "After I drink water, I will do 10 push-ups", 
    "After I do push-ups, I will meditate for 5 minutes",
    "After I meditate, I will write 3 things I'm grateful for"
  ]

  const eveningStack: string[] = [
    "After I finish dinner, I will put my phone in another room",
    "After I put my phone away, I will read for 20 minutes",
    "After I read, I will prepare tomorrow's clothes",
    "After I prepare clothes, I will do a 5-minute reflection"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'glass' : 'bg-white/10 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Atomic Habits</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('principles')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Principles
              </button>
              <button 
                onClick={() => scrollToSection('stacking')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Habit Stacking
              </button>
              <button 
                onClick={() => scrollToSection('start')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="text-center py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6">
              Build <span className="text-gradient font-bold">Atomic Habits</span>
              <br />
              That Stack Into Success
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your life through tiny changes that compound into remarkable results. 
              Start small, stack smart, achieve big.
            </p>
            <button 
              onClick={() => scrollToSection('start')}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Principles Section */}
        <section id="principles" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">The Four Laws of Atomic Habits</h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                The fundamental principles that make habits stick and transform your life
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {principles.map((principle, index) => (
                <PrincipleCard
                  key={index}
                  icon={principle.icon}
                  title={principle.title}
                  description={principle.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Habit Stacking Section */}
        <section id="stacking" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Habit Stacking Examples</h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Stack new habits onto existing ones to build powerful routines that stick
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <HabitStack title="Morning Success Stack" items={morningStack} />
              <HabitStack title="Evening Wind-Down Stack" items={eveningStack} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="start" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass rounded-3xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start?
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Begin with just 1% better every day. Small changes, remarkable results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/dashboard"
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Tracking Habits
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="/learning-together-platform/src/app/page.tsx"
                  className="inline-flex items-center px-8 py-4 glass text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300"
                >
                  Learning Platform
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-white/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-bold text-white">Atomic Habits</span>
          </div>
          <p className="text-white/60">
            &copy; 2024 Atomic Habits Platform. Inspired by James Clear's "Atomic Habits"
          </p>
        </div>
      </footer>
    </div>
  )
}