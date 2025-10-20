import { PrismaClient } from '@prisma/client'
import { CheckInStatus, ProofSubmission } from '@/types'
import { 
  validateCheckInCreation, 
  validateCheckInUpdate,
  validateCheckInTiming,
  validateProofOfEffort
} from '@/lib/validations/checkin-validation'

const prisma = new PrismaClient()

export interface CreateCheckInData {
  userId: string
  sessionId?: string
  attended: boolean
  rpe?: number
  win: string
  tweak: string
  proofOfEffort?: ProofSubmission[]
}

export interface UpdateCheckInData {
  attended?: boolean
  rpe?: number
  win?: string
  tweak?: string
  proofOfEffort?: ProofSubmission[]
  status?: CheckInStatus
}

export interface CheckInWithDetails {
  id: string
  userId: string
  sessionId?: string
  submittedAt: Date
  attended: boolean
  rpe?: number
  win: string
  tweak: string
  proofOfEffort?: ProofSubmission[]
  status: CheckInStatus
  createdAt: Date
  user?: {
    id: string
    name?: string
    email: string
  }
  session?: {
    id: string
    scheduledAt: Date
    pod: {
      id: string
      sprintType: string
    }
  }
}

export class CheckInService {
  /**
   * Create a new check-in
   */
  static async createCheckIn(data: CreateCheckInData): Promise<CheckInWithDetails> {
    // Validate input data
    const validation = validateCheckInCreation(data)
    if (!validation.success) {
      throw new Error(`Invalid check-in data: ${validation.error.message}`)
    }

    let status = CheckInStatus.SUBMITTED
    let sessionDate = new Date()

    // If associated with a session, validate timing
    if (data.sessionId) {
      const session = await prisma.learningSession.findUnique({
        where: { id: data.sessionId },
        select: { scheduledAt: true, pod: { select: { sprintType: true } } }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      sessionDate = session.scheduledAt
      const timingValidation = validateCheckInTiming(new Date(), sessionDate)
      status = timingValidation.status

      if (!timingValidation.isValid) {
        throw new Error(timingValidation.message)
      }

      // Validate proof of effort if provided
      if (data.proofOfEffort && data.proofOfEffort.length > 0) {
        // Get the goal to determine proof method
        const goal = await prisma.goal.findFirst({
          where: {
            userId: data.userId,
            sprintType: session.pod.sprintType,
            status: 'active'
          },
          select: { proofMethod: true }
        })

        if (goal) {
          const proofValidation = validateProofOfEffort(goal.proofMethod, data.proofOfEffort)
          if (!proofValidation.isValid) {
            throw new Error(`Invalid proof of effort: ${proofValidation.errors.join(', ')}`)
          }
        }
      }
    }

    // Create the check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        submittedAt: new Date(),
        attended: data.attended,
        rpe: data.rpe,
        win: data.win,
        tweak: data.tweak,
        proofOfEffort: JSON.parse(JSON.stringify(data.proofOfEffort || [])),
        status
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        session: {
          select: {
            id: true,
            scheduledAt: true,
            pod: {
              select: { id: true, sprintType: true }
            }
          }
        }
      }
    })

    // Update goal streak if check-in is on time and user attended
    if (data.attended && status === CheckInStatus.SUBMITTED && data.sessionId) {
      await this.updateGoalStreak(data.userId, checkIn.session!.pod.sprintType, true)
    }

