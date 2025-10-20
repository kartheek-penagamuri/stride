'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { MatchingInterface } from '@/components/matching/MatchingInterface'
import { SprintType } from '@/types'
import { ArrowLeft } from 'lucide-react'

function MatchingPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sprintType, setSprintType] = useState<SprintType | null>(null)

  useEffect(() => {
    const sprintParam = searchParams.get('sprint') as SprintType
    if (sprintParam && Object.values(SprintType).includes(sprintParam)) {
      setSprintType(sprintParam)
    } else {
      // Redirect to goal creation if no valid sprint type
      router.push('/onboarding')
    }
  }, [searchParams, router])

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleMatchAccepted = (podId: string) => {
    // Redirect to pod dashboard
    router.push(`/pods/${podId}`)
  }

  const handleRematchRequested = () => {
    // Could show a toast notification or update UI state
    console.log('Rematch requested')
  }

  const formatSprintType = (sprintType: SprintType) => {
    switch (sprintType) {
      case SprintType.GYM_3X_WEEK:
        return 'Gym 3×/week Sprint'
      case SprintType.NET_PROMPTING:
        return '.NET Prompting Sprint'
      default:
        return 'Learning Sprint'
    }
  }

  if (status === 'loading' || !sprintType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Pod Matching
                </h1>
                <p className="text-sm text-gray-600">
                  {formatSprintType(sprintType)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </div>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <MatchingInterface
            sprintType={sprintType}
            onMatchAccepted={handleMatchAccepted}
            onRematchRequested={handleRematchRequested}
          />
        </div>
      </div>

      {/* Help Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            How Pod Matching Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">1. Compatibility Analysis</h4>
              <p>We analyze your timezone, experience level, collaboration style, and availability to find the best matches.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">2. Pod Formation</h4>
              <p>You&apos;ll be matched with 2-4 compatible learners or join an existing pod that&apos;s forming.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">3. Start Learning</h4>
              <p>Once matched, you&apos;ll begin your structured learning sessions with your pod members.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MatchingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MatchingPageContent />
    </Suspense>
  )
}