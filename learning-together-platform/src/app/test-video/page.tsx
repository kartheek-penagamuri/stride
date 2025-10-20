'use client'

import { useState } from 'react'
import VideoMeetingComponent from '@/components/video/VideoMeetingComponent'
import { VideoMeetingDetails } from '@/lib/services/video-service'

export default function TestVideoPage() {
  const [testMeeting] = useState<VideoMeetingDetails>({
    provider: 'jitsi',
    url: 'https://meet.jit.si/test-pactly-room-123',
    roomName: 'test-pactly-room-123',
    embedUrl: 'https://meet.jit.si/test-pactly-room-123',
    joinInstructions: 'Click the link to join the test video session',
    config: {
      domain: 'meet.jit.si',
      roomName: 'test-pactly-room-123',
      displayName: 'Test User',
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: true,
      requireDisplayName: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Meeting Test</h1>
          <p className="text-gray-600">
            Test the video conferencing integration with Jitsi Meet
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <VideoMeetingComponent
            meeting={testMeeting}
            displayName="Test User"
            email="test@example.com"
            onJoin={() => console.log('Joined video meeting')}
            onLeave={() => console.log('Left video meeting')}
            onError={(error) => console.error('Video meeting error:', error)}
          />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Testing Instructions</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Click &quot;Join Jitsi Meet Session&quot; to test embedded video</li>
            <li>• Try &quot;Open in new window&quot; for external link testing</li>
            <li>• Test with multiple browser tabs to simulate multiple participants</li>
            <li>• Check console for any JavaScript errors</li>
          </ul>
        </div>
      </div>
    </div>
  )
}