    return this.mapToCheckInWithDetails(checkIn)
  }

  /**
   * Get check-ins for a user
   */
  static async getUserCheckIns(
    userId: string,
    filters?: { sessionId?: string; status?: CheckInStatus; limit?: number }
  ): Promise<CheckInWithDetails[]> {
    const where: Record<string, unknown> = { userId }
    
    if (filters?.sessionId) {
      where.sessionId = filters.sessionId
    }
    
    if (filters?.status) {
      where.status = filters.status
    }

    const checkIns = await prisma.checkIn.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        session: {
          select: {
            id: true,
            scheduledAt: true,
            pod: {
              select: { id: true, sprintType: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: filters?.limit
    })

    return checkIns.map(this.mapToCheckInWithDetails)
  }

  /**
   * Get check-ins for a session
   */
  static async getSessionCheckIns(sessionId: string): Promise<CheckInWithDetails[]> {
    const checkIns = await prisma.checkIn.findMany({
      where: { sessionId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        session: {
          select: {
            id: true,
            scheduledAt: true,
            pod: {
              select: { id: true, sprintType: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    })

    return checkIns.map(this.mapToCheckInWithDetails)
  }

  /**
   * Update check-in
   */
  static async updateCheckIn(
    checkInId: string, 
    userId: string, 
    updates: UpdateCheckInData
  ): Promise<CheckInWithDetails> {
    // Validate updates
    const validation = validateCheckInUpdate(updates)
    if (!validation.success) {
      throw new Error(`Invalid update data: ${validation.error.message}`)
    }

    // Check if check-in exists and belongs to user
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { id: checkInId, userId },
      include: { session: { select: { scheduledAt: true, pod: { select: { sprintType: true } } } } }
    })
    
    if (!existingCheckIn) {
      throw new Error('Check-in not found or access denied')
    }

    // Validate proof of effort if being updated
    if (updates.proofOfEffort && existingCheckIn.sessionId) {
      const goal = await prisma.goal.findFirst({
        where: {
          userId,
          sprintType: existingCheckIn.session!.pod.sprintType,
          status: 'active'
        },
        select: { proofMethod: true }
      })

      if (goal) {
        const proofValidation = validateProofOfEffort(goal.proofMethod, updates.proofOfEffort)
        if (!proofValidation.isValid) {
          throw new Error(`Invalid proof of effort: ${proofValidation.errors.join(', ')}`)
        }
      }
    }

    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        ...updates,
        proofOfEffort: updates.proofOfEffort ? JSON.parse(JSON.stringify(updates.proofOfEffort)) : undefined
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        session: {
          select: {
            id: true,
            scheduledAt: true,
            pod: {
              select: { id: true, sprintType: true }
            }
          }
        }
      }
    })

    return this.mapToCheckInWithDetails(updatedCheckIn)
  }

  /**
   * Get check-in statistics for a user
   */
  static async getUserCheckInStats(userId: string, sprintType?: string) {
    const where: Record<string, unknown> = { userId }
    if (sprintType) {
      where.session = {
        pod: { sprintType }
      }
    }

    const totalCheckIns = await prisma.checkIn.count({ where })
    const onTimeCheckIns = await prisma.checkIn.count({ 
      where: { ...where, status: CheckInStatus.SUBMITTED } 
    })
    const lateCheckIns = await prisma.checkIn.count({ 
      where: { ...where, status: CheckInStatus.LATE } 
    })
    const attendedSessions = await prisma.checkIn.count({ 
      where: { ...where, attended: true } 
    })

    const avgRpe = await prisma.checkIn.aggregate({
      where: { ...where, rpe: { not: null } },
      _avg: { rpe: true }
    })

    return {
      totalCheckIns,
      onTimeCheckIns,
      lateCheckIns,
      attendedSessions,
      onTimeRate: totalCheckIns > 0 ? (onTimeCheckIns / totalCheckIns) * 100 : 0,
      attendanceRate: totalCheckIns > 0 ? (attendedSessions / totalCheckIns) * 100 : 0,
      averageRpe: avgRpe._avg.rpe || 0
    }
  }

  /**
   * Mark missed check-ins for overdue sessions
   */
  static async markMissedCheckIns(): Promise<number> {
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago

    // Find sessions that should have check-ins but don't
    const overdueSessions = await prisma.learningSession.findMany({
      where: {
        scheduledAt: { lt: cutoffDate },
        status: 'completed',
        checkIns: { none: {} }
      },
      include: {
        attendance: {
          select: { userId: true }
        }
      }
    })

    let missedCount = 0
    for (const session of overdueSessions) {
      for (const attendance of session.attendance) {
        await prisma.checkIn.create({
          data: {
            userId: attendance.userId,
            sessionId: session.id,
            submittedAt: new Date(),
            attended: false,
            win: 'No check-in submitted',
            tweak: 'Need to submit check-ins on time',
            status: CheckInStatus.MISSED
          }
        })
        missedCount++
      }
    }

    return missedCount
  }

  private static async updateGoalStreak(userId: string, sprintType: string, increment: boolean) {
    // TODO: Implement streak tracking when streakCount field is added to Goal model
    // For now, this is a placeholder
    console.log(`Streak update for user ${userId}, sprint ${sprintType}, increment: ${increment}`)
  }

  private static mapToCheckInWithDetails(checkIn: Record<string, unknown>): CheckInWithDetails {
    return {
      id: checkIn.id as string,
      userId: checkIn.userId as string,
      sessionId: checkIn.sessionId as string | undefined,
      submittedAt: checkIn.submittedAt as Date,
      attended: checkIn.attended as boolean,
      rpe: checkIn.rpe as number | undefined,
      win: checkIn.win as string,
      tweak: checkIn.tweak as string,
      proofOfEffort: checkIn.proofOfEffort as ProofSubmission[] | undefined,
      status: checkIn.status as CheckInStatus,
      createdAt: checkIn.createdAt as Date,
      user: checkIn.user as { id: string; name?: string; email: string } | undefined,
      session: checkIn.session as { id: string; scheduledAt: Date; pod: { id: string; sprintType: string } } | undefined
    }
  }
}