'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useVideoMeeting } from '@/hooks/useVideoMeeting'
import VideoMeetingComponent from '@/components/video/VideoMeetingComponent'
import { SessionDetails } from '@/lib/services/session-service'

interface SessionVideoInterfaceProps {
  session: SessionDetails
  onJoinSession?: () => void
  onLeaveSession?: () => void
}

export default function SessionVideoInterface({
  session,
  onJoinSession,
  onLeaveSession
}: SessionVideoInterfaceProps) {
  const { data: authSession } = useSession()
  const [isJoined, setIsJoined] = useState(false)
  const [showVideoSettings, setShowVideoSettings] = useState(false)
  
  const {
    videoMeeting,
    isLoading,
    error,
    updateVideoMeeting,
    clearError
  } = useVideoMeeting({
    sessionId: session.id,
    autoLoad: true
  })

  const handleJoin = () => {
    setIsJoined(true)
    onJoinSession?.()
  }

  const handleLeave = () => {
    setIsJoined(false)
    onLeaveSession?.()
  }

  const handleVideoProviderChange = async (provider: string, url?: string) => {
    try {
      await updateVideoMeeting({
        provider,
        url,
        options: {}
      })
      setShowVideoSettings(false)
    } catch {
      // Error is already handled by the hook
    }
  }

  if (isLoading && !videoMeeting) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video meeting...</p>
        </div>
      </div>
    )
  }

  if (error && !videoMeeting) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Video Meeting Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (!videoMeeting) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Meeting</h3>
          <p className="text-gray-600 mb-4">This session doesn&apos;t have a video meeting configured.</p>
          <button
            onClick={() => setShowVideoSettings(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Set Up Video Meeting
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Session Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            session.status === 'active' ? 'bg-green-500' :
            session.status === 'scheduled' ? 'bg-yellow-500' :
            session.status === 'completed' ? 'bg-gray-500' :
            'bg-red-500'
          }`} />
          <span className="text-sm font-medium text-gray-900 capitalize">
            {session.status} Session
          </span>
          {isJoined && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Joined
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVideoSettings(!showVideoSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            title="Video Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Video Settings Panel */}
      {showVideoSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Video Meeting Settings</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVideoProviderChange('jitsi')}
                className={`p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 ${
                  videoMeeting.provider === 'jitsi' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Jitsi Meet</div>
                <div className="text-xs text-gray-600">Free, no account needed</div>
              </button>
              
              <button
                onClick={() => {
                  const url = prompt('Enter Zoom meeting URL:')
                  if (url) handleVideoProviderChange('zoom', url)
                }}
                className={`p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 ${
                  videoMeeting.provider === 'zoom' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Zoom</div>
                <div className="text-xs text-gray-600">External meeting link</div>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const url = prompt('Enter Google Meet URL:')
                  if (url) handleVideoProviderChange('meet', url)
                }}
                className={`p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 ${
                  videoMeeting.provider === 'meet' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Google Meet</div>
                <div className="text-xs text-gray-600">External meeting link</div>
              </button>
              
              <button
                onClick={() => {
                  const url = prompt('Enter custom video meeting URL:')
                  if (url) handleVideoProviderChange('external', url)
                }}
                className={`p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 ${
                  videoMeeting.provider === 'external' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Other</div>
                <div className="text-xs text-gray-600">Custom meeting link</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Meeting Component */}
      <VideoMeetingComponent
        meeting={videoMeeting}
        displayName={authSession?.user?.name || undefined}
        email={authSession?.user?.email || undefined}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onError={(error) => console.error('Video meeting error:', error)}
        className="min-h-[400px]"
      />

      {/* Session Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Scheduled:</span>
            <div className="font-medium">
              {new Date(session.scheduledAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Participants:</span>
            <div className="font-medium">
              {session.pod.memberships.length} members
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}