'use client'

import { useEffect, useRef, useState } from 'react'
import { VideoMeetingDetails } from '@/lib/services/video-service'

interface JitsiMeetComponentProps {
  meeting: VideoMeetingDetails
  displayName?: string
  email?: string
  onJoin?: () => void
  onLeave?: () => void
  onError?: (error: Error) => void
  className?: string
}

// Jitsi Meet API types
interface JitsiMeetAPI {
  dispose(): void
  addEventListener(event: string, listener: (...args: unknown[]) => void): void
  removeEventListener(event: string, listener: (...args: unknown[]) => void): void
  executeCommand(command: string, ...args: unknown[]): void
  getNumberOfParticipants(): number
  isAudioMuted(): Promise<boolean>
  isVideoMuted(): Promise<boolean>
}

interface JitsiMeetOptions {
  roomName: string
  width: string
  height: string
  parentNode: HTMLElement
  configOverwrite?: Record<string, unknown>
  interfaceConfigOverwrite?: Record<string, unknown>
  userInfo?: {
    displayName?: string
    email?: string
  }
}

interface JitsiMeetExternalAPIConstructor {
  new(domain: string, options?: JitsiMeetOptions): JitsiMeetAPI
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: JitsiMeetExternalAPIConstructor
  }
}

export default function JitsiMeetComponent({
  meeting,
  displayName,
  email,
  onJoin,
  onLeave,
  onError,
  className = ''
}: JitsiMeetComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiMeetAPI | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    if (meeting.provider !== 'jitsi' || !meeting.roomName) {
      setError('Invalid Jitsi meeting configuration')
      return
    }

    loadJitsiScript()
      .then(() => initializeJitsi())
      .catch((err) => {
        console.error('Failed to load Jitsi:', err)
        setError('Failed to load video conferencing')
        onError?.(err)
      })

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting, displayName, email, onError])

  const loadJitsiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.JitsiMeetExternalAPI) {
        resolve()
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="external_api.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', reject)
        return
      }

      // Load the script
      const script = document.createElement('script')
      script.src = `https://${meeting.config?.domain || 'meet.jit.si'}/external_api.js`
      script.async = true
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const initializeJitsi = () => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      throw new Error('Jitsi API not available')
    }

    const domain: string = (typeof meeting.config?.domain === 'string' ? meeting.config.domain : null) || 'meet.jit.si'
    const options: JitsiMeetOptions = {
      roomName: meeting.roomName || '',
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: true,
        requireDisplayName: true,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        enableEmailInStats: false,
        enableUserRolesBasedOnToken: false,
        subject: `Pactly Learning Session`,
        // Toolbar configuration
        toolbarButtons: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'help'
        ]
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        APP_NAME: 'Pactly Session',
        NATIVE_APP_NAME: 'Pactly',
        PROVIDER_NAME: 'Pactly',
        LANG_DETECTION: true,
        CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
        CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
        FILM_STRIP_MAX_HEIGHT: 120,
        TILE_VIEW_MAX_COLUMNS: 5
      },
      userInfo: {
        displayName: displayName || 'Pactly User',
        email: email
      }
    }

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options)

      // Set up event listeners
      apiRef.current.addEventListener('videoConferenceJoined', () => {
        setIsJoined(true)
        setIsLoading(false)
        onJoin?.()
      })

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        setIsJoined(false)
        onLeave?.()
      })

      apiRef.current.addEventListener('readyToClose', () => {
        setIsJoined(false)
        onLeave?.()
      })

      apiRef.current.addEventListener('participantJoined', (...args: unknown[]) => {
        const participant = args[0] as { displayName: string }
        console.log('Participant joined:', participant.displayName)
      })

      apiRef.current.addEventListener('participantLeft', (...args: unknown[]) => {
        const participant = args[0] as { displayName: string }
        console.log('Participant left:', participant.displayName)
      })

      // Handle errors
      apiRef.current.addEventListener('errorOccurred', (...args: unknown[]) => {
        const error = args[0]
        console.error('Jitsi error:', error)
        setError('Video conference error occurred')
        const errorMessage = typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unknown error'
        onError?.(new Error(errorMessage))
      })

      setIsLoading(false)
    } catch (err) {
      console.error('Error initializing Jitsi:', err)
      setError('Failed to initialize video conference')
      setIsLoading(false)
      onError?.(err as Error)
    }
  }

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    initializeJitsi()
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Video Conference Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <div className="text-sm text-gray-500">
              Or{' '}
              <a
                href={meeting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                open in new window
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Video Conference</h3>
          <p className="text-gray-600">Preparing your meeting room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-lg overflow-hidden" />

      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${isJoined
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
          }`}>
          {isJoined ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {/* Fallback link */}
      <div className="absolute bottom-4 left-4 z-10">
        <a
          href={meeting.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-md hover:bg-opacity-70 transition-opacity"
        >
          Open in New Window
        </a>
      </div>
    </div>
  )
}