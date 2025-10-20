import { PrismaClient } from '@prisma/client'
import { SessionStatus } from '@/types'
import { videoService, VideoProvider, VideoConfig, VideoMeetingDetails } from './video-service'

const prisma = new PrismaClient()

export interface CreateSessionData {
  podId: string
  scheduledAt: Date
  videoConfig?: VideoConfig
  attendanceRequired?: boolean
  sessionNumber?: number
}

export interface SessionDetails {
  id: string
  podId: string
  scheduledAt: Date
  startedAt?: Date
  endedAt?: Date
  videoMeeting?: VideoMeetingDetails
  status: SessionStatus
  attendanceRequired: boolean
  sessionNumber: number
  remindersSent?: Record<string, boolean>
  pod: {
    id: string
    sprintType: string
    memberships: Array<{
      userId: string
      user: {
        id: string
        name?: string
        email: string
        timezone: string
      }
    }>
  }
  attendance: Array<{
    userId: string
    attended: boolean
    joinedAt?: Date
    leftAt?: Date
  }>
}

export interface SessionTransition {
  sessionId: string
  fromStatus: SessionStatus
  toStatus: SessionStatus
  userId?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export class SessionService {
  /**
   * Create a new learning session
   */
  async createSession(data: CreateSessionData): Promise<SessionDetails> {
    try {
      // Validate pod exists and is active
      const pod = await prisma.pod.findUnique({
        where: { id: data.podId },
        include: {
          memberships: {
            where: { status: 'active' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  timezone: true
                }
              }
            }
          }
        }
      })

      if (!pod) {
        throw new Error('Pod not found')
      }

      if (pod.status !== 'active') {
        throw new Error('Cannot create session for inactive pod')
      }

      // Create video meeting
      const videoConfig = data.videoConfig || { provider: 'jitsi' as VideoProvider }
      const videoMeeting = await videoService.createVideoMeeting(
        `temp-${Date.now()}`, // Temporary ID, will be updated after session creation
        data.podId,
        videoConfig
      )

      // Create session
      const session = await prisma.learningSession.create({
        data: {
          podId: data.podId,
          scheduledAt: data.scheduledAt,
          videoUrl: videoMeeting.url,
          attendanceRequired: data.attendanceRequired ?? true,
          sessionNumber: data.sessionNumber || 1,
          status: SessionStatus.SCHEDULED
        },
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        }
      })

      // Update video meeting with actual session ID
      const updatedVideoMeeting = await videoService.createVideoMeeting(
        session.id,
        data.podId,
        videoConfig
      )

      // Update session with proper video URL
      await prisma.learningSession.update({
        where: { id: session.id },
        data: { videoUrl: updatedVideoMeeting.url }
      })

      // Create attendance records for all active pod members
      await Promise.all(
        pod.memberships.map((membership) =>
          prisma.sessionAttendance.create({
            data: {
              sessionId: session.id,
              userId: membership.userId,
              attended: false
            }
          })
        )
      )

      // Log session creation
      await this.logStateTransition({
        sessionId: session.id,
        fromStatus: SessionStatus.SCHEDULED,
        toStatus: SessionStatus.SCHEDULED,
        timestamp: new Date(),
        metadata: { 
          action: 'created', 
          podId: data.podId,
          videoProvider: updatedVideoMeeting.provider,
          videoUrl: updatedVideoMeeting.url
        }
      })

