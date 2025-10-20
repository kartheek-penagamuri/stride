'use client'

import { useState, useEffect, useCallback } from 'react'
import { VideoMeetingDetails } from '@/lib/services/video-service'

interface UseVideoMeetingOptions {
  sessionId: string
  autoLoad?: boolean
}

interface UseVideoMeetingReturn {
  videoMeeting: VideoMeetingDetails | null
  isLoading: boolean
  error: string | null
  loadVideoMeeting: () => Promise<void>
  updateVideoMeeting: (config: {
    provider: string
    url?: string
    options?: Record<string, unknown>
  }) => Promise<void>
  clearError: () => void
}

export function useVideoMeeting({
  sessionId,
  autoLoad = true
}: UseVideoMeetingOptions): UseVideoMeetingReturn {
  const [videoMeeting, setVideoMeeting] = useState<VideoMeetingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadVideoMeeting = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/video`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load video meeting')
      }

      setVideoMeeting(data.videoMeeting)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video meeting'
      setError(errorMessage)
      console.error('Error loading video meeting:', err)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  const updateVideoMeeting = useCallback(async (config: {
    provider: string
    url?: string
    options?: Record<string, unknown>
  }) => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/video`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update video meeting')
      }

      setVideoMeeting(data.videoMeeting)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update video meeting'
      setError(errorMessage)
      console.error('Error updating video meeting:', err)
      throw err // Re-throw so caller can handle
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && sessionId) {
      loadVideoMeeting()
    }
  }, [autoLoad, sessionId, loadVideoMeeting])

  return {
    videoMeeting,
    isLoading,
    error,
    loadVideoMeeting,
    updateVideoMeeting,
    clearError
  }
}