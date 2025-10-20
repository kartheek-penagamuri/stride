import { randomBytes } from 'crypto'

export type VideoProvider = 'jitsi' | 'zoom' | 'meet' | 'external'

export interface VideoConfig {
  provider: VideoProvider
  url?: string
  roomName?: string
  options?: Record<string, unknown>
}

export interface JitsiConfig {
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

export interface VideoMeetingDetails {
  provider: VideoProvider
  url: string
  roomName?: string
  embedUrl?: string
  joinInstructions?: string
  moderatorUrl?: string
  participantUrl?: string
  config?: Record<string, unknown>
}

export class VideoService {
  private readonly jitsiDomain: string
  private readonly jitsiConfig: Partial<JitsiConfig>

  constructor() {
    this.jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si'
    this.jitsiConfig = {
      enableWelcomePage: false,
      enableClosePage: false,
      prejoinPageEnabled: true,
      requireDisplayName: true,
      startWithAudioMuted: false,
      startWithVideoMuted: false
    }
  }

  /**
   * Create a video meeting for a session
   */
  async createVideoMeeting(
    sessionId: string,
    podId: string,
    config: VideoConfig
  ): Promise<VideoMeetingDetails> {
    switch (config.provider) {
      case 'jitsi':
        return this.createJitsiMeeting(sessionId, podId, config.options as Partial<JitsiConfig>)
      
      case 'zoom':
      case 'meet':
      case 'external':
        return this.createExternalMeeting(config.provider, config.url!)
      
      default:
        throw new Error(`Unsupported video provider: ${config.provider}`)
    }
  }

  /**
   * Create Jitsi Meet room
   */
  private createJitsiMeeting(
    sessionId: string,
    podId: string,
    customConfig?: Partial<JitsiConfig>
  ): VideoMeetingDetails {
    // Generate secure room name
    const roomName = this.generateJitsiRoomName(sessionId, podId)
    
    // Merge configuration
    const config: JitsiConfig = {
      ...this.jitsiConfig,
      ...customConfig,
      roomName,
      domain: this.jitsiDomain
    }

    // Generate URLs
    const baseUrl = `https://${this.jitsiDomain}/${roomName}`
    const embedUrl = this.buildJitsiEmbedUrl(config)

    return {
      provider: 'jitsi',
      url: baseUrl,
      roomName,
      embedUrl,
      joinInstructions: this.getJitsiJoinInstructions(baseUrl),
      config: config as unknown as Record<string, unknown>
    }
  }

  /**
   * Create external video meeting details
   */
  private createExternalMeeting(provider: VideoProvider, url: string): VideoMeetingDetails {
    if (!url) {
      throw new Error(`URL is required for ${provider} meetings`)
    }

    // Validate URL format
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid video meeting URL')
    }

    return {
      provider,
      url,
      joinInstructions: this.getExternalJoinInstructions(provider, url)
    }
  }

  /**
   * Generate secure Jitsi room name
   */
  private generateJitsiRoomName(sessionId: string, podId: string): string {
    const timestamp = Date.now()
    const randomSuffix = randomBytes(4).toString('hex')
    return `pactly-${podId}-${sessionId.slice(-8)}-${timestamp}-${randomSuffix}`
  }

  /**
   * Build Jitsi embed URL with configuration
   */
  private buildJitsiEmbedUrl(config: JitsiConfig): string {
    const params = new URLSearchParams()
    
    // Add configuration parameters
    if (config.displayName) params.set('userInfo.displayName', config.displayName)
    if (config.email) params.set('userInfo.email', config.email)
    if (config.avatarUrl) params.set('userInfo.avatarUrl', config.avatarUrl)
    if (config.subject) params.set('subject', config.subject)
    
    // Audio/video settings
    if (config.startWithAudioMuted !== undefined) {
      params.set('config.startWithAudioMuted', config.startWithAudioMuted.toString())
    }
    if (config.startWithVideoMuted !== undefined) {
      params.set('config.startWithVideoMuted', config.startWithVideoMuted.toString())
    }
    
    // Interface settings
    if (config.prejoinPageEnabled !== undefined) {
      params.set('config.prejoinPageEnabled', config.prejoinPageEnabled.toString())
    }
    if (config.requireDisplayName !== undefined) {
      params.set('config.requireDisplayName', config.requireDisplayName.toString())
    }

    const queryString = params.toString()
    return `https://${config.domain}/${config.roomName}${queryString ? `?${queryString}` : ''}`
  }

