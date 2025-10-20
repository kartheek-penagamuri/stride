import { PrismaClient, Prisma } from '@prisma/client'
import { 
  SprintType, 
  PodStatus, 
  MemberRole, 
  MembershipStatus,
  CompatibilityScore 
} from '@/types'
// import { MatchingCandidate, PodSuggestion } from './matching-service' // Commented out as unused

const prisma = new PrismaClient()

export interface CreatePodRequest {
  sprintType: SprintType
  memberIds: string[]
  compatibilityScore: CompatibilityScore
  locale?: string
}

export interface PodDetails {
  id: string
  sprintType: SprintType
  status: PodStatus
  currentMembers: number
  maxMembers: number
  members: PodMember[]
  compatibilityScore?: CompatibilityScore
  createdAt: Date
  updatedAt: Date
}

export interface PodMember {
  userId: string
  name: string
  email: string
  role: MemberRole
  status: MembershipStatus
  joinedAt: Date
  preferences?: Record<string, unknown>
  timezone: string
}

export interface JoinPodRequest {
  userId: string
  podId: string
  matchSignals?: Record<string, unknown>
}

export interface RematchRequest {
  userId: string
  currentPodId?: string
  reason: 'no_show' | 'incompatible' | 'schedule_conflict' | 'other'
  description?: string
}

