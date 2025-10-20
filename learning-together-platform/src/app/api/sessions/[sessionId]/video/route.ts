import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '@/lib/services/session-service'
import { VideoConfig } from '@/lib/services/video-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // Get video meeting details
    const videoMeeting = await sessionService.getVideoMeetingDetails(sessionId)
    
    if (!videoMeeting) {
      return NextResponse.json(
        { error: 'Video meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ videoMeeting })
  } catch (error) {
    console.error('Error getting video meeting:', error)
    return NextResponse.json(
      { error: 'Failed to get video meeting details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    
    // Validate video configuration
    const videoConfig: VideoConfig = {
      provider: body.provider,
      url: body.url,
      options: body.options
    }

    if (!videoConfig.provider) {
      return NextResponse.json(
        { error: 'Video provider is required' },
        { status: 400 }
      )
    }

    if (videoConfig.provider !== 'jitsi' && !videoConfig.url) {
      return NextResponse.json(
        { error: 'Video URL is required for external providers' },
        { status: 400 }
      )
    }

    // Update video meeting
    const videoMeeting = await sessionService.updateVideoMeeting(sessionId, videoConfig)

    return NextResponse.json({ videoMeeting })
  } catch (error) {
    console.error('Error updating video meeting:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Cannot update')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update video meeting' },
      { status: 500 }
    )
  }
}