  /**
   * Get Jitsi Meet configuration for embedding
   */
  getJitsiEmbedConfig(
    roomName: string,
    customConfig?: Partial<JitsiConfig>
  ): Record<string, unknown> {
    const config = {
      ...this.jitsiConfig,
      ...customConfig,
      roomName
    }

    return {
      domain: this.jitsiDomain,
      options: {
        roomName: config.roomName,
        width: '100%',
        height: '100%',
        parentNode: undefined, // Will be set by the component
        configOverwrite: {
          startWithAudioMuted: config.startWithAudioMuted,
          startWithVideoMuted: config.startWithVideoMuted,
          prejoinPageEnabled: config.prejoinPageEnabled,
          requireDisplayName: config.requireDisplayName,
          enableWelcomePage: config.enableWelcomePage,
          enableClosePage: config.enableClosePage,
          subject: config.subject,
          // Disable some features for better UX
          disableDeepLinking: true,
          disableInviteFunctions: true,
          enableEmailInStats: false,
          enableUserRolesBasedOnToken: false,
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
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone'
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
          displayName: config.displayName,
          email: config.email
        }
      }
    }
  }

  /**
   * Validate video meeting URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }

  /**
   * Get join instructions for Jitsi meetings
   */
  private getJitsiJoinInstructions(url: string): string {
    return `Click the link to join the video session: ${url}\n\nNo account required - just enter your name and join the meeting.`
  }

  /**
   * Get join instructions for external meetings
   */
  private getExternalJoinInstructions(provider: VideoProvider, url: string): string {
    const providerName = this.getProviderDisplayName(provider)
    return `Join the ${providerName} meeting: ${url}\n\nYou may need the ${providerName} app or browser extension.`
  }

  /**
   * Get display name for video provider
   */
  private getProviderDisplayName(provider: VideoProvider): string {
    switch (provider) {
      case 'jitsi':
        return 'Jitsi Meet'
      case 'zoom':
        return 'Zoom'
      case 'meet':
        return 'Google Meet'
      case 'external':
        return 'External Video'
      default:
        return 'Video Meeting'
    }
  }

  /**
   * Extract meeting ID from various video URLs
   */
  extractMeetingId(url: string): string | null {
    try {
      const parsedUrl = new URL(url)
      
      // Zoom meeting ID extraction
      if (parsedUrl.hostname.includes('zoom.us')) {
        const pathMatch = parsedUrl.pathname.match(/\/j\/(\d+)/)
        if (pathMatch) return pathMatch[1]
        
        const searchParams = new URLSearchParams(parsedUrl.search)
        return searchParams.get('confno') || null
      }
      
      // Google Meet extraction
      if (parsedUrl.hostname.includes('meet.google.com')) {
        const pathMatch = parsedUrl.pathname.match(/\/([a-z-]+)$/)
        return pathMatch ? pathMatch[1] : null
      }
      
      // Jitsi Meet extraction
      if (parsedUrl.hostname.includes('jit.si') || parsedUrl.hostname.includes('meet.jit.si')) {
        const pathMatch = parsedUrl.pathname.match(/\/(.+)$/)
        return pathMatch ? pathMatch[1] : null
      }
      
      return null
    } catch {
      return null
    }
  }

  /**
   * Generate calendar event details for video meetings
   */
  generateCalendarEventDetails(
    meeting: VideoMeetingDetails,
    sessionTitle: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startTime: Date,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _duration: number
  ): {
    title: string
    description: string
    location: string
  } {
    const providerName = this.getProviderDisplayName(meeting.provider)
    
    return {
      title: `${sessionTitle} - ${providerName}`,
      description: `Join your Pactly learning session.\n\n${meeting.joinInstructions}`,
      location: meeting.url
    }
  }
}

export const videoService = new VideoService()