      // Refresh session data with updated video URL
      const updatedSession = await prisma.learningSession.findUnique({
        where: { id: session.id },
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        }
      })

      return this.formatSessionDetails(updatedSession!, updatedVideoMeeting)
    } catch (error) {
      console.error('Error creating session:', error)
      throw new Error('Failed to create session')
    }
  }

  /**
   * Start a session (transition from SCHEDULED to ACTIVE)
   */
  async startSession(sessionId: string, userId?: string): Promise<SessionDetails> {
    return this.transitionSession(
      sessionId,
      SessionStatus.SCHEDULED,
      SessionStatus.ACTIVE,
      userId,
      { startedAt: new Date() }
    )
  }

  /**
   * Complete a session (transition from ACTIVE to COMPLETED)
   */
  async completeSession(sessionId: string, userId?: string): Promise<SessionDetails> {
    return this.transitionSession(
      sessionId,
      SessionStatus.ACTIVE,
      SessionStatus.COMPLETED,
      userId,
      { endedAt: new Date() }
    )
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, userId?: string, reason?: string): Promise<SessionDetails> {
    return this.transitionSession(
      sessionId,
      [SessionStatus.SCHEDULED, SessionStatus.ACTIVE],
      SessionStatus.CANCELLED,
      userId,
      { 
        endedAt: new Date(),
        metadata: { reason }
      }
    )
  }

  /**
   * Generic session state transition with idempotency
   */
  private async transitionSession(
    sessionId: string,
    fromStatus: SessionStatus | SessionStatus[],
    toStatus: SessionStatus,
    userId?: string,
    updateData: Record<string, unknown> = {}
  ): Promise<SessionDetails> {
    try {
      // Get current session state
      const currentSession = await prisma.learningSession.findUnique({
        where: { id: sessionId },
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        }
      })

      if (!currentSession) {
        throw new Error('Session not found')
      }

      const currentStatus = currentSession.status as SessionStatus
      const validFromStatuses = Array.isArray(fromStatus) ? fromStatus : [fromStatus]

      // Check if transition is valid (idempotent if already in target state)
      if (currentStatus === toStatus) {
        console.log(`Session ${sessionId} already in ${toStatus} state`)
        return this.formatSessionDetails(currentSession)
      }

      if (!validFromStatuses.includes(currentStatus)) {
        throw new Error(
          `Invalid state transition: cannot go from ${currentStatus} to ${toStatus}`
        )
      }

      // Perform the transition
      const updatedSession = await prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          status: toStatus,
          ...updateData
        },
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        }
      })

      // Log the transition
      await this.logStateTransition({
        sessionId,
        fromStatus: currentStatus,
        toStatus,
        userId,
        timestamp: new Date(),
        metadata: updateData.metadata as Record<string, unknown>
      })

      return await this.formatSessionDetails(updatedSession)
    } catch (error) {
      console.error(`Error transitioning session ${sessionId}:`, error)
      throw error
    }
  }

  /**
   * Get session details by ID
   */
  async getSession(sessionId: string): Promise<SessionDetails | null> {
    try {
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId },
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        }
      })

      return session ? await this.formatSessionDetails(session) : null
    } catch (error) {
      console.error('Error getting session:', error)
      throw new Error('Failed to get session')
    }
  }

  /**
   * Get sessions for a pod
   */
  async getPodSessions(
    podId: string,
    options: {
      status?: SessionStatus
      limit?: number
      offset?: number
      includeCompleted?: boolean
    } = {}
  ): Promise<SessionDetails[]> {
    try {
      const where: { podId: string; status?: string | { not: string } } = { podId }
      
      if (options.status) {
        where.status = options.status
      } else if (!options.includeCompleted) {
        where.status = {
          not: SessionStatus.COMPLETED
        }
      }

      const sessions = await prisma.learningSession.findMany({
        where,
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        },
        orderBy: { scheduledAt: 'asc' },
        take: options.limit,
        skip: options.offset
      })

      return await Promise.all(sessions.map(session => this.formatSessionDetails(session)))
    } catch (error) {
      console.error('Error getting pod sessions:', error)
      throw new Error('Failed to get pod sessions')
    }
  }

  /**
   * Mark user attendance for a session
   */
  async markAttendance(
    sessionId: string,
    userId: string,
    attended: boolean,
    joinedAt?: Date,
    leftAt?: Date
  ): Promise<void> {
    try {
      await prisma.sessionAttendance.upsert({
        where: {
          sessionId_userId: {
            sessionId,
            userId
          }
        },
        update: {
          attended,
          joinedAt,
          leftAt
        },
        create: {
          sessionId,
          userId,
          attended,
          joinedAt,
          leftAt
        }
      })

      // Log attendance change
      await this.logStateTransition({
        sessionId,
        fromStatus: SessionStatus.ACTIVE,
        toStatus: SessionStatus.ACTIVE,
        userId,
        timestamp: new Date(),
        metadata: { 
          action: 'attendance_marked',
          attended,
          joinedAt,
          leftAt
        }
      })
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw new Error('Failed to mark attendance')
    }
  }

  /**
   * Get upcoming sessions that need reminders
   */
  async getSessionsNeedingReminders(
    reminderType: 'T-60' | 'T-10',
    currentTime: Date = new Date()
  ): Promise<SessionDetails[]> {
    try {
      const minutesBefore = reminderType === 'T-60' ? 60 : 10
      const reminderTime = new Date(currentTime.getTime() + minutesBefore * 60 * 1000)
      
      // Find sessions scheduled within the reminder window that haven't had this reminder sent
      const sessions = await prisma.learningSession.findMany({
        where: {
          status: SessionStatus.SCHEDULED,
          scheduledAt: {
            gte: currentTime,
            lte: reminderTime
          }
        },
        include: {
          pod: {
            include: {
              memberships: {
                where: { status: 'active' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          },
          attendance: true
        }
      })

      return await Promise.all(sessions.map(session => this.formatSessionDetails(session)))
    } catch (error) {
      console.error('Error getting sessions needing reminders:', error)
      throw new Error('Failed to get sessions needing reminders')
    }
  }

  /**
   * Mark reminder as sent for a session
   */
  async markReminderSent(sessionId: string, reminderType: 'T-60' | 'T-10'): Promise<void> {
    try {
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      const remindersSent = (session.remindersSent as Record<string, boolean>) || {}
      remindersSent[reminderType] = true

      await prisma.learningSession.update({
        where: { id: sessionId },
        data: { remindersSent }
      })
    } catch (error) {
      console.error('Error marking reminder sent:', error)
      throw new Error('Failed to mark reminder sent')
    }
  }

  /**
   * Get video meeting details for a session
   */
  async getVideoMeetingDetails(sessionId: string): Promise<VideoMeetingDetails | null> {
    try {
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId }
      })

      if (!session || !session.videoUrl) {
        return null
      }

      // For existing sessions, reconstruct video meeting details
      const sessionData = session as { videoType: string; videoUrl: string }
      if (sessionData.videoType === 'jitsi') {
        return await videoService.createVideoMeeting(
          session.id,
          session.podId,
          { provider: 'jitsi' as VideoProvider }
        )
      } else {
        return await videoService.createVideoMeeting(
          session.id,
          session.podId,
          { 
            provider: sessionData.videoType as VideoProvider,
            url: session.videoUrl || undefined
          }
        )
      }
    } catch (error) {
      console.error('Error getting video meeting details:', error)
      return null
    }
  }

  /**
   * Update video meeting for a session
   */
  async updateVideoMeeting(
    sessionId: string,
    videoConfig: VideoConfig
  ): Promise<VideoMeetingDetails> {
    try {
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId },
        select: { podId: true, status: true }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      if (session.status !== SessionStatus.SCHEDULED) {
        throw new Error('Cannot update video meeting for non-scheduled session')
      }

      // Create new video meeting
      const videoMeeting = await videoService.createVideoMeeting(
        sessionId,
        session.podId,
        videoConfig
      )

      // Update session
      await prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          videoUrl: videoMeeting.url
        }
      })

      // Log the update
      await this.logStateTransition({
        sessionId,
        fromStatus: SessionStatus.SCHEDULED,
        toStatus: SessionStatus.SCHEDULED,
        timestamp: new Date(),
        metadata: { 
          action: 'video_updated',
          videoProvider: videoMeeting.provider,
          videoUrl: videoMeeting.url
        }
      })

      return videoMeeting
    } catch (error) {
      console.error('Error updating video meeting:', error)
      throw error
    }
  }

  /**
   * Log state transitions for audit trail
   */
  private async logStateTransition(transition: SessionTransition): Promise<void> {
    try {
      // For now, we'll log to console. In production, this could go to a dedicated audit table
      console.log('Session state transition:', {
        sessionId: transition.sessionId,
        transition: `${transition.fromStatus} -> ${transition.toStatus}`,
        userId: transition.userId,
        timestamp: transition.timestamp,
        metadata: transition.metadata
      })

      // TODO: Implement proper audit logging to database
      // This could be a separate AuditLog table or external logging service
    } catch (error) {
      console.error('Error logging state transition:', error)
      // Don't throw here - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Format session data for API responses
   */
  private async formatSessionDetails(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any, // TODO: Type this properly with Prisma generated types
    videoMeeting?: VideoMeetingDetails
  ): Promise<SessionDetails> {
    // Get video meeting details if not provided
    if (!videoMeeting && session.videoUrl) {
      videoMeeting = await this.getVideoMeetingDetails(session.id) || undefined
    }

    return {
      id: session.id,
      podId: session.podId,
      scheduledAt: session.scheduledAt,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      videoMeeting,
      status: session.status as SessionStatus,
      attendanceRequired: session.attendanceRequired,
      sessionNumber: session.sessionNumber,
      remindersSent: session.remindersSent as Record<string, boolean>,
      pod: {
        id: session.pod.id,
        sprintType: session.pod.sprintType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memberships: session.pod.memberships.map((membership: any) => ({
          userId: membership.userId,
          user: {
            id: membership.user.id,
            name: membership.user.name,
            email: membership.user.email,
            timezone: membership.user.timezone
          }
        }))
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attendance: session.attendance.map((att: any) => ({
        userId: att.userId,
        attended: att.attended,
        joinedAt: att.joinedAt,
        leftAt: att.leftAt
      }))
    }
  }
}

export const sessionService = new SessionService()