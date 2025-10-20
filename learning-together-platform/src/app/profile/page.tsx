'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import ProfileForm from '@/components/profile/ProfileForm'
import UserPreferencesForm from '@/components/profile/UserPreferencesForm'

interface UserStats {
  memberSince: string
  totalGoals: number
  activePods: number
  totalCheckIns: number
}

export default function ProfilePage() {
  const { user, requireAuth } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'stats'>('profile')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!requireAuth()) return

    if (activeTab === 'stats') {
      loadStats()
    }
  }, [activeTab, requireAuth])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/me/stats')
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name || 'Profile'}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || 'User Profile'}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'preferences', label: 'Preferences' },
                { id: 'stats', label: 'Statistics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'preferences' | 'stats')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Information
                </h2>
                <ProfileForm
                  initialData={{
                    name: user.name || '',
                    timezone: 'UTC', // This would come from user data
                    image: user.image || '',
                  }}
                  onSave={(data) => {
                    console.log('Profile saved:', data)
                    // Optionally refresh user data
                  }}
                />
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  User Preferences
                </h2>
                <UserPreferencesForm
                  onSave={(preferences) => {
                    console.log('Preferences saved:', preferences)
                  }}
                />
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Account Statistics
                </h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading statistics...</p>
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {new Date(stats.memberSince).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Member Since</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.totalGoals}
                      </div>
                      <div className="text-sm text-gray-600">Total Goals</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.activePods}
                      </div>
                      <div className="text-sm text-gray-600">Active Pods</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.totalCheckIns}
                      </div>
                      <div className="text-sm text-gray-600">Total Check-ins</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Failed to load statistics
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}