'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PodDetails } from '@/lib/services/pod-service'
import { Users, Calendar, Settings, ArrowLeft, Globe } from 'lucide-react'

interface PodPageProps {
  params: { podId: string }
}

export default function PodPage({ params }: PodPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pod, setPod] = useState<PodDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPodDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/pods/${params.podId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch pod details')
      }

      setPod(result.data)
    } catch (error) {
      console.error('Error fetching pod details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load pod')
    } finally {
      setLoading(false)
    }
  }, [params.podId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchPodDetails()
    }
  }, [status, fetchPodDetails, router])

  const handleLeavePod = async () => {
    if (!confirm('Are you sure you want to leave this pod?')) return

    try {
      const response = await fetch(`/api/pods/${params.podId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'User requested to leave'
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error?.message || 'Failed to leave pod')
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error leaving pod:', error)
      alert(error instanceof Error ? error.message : 'Failed to leave pod')
    }
  }

  const formatSprintType = (sprintType: string) => {
    switch (sprintType) {
      case 'gym_3x_week':
        return 'Gym 3×/week Sprint'
      case 'net_prompting':
        return '.NET Prompting Sprint'
      default:
        return 'Learning Sprint'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'disbanded':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pod details...</p>
        </div>
      </div>
    )
  }

  if (error || !pod) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pod Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The pod you\'re looking for doesn\'t exist or you don\'t have access to it.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Pod Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  {formatSprintType(pod.sprintType)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pod.status)}`}>
                {pod.status.charAt(0).toUpperCase() + pod.status.slice(1)}
              </span>
              {session?.user.image && (
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pod Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pod Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Pod Information
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{pod.currentMembers}/{pod.maxMembers} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {pod.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {pod.compatibilityScore && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(pod.compatibilityScore.overall * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Compatibility
                    </div>
                  </div>
                )}
              </div>

              {pod.compatibilityScore && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Timezone</span>
                      <span className="font-medium">{Math.round(pod.compatibilityScore.timezoneMatch * 100)}%</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience</span>
                      <span className="font-medium">{Math.round(pod.compatibilityScore.experienceLevel * 100)}%</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Style</span>
                      <span className="font-medium">{Math.round(pod.compatibilityScore.collaborationStyle * 100)}%</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Availability</span>
                      <span className="font-medium">{Math.round(pod.compatibilityScore.availabilityOverlap * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {pod.status === 'forming' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800 text-sm">
                    🚀 Your pod is still forming! We&apos;re waiting for more members to join before starting sessions.
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Sessions Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Sessions
              </h2>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No sessions scheduled yet</p>
                <p className="text-sm">Sessions will be scheduled once your pod is active</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pod Members */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pod Members
              </h3>
              <div className="space-y-3">
                {pod.members.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {member.name}
                        {member.role === 'facilitator' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Facilitator
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Globe className="w-3 h-3" />
                        <span>{member.timezone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pod Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  <Settings className="w-4 h-4" />
                  Pod Settings
                </button>
                <button 
                  onClick={handleLeavePod}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Leave Pod
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}