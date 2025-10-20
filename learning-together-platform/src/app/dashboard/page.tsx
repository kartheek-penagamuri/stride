'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Users, Calendar, Target } from 'lucide-react'

function DashboardPageContent() {
  const searchParams = useSearchParams()
  const goalCreated = searchParams.get('goalCreated')
  const [showWelcome, setShowWelcome] = useState(!!goalCreated)

  useEffect(() => {
    if (goalCreated) {
      // Auto-hide welcome message after 5 seconds
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [goalCreated])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        {showWelcome && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <h2 className="text-xl font-semibold text-green-900">
                  Welcome to Your Learning Journey!
                </h2>
                <p className="text-green-700 mt-1">
                  Your goal has been created successfully. We&apos;re now finding the perfect learning partners for you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Track your progress, connect with your learning pod, and achieve your goals.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Goals</h3>
                <p className="text-2xl font-bold text-blue-600">1</p>
                <p className="text-sm text-gray-500">Sprint in progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Learning Pod</h3>
                <p className="text-2xl font-bold text-green-600">Matching...</p>
                <p className="text-sm text-gray-500">Finding partners</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Next Session</h3>
                <p className="text-2xl font-bold text-purple-600">TBD</p>
                <p className="text-sm text-gray-500">Pending pod formation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Current Sprint */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Sprint</h2>
            {goalCreated ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-blue-900">Sprint Goal Created</h3>
                    <p className="text-blue-700 text-sm">Your learning journey is about to begin!</p>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Status:</strong> Waiting for pod matching</p>
                  <p><strong>Expected Start:</strong> Within 24-48 hours</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sprint</h3>
                <p className="text-gray-600 mb-4">Start your learning journey by creating a goal.</p>
                <a
                  href="/onboarding"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Create Goal
                </a>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {goalCreated ? (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Goal created successfully</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {goalCreated && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">What&apos;s Next?</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  1
                </div>
                <span className="text-blue-800">We&apos;re finding 2-3 compatible learning partners for you</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  2
                </div>
                <span className="text-gray-600">You&apos;ll receive an invitation to join your learning pod</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  3
                </div>
                <span className="text-gray-600">Your first session will be scheduled</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  )
}