'use client'

import { useState } from 'react'
import { VideoMeetingDetails } from '@/lib/services/video-service'
import JitsiMeetComponent from './JitsiMeetComponent'

interface VideoMeetingComponentProps {
  meeting: VideoMeetingDetails
  displayName?: string
  email?: string
  onJoin?: () => void
  onLeave?: () => void
  onError?: (error: Error) => void
  className?: string
}

export default function VideoMeetingComponent({
  meeting,
  displayName,
  email,
  onJoin,
  onLeave,
  onError,
  className = ''
}: VideoMeetingComponentProps) {
  const [showEmbedded, setShowEmbedded] = useState(false)

  const handleJoinClick = () => {
    if (meeting.provider === 'jitsi') {
      setShowEmbedded(true)
    } else {
      // For external providers, open in new window
      window.open(meeting.url, '_blank', 'noopener,noreferrer')
      onJoin?.()
    }
  }

  const getProviderIcon = () => {
    switch (meeting.provider) {
      case 'jitsi':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        )
      case 'zoom':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M8 8h8v8H8z"/>
          </svg>
        )
      case 'meet':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        )
    }
  }

  const getProviderName = () => {
    switch (meeting.provider) {
      case 'jitsi':
        return 'Jitsi Meet'
      case 'zoom':
        return 'Zoom'
      case 'meet':
        return 'Google Meet'
      case 'external':
        return 'Video Meeting'
      default:
        return 'Video Meeting'
    }
  }

  const getProviderColor = () => {
    switch (meeting.provider) {
      case 'jitsi':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'zoom':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'meet':
        return 'bg-green-600 hover:bg-green-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  // If Jitsi and embedded mode is enabled, show the embedded component
  if (meeting.provider === 'jitsi' && showEmbedded) {
    return (
      <div className={className}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Video Session</h3>
          <button
            onClick={() => setShowEmbedded(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <JitsiMeetComponent
          meeting={meeting}
          displayName={displayName}
          email={email}
          onJoin={onJoin}
          onLeave={() => {
            setShowEmbedded(false)
            onLeave?.()
          }}
          onError={onError}
          className="h-96"
        />
      </div>
    )
  }

  // Default view - show join button and meeting info
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getProviderColor()} text-white mb-4`}>
          {getProviderIcon()}
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Join Video Session
        </h3>
        
        <p className="text-gray-600 mb-6">
          Ready to join your {getProviderName()} session?
        </p>

        <div className="space-y-4">
          <button
            onClick={handleJoinClick}
            className={`w-full px-6 py-3 text-white font-medium rounded-md transition-colors ${getProviderColor()}`}
          >
            Join {getProviderName()} Session
          </button>

          {meeting.provider === 'jitsi' && (
            <p className="text-sm text-gray-500">
              No account required - just click to join
            </p>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Having trouble? Try these options:
            </p>
            <div className="space-y-2">
              <a
                href={meeting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Open in new window
              </a>
              {meeting.joinInstructions && (
                <details className="text-sm">
                  <summary className="text-gray-600 cursor-pointer hover:text-gray-800">
                    View join instructions
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-gray-700 whitespace-pre-line">
                    {meeting.joinInstructions}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}