export class PodService {
  /**
   * Create a new pod with initial members
   */
  static async createPod(request: CreatePodRequest): Promise<PodDetails> {
    const { sprintType, memberIds, compatibilityScore, locale = 'en' } = request

    if (memberIds.length < 2 || memberIds.length > 4) {
      throw new Error('Pod must have between 2 and 4 members')
    }

    // Verify all users exist and don't have active pod memberships
    const users = await prisma.user.findMany({
      where: {
        id: { in: memberIds }
      },
      include: {
        podMemberships: {
          where: {
            status: MembershipStatus.ACTIVE,
            pod: {
              status: {
                in: [PodStatus.FORMING, PodStatus.ACTIVE]
              }
            }
          }
        }
      }
    })

    if (users.length !== memberIds.length) {
      throw new Error('One or more users not found')
    }

    // Check for existing active memberships
    const usersWithActivePods = users.filter((user: { podMemberships: unknown[] }) => user.podMemberships.length > 0)
    if (usersWithActivePods.length > 0) {
      throw new Error(`Users already have active pod memberships: ${usersWithActivePods.map((u: { email: string }) => u.email).join(', ')}`)
    }

    // Create pod and memberships in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the pod
      const pod = await tx.pod.create({
        data: {
          sprintType,
          locale,
          currentMembers: memberIds.length,
          maxMembers: 4,
          status: PodStatus.FORMING,
          matchingData: JSON.parse(JSON.stringify(compatibilityScore))
        }
      })

      // Create memberships for all members
      const memberships = await Promise.all(
        memberIds.map((userId, index) =>
          tx.podMembership.create({
            data: {
              userId,
              podId: pod.id,
              role: index === 0 ? MemberRole.FACILITATOR : MemberRole.MEMBER,
              status: MembershipStatus.ACTIVE,
              matchSignals: JSON.parse(JSON.stringify({
                compatibilityScore,
                joinedAsFounder: true
              }))
            }
          })
        )
      )

      return { pod, memberships }
    })

    // Return pod details
    return this.getPodDetails(result.pod.id)
  }

  /**
   * Add a user to an existing pod
   */
  static async joinPod(request: JoinPodRequest): Promise<PodDetails> {
    const { userId, podId, matchSignals } = request

    // Verify pod exists and has space
    const pod = await prisma.pod.findUnique({
      where: { id: podId },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE }
        }
      }
    })

    if (!pod) {
      throw new Error('Pod not found')
    }

    if (pod.status !== PodStatus.FORMING) {
      throw new Error('Pod is not accepting new members')
    }

    if (pod.memberships.length >= pod.maxMembers) {
      throw new Error('Pod is full')
    }

    // Verify user exists and doesn't have active membership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        podMemberships: {
          where: {
            status: MembershipStatus.ACTIVE,
            pod: {
              status: {
                in: [PodStatus.FORMING, PodStatus.ACTIVE]
              }
            }
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.podMemberships.length > 0) {
      throw new Error('User already has an active pod membership')
    }

    // Add user to pod in transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create membership
      await tx.podMembership.create({
        data: {
          userId,
          podId,
          role: MemberRole.MEMBER,
          status: MembershipStatus.ACTIVE,
          matchSignals: JSON.parse(JSON.stringify(matchSignals))
        }
      })

      // Update pod member count
      await tx.pod.update({
        where: { id: podId },
        data: {
          currentMembers: pod.memberships.length + 1,
          // Activate pod if it reaches minimum size
          status: pod.memberships.length + 1 >= 2 ? PodStatus.ACTIVE : PodStatus.FORMING
        }
      })
    })

    return this.getPodDetails(podId)
  }

  /**
   * Remove a user from a pod (leave or remove)
   */
  static async leavePod(userId: string, podId: string, reason?: string): Promise<void> {
    const membership = await prisma.podMembership.findUnique({
      where: {
        userId_podId: {
          userId,
          podId
        }
      },
      include: {
        pod: {
          include: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE }
            }
          }
        }
      }
    })

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new Error('Active membership not found')
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update membership status
      await tx.podMembership.update({
        where: {
          userId_podId: {
            userId,
            podId
          }
        },
        data: {
          status: MembershipStatus.LEFT,
          matchSignals: JSON.parse(JSON.stringify({
            ...(membership.matchSignals as Record<string, unknown>),
            leftReason: reason,
            leftAt: new Date()
          }))
        }
      })

      const remainingMembers = membership.pod.memberships.length - 1

      // Update pod
      if (remainingMembers === 0) {
        // Disband pod if no members left
        await tx.pod.update({
          where: { id: podId },
          data: {
            status: PodStatus.DISBANDED,
            currentMembers: 0
          }
        })
      } else if (remainingMembers === 1) {
        // Put pod back to forming if only one member left
        await tx.pod.update({
          where: { id: podId },
          data: {
            status: PodStatus.FORMING,
            currentMembers: remainingMembers
          }
        })
      } else {
        // Just update member count
        await tx.pod.update({
          where: { id: podId },
          data: {
            currentMembers: remainingMembers
          }
        })
      }

      // If the leaving member was facilitator, promote another member
      if (membership.role === MemberRole.FACILITATOR && remainingMembers > 0) {
        const nextFacilitator = await tx.podMembership.findFirst({
          where: {
            podId,
            status: MembershipStatus.ACTIVE,
            userId: { not: userId }
          },
          orderBy: { joinedAt: 'asc' }
        })

        if (nextFacilitator) {
          await tx.podMembership.update({
            where: { id: nextFacilitator.id },
            data: { role: MemberRole.FACILITATOR }
          })
        }
      }
    })
  }

  /**
   * Get detailed information about a pod
   */
  static async getPodDetails(podId: string): Promise<PodDetails> {
    const pod = await prisma.pod.findUnique({
      where: { id: podId },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          include: {
            user: true
          },
          orderBy: [
            { role: 'desc' }, // Facilitator first
            { joinedAt: 'asc' }
          ]
        }
      }
    })

    if (!pod) {
      throw new Error('Pod not found')
    }

    const members: PodMember[] = pod.memberships.map((membership: { user: { id: string; name: string | null; email: string; timezone: string; preferences: unknown }; role: string; status: string; joinedAt: Date }) => ({
      userId: membership.user.id,
      name: membership.user.name || 'Unknown',
      email: membership.user.email,
      role: membership.role as MemberRole,
      status: membership.status as MembershipStatus,
      joinedAt: membership.joinedAt,
      preferences: (membership.user as { preferences?: Record<string, unknown> }).preferences,
      timezone: (membership.user as { timezone?: string }).timezone || 'UTC'
    }))

    return {
      id: pod.id,
      sprintType: pod.sprintType as SprintType,
      status: pod.status as PodStatus,
      currentMembers: pod.currentMembers,
      maxMembers: pod.maxMembers,
      members,
      compatibilityScore: pod.matchingData as unknown as CompatibilityScore,
      createdAt: pod.createdAt,
      updatedAt: pod.updatedAt
    }
  }

  /**
   * Get pods for a specific user
   */
  static async getUserPods(userId: string): Promise<PodDetails[]> {
    const memberships = await prisma.podMembership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE
      },
      include: {
        pod: {
          include: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE },
              include: { user: true }
            }
          }
        }
      }
    })

    return Promise.all(
      memberships.map((membership: { pod: { id: string } }) => this.getPodDetails(membership.pod.id))
    )
  }

  /**
   * Request a rematch (leave current pod and enter matching queue)
   */
  static async requestRematch(request: RematchRequest): Promise<void> {
    const { userId, currentPodId, reason, description } = request

    if (currentPodId) {
      // Leave current pod
      await this.leavePod(userId, currentPodId, `Rematch requested: ${reason}`)
    }

    // Log rematch request for analytics/moderation
    // In a full implementation, this would go to a rematch_requests table
    console.log('Rematch requested:', {
      userId,
      currentPodId,
      reason,
      description,
      timestamp: new Date()
    })

    // User is now available for matching again
    // The matching service will pick them up in the next matching cycle
  }

  /**
   * Get pods that are actively forming and looking for members
   */
  static async getFormingPods(sprintType?: SprintType): Promise<PodDetails[]> {
    const pods = await prisma.pod.findMany({
      where: {
        status: PodStatus.FORMING,
        currentMembers: { lt: 4 },
        ...(sprintType && { sprintType })
      },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return Promise.all(
      pods.map((pod: { id: string }) => this.getPodDetails(pod.id))
    )
  }

  /**
   * Activate a pod (move from FORMING to ACTIVE)
   */
  static async activatePod(podId: string): Promise<PodDetails> {
    const pod = await prisma.pod.findUnique({
      where: { id: podId },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE }
        }
      }
    })

    if (!pod) {
      throw new Error('Pod not found')
    }

    if (pod.status !== PodStatus.FORMING) {
      throw new Error('Pod is not in forming status')
    }

    if (pod.memberships.length < 2) {
      throw new Error('Pod needs at least 2 members to activate')
    }

    await prisma.pod.update({
      where: { id: podId },
      data: { status: PodStatus.ACTIVE }
    })

    return this.getPodDetails(podId)
  }

  /**
   * Complete a pod (move to COMPLETED status)
   */
  static async completePod(podId: string): Promise<PodDetails> {
    await prisma.pod.update({
      where: { id: podId },
      data: { status: PodStatus.COMPLETED }
    })

    return this.getPodDetails(podId)
  }
}