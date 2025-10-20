import Link from 'next/link'
import { Users, Target, Calendar, Zap, ArrowRight, Sparkles, BookOpen, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-3 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl font-bold wavy-gradient font-[family-name:var(--font-poppins)] tracking-tight">
                  Stride
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-white/80 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm mb-8">
            <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-200">Join 10,000+ habit builders worldwide</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight font-extrabold text-white mb-8 font-[family-name:var(--font-poppins)]">
            <span className="block">Build Habits</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              That Last
            </span>
          </h1>
          
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300 leading-relaxed">
            Transform your life through structured learning pods and accountability partners. 
            Build sustainable habits that stick, master new skills, and achieve lasting change through collaborative sprints.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/onboarding"
              className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
            >
              View Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-gray-400">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-gray-400">Goal Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-400">Learning Sprints</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Build Habits That Last</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transform your life through proven habit-building strategies and peer accountability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Habit Pods</h3>
                <p className="text-gray-300 leading-relaxed">
                  Get matched with 2-4 compatible habit builders based on your goals, schedule, and commitment level.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white mb-6 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Habit-Building Sprints</h3>
                <p className="text-gray-300 leading-relaxed">
                  Choose from proven habit sprints like "Gym 3×/week" or "Daily Coding" designed for long-term success.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Scheduled Sessions</h3>
                <p className="text-gray-300 leading-relaxed">
                  Regular video sessions with your pod for check-ins, planning, and collaborative learning.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Lasting Change</h3>
                <p className="text-gray-300 leading-relaxed">
                  Build sustainable habits with streak tracking, habit stacking, and peer accountability that creates real change.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start building lasting habits in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            <div className="relative text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-2xl font-bold mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Choose Your Habit</h3>
              <p className="text-gray-300 leading-relaxed max-w-sm mx-auto">
                Select a habit-building sprint that aligns with your goals and set your commitment schedule.
              </p>
            </div>

            <div className="relative text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-2xl font-bold mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Get Matched</h3>
              <p className="text-gray-300 leading-relaxed max-w-sm mx-auto">
                Our algorithm finds compatible accountability partners based on timezone, experience, and commitment style.
              </p>
            </div>

            <div className="relative text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white text-2xl font-bold mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Start Learning</h3>
              <p className="text-gray-300 leading-relaxed max-w-sm mx-auto">
                Join your pod for regular sessions, track progress, and achieve your goals together.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-10"></div>
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to start your
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  learning journey?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                Join thousands of learners achieving their goals through collaborative sprints. 
                Your transformation starts with a single step.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/onboarding"
                  className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Your First Goal
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
                >
                  Explore Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-32 border-t border-white/20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold wavy-gradient">Stride</span>
            </div>
            <p className="text-gray-400">
              &copy; 2024 Stride. Built for collaborative learning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
