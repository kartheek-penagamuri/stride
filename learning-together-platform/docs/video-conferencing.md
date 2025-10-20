# Video Conferencing Integration

The video conferencing system provides seamless integration with multiple video providers, with primary support for Jitsi Meet and external meeting links.

## Features

- **Jitsi Meet Integration**: Embedded video conferencing with no account required
- **External Provider Support**: Zoom, Google Meet, and custom video links
- **Flexible Configuration**: Switch between providers per session
- **Responsive UI**: Works on desktop and mobile devices
- **Real-time Status**: Connection status and participant tracking
- **Fallback Options**: Multiple ways to join if embedding fails

## Supported Providers

### Jitsi Meet (Primary)
- **Embedded**: Full integration with customizable interface
- **No Account Required**: Users can join with just a display name
- **Customizable**: Branded interface with custom toolbar
- **Free**: No cost for unlimited usage

### External Providers
- **Zoom**: Support for Zoom meeting links
- **Google Meet**: Support for Google Meet links
- **Custom**: Any video conferencing URL

## Architecture

### Core Components

1. **VideoService**: Core service for managing video meetings
2. **VideoMeetingComponent**: Main UI component for video meetings
3. **JitsiMeetComponent**: Specialized component for Jitsi Meet embedding
4. **useVideoMeeting**: React hook for video meeting state management
5. **SessionVideoInterface**: Complete session video interface

### Data Flow

```
Session → VideoService → VideoMeetingDetails → UI Components
```

## Usage

### Basic Video Meeting Setup

```typescript
import { VideoService } from '@/lib/services/video-service'

const videoService = new VideoService()

// Create Jitsi meeting
const meeting = await videoService.createVideoMeeting(
  'session-123',
  'pod-456',
  { provider: 'jitsi' }
)

// Create external meeting
const externalMeeting = await videoService.createVideoMeeting(
  'session-123',
  'pod-456',
  { 
    provider: 'zoom',
    url: 'https://zoom.us/j/123456789'
  }
)
```

### React Component Usage

```tsx
import VideoMeetingComponent from '@/components/video/VideoMeetingComponent'

function SessionPage({ meeting }) {
  return (
    <VideoMeetingComponent
      meeting={meeting}
      displayName="John Doe"
      email="john@example.com"
      onJoin={() => console.log('Joined')}
      onLeave={() => console.log('Left')}
      onError={(error) => console.error(error)}
    />
  )
}
```

### Using the Video Hook

```tsx
import { useVideoMeeting } from '@/hooks/useVideoMeeting'

function SessionVideo({ sessionId }) {
  const {
    videoMeeting,
    isLoading,
    error,
    updateVideoMeeting
  } = useVideoMeeting({ sessionId })

  const switchToZoom = async () => {
    await updateVideoMeeting({
      provider: 'zoom',
      url: 'https://zoom.us/j/123456789'
    })
  }

  // ... render UI
}
```

## API Endpoints

### GET /api/sessions/[sessionId]/video
Get video meeting details for a session.

**Response:**
```json
{
  "videoMeeting": {
    "provider": "jitsi",
    "url": "https://meet.jit.si/room-name",
    "roomName": "room-name",
    "embedUrl": "https://meet.jit.si/room-name?config...",
    "joinInstructions": "Click the link to join...",
    "config": { ... }
  }
}
```

### PUT /api/sessions/[sessionId]/video
Update video meeting configuration.

**Request Body:**
```json
{
  "provider": "jitsi|zoom|meet|external",
  "url": "https://meeting-url.com", // Required for external providers
  "options": { ... } // Provider-specific options
}
```

## Configuration

### Environment Variables

```env
# Optional: Custom Jitsi domain (defaults to meet.jit.si)
JITSI_DOMAIN=your-jitsi-instance.com
```

### Jitsi Configuration

The Jitsi integration supports extensive customization:

```typescript
interface JitsiConfig {
  domain?: string
  roomName: string
  displayName?: string
  email?: string
  avatarUrl?: string
  startWithAudioMuted?: boolean
  startWithVideoMuted?: boolean
  enableWelcomePage?: boolean
  enableClosePage?: boolean
  prejoinPageEnabled?: boolean
  requireDisplayName?: boolean
  subject?: string
  moderatorPassword?: string
  participantPassword?: string
}
```

### Default Jitsi Settings

- **Prejoin Page**: Enabled (users can test audio/video before joining)
- **Display Name**: Required
- **Audio/Video**: Unmuted by default
- **Branding**: Custom Pactly branding
- **Toolbar**: Curated set of tools for learning sessions

## Security Considerations

### Room Name Generation
Jitsi room names are generated with:
- Pod ID for grouping
- Session ID for uniqueness
- Timestamp for temporal uniqueness
- Random suffix for security

Format: `pactly-{podId}-{sessionId}-{timestamp}-{random}`

### External URLs
- All external URLs are validated before use
- Only HTTPS URLs are accepted
- URL parsing prevents malicious redirects

## Troubleshooting

### Common Issues

1. **Jitsi Not Loading**
   - Check browser console for script loading errors
   - Verify network connectivity
   - Try the fallback "Open in new window" option

2. **Audio/Video Not Working**
   - Check browser permissions for camera/microphone
   - Ensure HTTPS connection (required for media access)
   - Try refreshing the page

3. **External Links Not Working**
   - Verify the meeting URL is correct and active
   - Check if the external service requires authentication
   - Ensure the meeting hasn't expired

### Browser Compatibility

- **Chrome/Edge**: Full support including embedded Jitsi
- **Firefox**: Full support including embedded Jitsi
- **Safari**: Full support including embedded Jitsi
- **Mobile Browsers**: Supported with responsive design

### Network Requirements

- **Bandwidth**: Minimum 1 Mbps for video calls
- **Ports**: Standard HTTPS (443) and WebRTC ports
- **Firewall**: May need WebRTC traffic allowlisted in corporate environments

## Testing

### Manual Testing
Visit `/test-video` to test the video integration:
1. Test Jitsi Meet embedding
2. Test external link handling
3. Test error scenarios
4. Test responsive design

### Automated Testing
```bash
# Run video component tests
npm test -- --testPathPattern=video

# Run integration tests
npm run test:integration -- video
```

## Future Enhancements

### Planned Features
- **Recording**: Session recording capabilities
- **Screen Sharing**: Enhanced screen sharing controls
- **Breakout Rooms**: Support for small group discussions
- **Chat Integration**: Persistent chat across sessions
- **Calendar Integration**: Automatic meeting creation in calendars

### Provider Expansion
- **Microsoft Teams**: Direct integration support
- **WebEx**: Enterprise video conferencing
- **Custom WebRTC**: Direct peer-to-peer connections

## Performance Optimization

### Lazy Loading
- Jitsi SDK is loaded only when needed
- Components are code-split for better performance
- Video streams are optimized based on participant count

### Caching
- Meeting configurations are cached
- Room names are generated once per session
- Provider scripts are cached by the browser

## Monitoring

### Metrics to Track
- Video meeting creation success rate
- Join success rate by provider
- Average session duration
- Error rates by browser/device
- User preference distribution (Jitsi vs external)

### Logging
- All video meeting operations are logged
- Error details are captured for debugging
- User actions (join/leave) are tracked for analytics