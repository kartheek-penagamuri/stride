import { PrismaClient } from '@prisma/client'
import { 
  SprintType, 
  CompatibilityScore, 
  UserPreferences, 
  TimeSlot,
  PodStatus,
  MembershipStatus 
} from '@/types'

const prisma = new PrismaClient()

export interface MatchingCandidate {
  userId: string
  sprintType: SprintType
  preferences: UserPreferences
  timezone: string
  createdAt: Date
}

export interface PodSuggestion {
  podId?: string
  members: MatchingCandidate[]
  compatibilityScore: CompatibilityScore
  estimatedStartDate: Date
}

export interface MatchingRequest {
  userId: string
  sprintType: SprintType
  preferences: UserPreferences
  timezone: string
}

export class MatchingAlgorithm {
  private static readonly MIN_COMPATIBILITY_THRESHOLD = 0.6
  private static readonly MIN_POD_SIZE = 2
  private static readonly MAX_POD_SIZE = 4
  private static readonly TIMEZONE_WEIGHT = 0.3
  private static readonly EXPERIENCE_WEIGHT = 0.25
  private static readonly COLLABORATION_WEIGHT = 0.25
  private static readonly AVAILABILITY_WEIGHT = 0.2

  /**
   * Calculate compatibility score between two users
   */
  static calculateCompatibility(
    user1: MatchingCandidate, 
    user2: MatchingCandidate
  ): CompatibilityScore {
    const timezoneMatch = this.calculateTimezoneCompatibility(
      user1.timezone, 
      user2.timezone
    )
    
    const experienceLevel = this.calculateExperienceCompatibility(
      user1.preferences.experienceLevel,
      user2.preferences.experienceLevel
    )
    
    const collaborationStyle = this.calculateCollaborationCompatibility(
      user1.preferences.collaborationStyle,
      user2.preferences.collaborationStyle
    )
    
    const availabilityOverlap = this.calculateAvailabilityOverlap(
      user1.preferences.availabilityWindows,
      user2.preferences.availabilityWindows
    )

    const overall = (
      timezoneMatch * this.TIMEZONE_WEIGHT +
      experienceLevel * this.EXPERIENCE_WEIGHT +
      collaborationStyle * this.COLLABORATION_WEIGHT +
      availabilityOverlap * this.AVAILABILITY_WEIGHT
    )

    return {
      overall,
      timezoneMatch,
      experienceLevel,
      collaborationStyle,
      availabilityOverlap
    }
  }

  /**
   * Calculate timezone compatibility (0-1 score)
   */
  private static calculateTimezoneCompatibility(tz1: string, tz2: string): number {
    try {
      const now = new Date()
      const offset1 = this.getTimezoneOffset(tz1, now)
      const offset2 = this.getTimezoneOffset(tz2, now)
      
      const hoursDiff = Math.abs(offset1 - offset2)
      
      // Perfect match (same timezone) = 1.0
      // 1-2 hour difference = 0.8
      // 3-4 hour difference = 0.6
      // 5-6 hour difference = 0.4
      // 7-8 hour difference = 0.2
      // 9+ hour difference = 0.1
      
      if (hoursDiff === 0) return 1.0
      if (hoursDiff <= 2) return 0.8
      if (hoursDiff <= 4) return 0.6
      if (hoursDiff <= 6) return 0.4
      if (hoursDiff <= 8) return 0.2
      return 0.1
    } catch (error) {
      console.warn('Error calculating timezone compatibility:', error)
      return 0.5 // Default moderate compatibility
    }
  }

  /**
   * Get timezone offset in hours
   */
  private static getTimezoneOffset(timezone: string, date: Date): number {
    try {
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
      const targetTime = new Date(utc + (this.getTimezoneOffsetMinutes(timezone) * 60000))
      return targetTime.getTimezoneOffset() / -60
    } catch {
      return 0
    }
  }

  /**
   * Get timezone offset in minutes (simplified implementation)
   */
  private static getTimezoneOffsetMinutes(timezone: string): number {
    // This is a simplified implementation. In production, use a proper timezone library
    const offsets: Record<string, number> = {
      'UTC': 0,
      'America/New_York': -300, // EST
      'America/Chicago': -360,  // CST
      'America/Denver': -420,   // MST
      'America/Los_Angeles': -480, // PST
      'Europe/London': 0,       // GMT
      'Europe/Paris': 60,       // CET
      'Asia/Tokyo': 540,        // JST
      'Australia/Sydney': 600,  // AEST
    }
    return offsets[timezone] || 0
  }

  /**
   * Calculate experience level compatibility (0-1 score)
   */
  private static calculateExperienceCompatibility(
    exp1: string, 
    exp2: string
  ): number {
    const levels = ['beginner', 'intermediate', 'advanced']
    const index1 = levels.indexOf(exp1)
    const index2 = levels.indexOf(exp2)
    
    if (index1 === -1 || index2 === -1) return 0.5
    
    const diff = Math.abs(index1 - index2)
    
    // Same level = 1.0
    // Adjacent levels = 0.7
    // Opposite ends = 0.3
    if (diff === 0) return 1.0
    if (diff === 1) return 0.7
    return 0.3
  }

  /**
   * Calculate collaboration style compatibility (0-1 score)
   */
  private static calculateCollaborationCompatibility(
    style1: string, 
    style2: string
  ): number {
    // Compatibility matrix for collaboration styles
    const compatibility: Record<string, Record<string, number>> = {
      'structured': {
        'structured': 1.0,
        'flexible': 0.7,
        'casual': 0.4
      },
      'flexible': {
        'structured': 0.7,
        'flexible': 1.0,
        'casual': 0.8
      },
      'casual': {
        'structured': 0.4,
        'flexible': 0.8,
        'casual': 1.0
      }
    }
    
    return compatibility[style1]?.[style2] || 0.5
  }

  /**
   * Calculate availability overlap (0-1 score)
   */
  private static calculateAvailabilityOverlap(
    slots1: TimeSlot[],
    slots2: TimeSlot[]
    // TODO: Add timezone conversion support
    // tz1: string,
    // tz2: string
  ): number {
    if (!slots1.length || !slots2.length) return 0.5
    
    let totalOverlap = 0
    let maxPossibleOverlap = 0
    
    for (const slot1 of slots1) {
      for (const slot2 of slots2) {
        const overlap = this.calculateTimeSlotOverlap(slot1, slot2)
        totalOverlap += overlap
        maxPossibleOverlap += Math.min(slot1.duration, slot2.duration)
      }
    }
    
    return maxPossibleOverlap > 0 ? Math.min(totalOverlap / maxPossibleOverlap, 1.0) : 0
  }

  /**
   * Calculate overlap between two time slots in minutes
   */
  private static calculateTimeSlotOverlap(
    slot1: TimeSlot,
    slot2: TimeSlot
    // TODO: Add timezone conversion support
    // tz1: string,
    // tz2: string
  ): number {
    // If different days, no overlap
    if (slot1.dayOfWeek !== slot2.dayOfWeek) return 0
    
    // Convert times to minutes from midnight
    const start1 = this.timeToMinutes(slot1.startTime)
    const end1 = start1 + slot1.duration
    const start2 = this.timeToMinutes(slot2.startTime)
    const end2 = start2 + slot2.duration
    
    // Calculate overlap
    const overlapStart = Math.max(start1, start2)
    const overlapEnd = Math.min(end1, end2)
    
    return Math.max(0, overlapEnd - overlapStart)
  }

  /**
   * Convert HH:MM time string to minutes from midnight
   */
  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Find potential pod matches for a user
   */
  static async findPotentialMatches(
    request: MatchingRequest
  ): Promise<PodSuggestion[]> {
    // Get existing pods that are still forming and match sprint type
    const formingPods = await prisma.pod.findMany({
      where: {
        sprintType: request.sprintType,
        status: PodStatus.FORMING,
        currentMembers: {
          lt: this.MAX_POD_SIZE
        }
      },
      include: {
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE
          },
          include: {
            user: true
          }
        }
      }
    })

    // Get users waiting for matches (no active pod membership)
    const waitingUsers = await prisma.user.findMany({
      where: {
        id: {
          not: request.userId
        },
        goals: {
          some: {
            sprintType: request.sprintType,
            status: 'active'
          }
        },
        podMemberships: {
          none: {
            status: MembershipStatus.ACTIVE,
            pod: {
              status: {
                in: [PodStatus.FORMING, PodStatus.ACTIVE]
              }
            }
          }
        }
      },
      include: {
        goals: {
          where: {
            sprintType: request.sprintType,
            status: 'active'
          }
        }
      }
    })

    const suggestions: PodSuggestion[] = []
    const requestingUser: MatchingCandidate = {
      userId: request.userId,
      sprintType: request.sprintType,
      preferences: request.preferences,
      timezone: request.timezone,
      createdAt: new Date()
    }

    // Check existing forming pods
    for (const pod of formingPods) {
      const podMembers: MatchingCandidate[] = pod.memberships.map((membership: { user: { id: string; preferences?: unknown; timezone: string; createdAt: Date } }) => ({
        userId: membership.user.id,
        sprintType: request.sprintType,
        preferences: (membership.user.preferences as UserPreferences) || this.getDefaultPreferences(),
        timezone: membership.user.timezone,
        createdAt: membership.user.createdAt
      }))

      const compatibility = this.calculatePodCompatibility(requestingUser, podMembers)
      
      if (compatibility.overall >= this.MIN_COMPATIBILITY_THRESHOLD) {
        suggestions.push({
          podId: pod.id,
          members: [...podMembers, requestingUser],
          compatibilityScore: compatibility,
          estimatedStartDate: this.calculateEstimatedStartDate(pod.createdAt)
        })
      }
    }

    // Create new pod suggestions from waiting users
    const waitingCandidates: MatchingCandidate[] = waitingUsers.map((user: { id: string; preferences?: unknown; timezone: string; createdAt: Date }) => ({
      userId: user.id,
      sprintType: request.sprintType,
      preferences: (user.preferences as UserPreferences) || this.getDefaultPreferences(),
      timezone: user.timezone,
      createdAt: user.createdAt
    }))

    // Try to form new pods with 2-4 members
    const newPodSuggestions = this.generateNewPodCombinations(
      requestingUser,
      waitingCandidates
    )

    suggestions.push(...newPodSuggestions)

    // Sort by compatibility score (highest first)
    return suggestions.sort((a, b) => b.compatibilityScore.overall - a.compatibilityScore.overall)
  }

  /**
   * Calculate compatibility for a user joining an existing pod
   */
  private static calculatePodCompatibility(
    newUser: MatchingCandidate,
    existingMembers: MatchingCandidate[]
  ): CompatibilityScore {
    if (existingMembers.length === 0) {
      return {
        overall: 1.0,
        timezoneMatch: 1.0,
        experienceLevel: 1.0,
        collaborationStyle: 1.0,
        availabilityOverlap: 1.0
      }
    }

    // Calculate average compatibility with all existing members
    const compatibilityScores = existingMembers.map(member => 
      this.calculateCompatibility(newUser, member)
    )

    const avgScore: CompatibilityScore = {
      overall: 0,
      timezoneMatch: 0,
      experienceLevel: 0,
      collaborationStyle: 0,
      availabilityOverlap: 0
    }

    for (const score of compatibilityScores) {
      avgScore.overall += score.overall
      avgScore.timezoneMatch += score.timezoneMatch
      avgScore.experienceLevel += score.experienceLevel
      avgScore.collaborationStyle += score.collaborationStyle
      avgScore.availabilityOverlap += score.availabilityOverlap
    }

    const memberCount = compatibilityScores.length
    avgScore.overall /= memberCount
    avgScore.timezoneMatch /= memberCount
    avgScore.experienceLevel /= memberCount
    avgScore.collaborationStyle /= memberCount
    avgScore.availabilityOverlap /= memberCount

    return avgScore
  }

  /**
   * Generate new pod combinations from waiting users
   */
  private static generateNewPodCombinations(
    requestingUser: MatchingCandidate,
    waitingCandidates: MatchingCandidate[]
  ): PodSuggestion[] {
    const suggestions: PodSuggestion[] = []

    // Try combinations of 2-4 total members (including requesting user)
    for (let size = this.MIN_POD_SIZE - 1; size <= this.MAX_POD_SIZE - 1; size++) {
      const combinations = this.getCombinations(waitingCandidates, size)
      
      for (const combination of combinations) {
        const podMembers = [requestingUser, ...combination]
        const compatibility = this.calculateGroupCompatibility(podMembers)
        
        if (compatibility.overall >= this.MIN_COMPATIBILITY_THRESHOLD) {
          suggestions.push({
            members: podMembers,
            compatibilityScore: compatibility,
            estimatedStartDate: new Date() // New pods can start immediately
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Calculate overall compatibility for a group of users
   */
  private static calculateGroupCompatibility(
    members: MatchingCandidate[]
  ): CompatibilityScore {
    if (members.length < 2) {
      return {
        overall: 1.0,
        timezoneMatch: 1.0,
        experienceLevel: 1.0,
        collaborationStyle: 1.0,
        availabilityOverlap: 1.0
      }
    }

    const pairScores: CompatibilityScore[] = []
    
    // Calculate compatibility for all pairs
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        pairScores.push(this.calculateCompatibility(members[i], members[j]))
      }
    }

    // Return average of all pair scores
    const avgScore: CompatibilityScore = {
      overall: 0,
      timezoneMatch: 0,
      experienceLevel: 0,
      collaborationStyle: 0,
      availabilityOverlap: 0
    }

    for (const score of pairScores) {
      avgScore.overall += score.overall
      avgScore.timezoneMatch += score.timezoneMatch
      avgScore.experienceLevel += score.experienceLevel
      avgScore.collaborationStyle += score.collaborationStyle
      avgScore.availabilityOverlap += score.availabilityOverlap
    }

    const pairCount = pairScores.length
    avgScore.overall /= pairCount
    avgScore.timezoneMatch /= pairCount
    avgScore.experienceLevel /= pairCount
    avgScore.collaborationStyle /= pairCount
    avgScore.availabilityOverlap /= pairCount

    return avgScore
  }

  /**
   * Get all combinations of specified size from array
   */
  private static getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 0) return [[]]
    if (size > arr.length) return []
    
    const result: T[][] = []
    
    function backtrack(start: number, current: T[]) {
      if (current.length === size) {
        result.push([...current])
        return
      }
      
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i])
        backtrack(i + 1, current)
        current.pop()
      }
    }
    
    backtrack(0, [])
    return result
  }

  /**
   * Calculate estimated start date for a pod
   */
  private static calculateEstimatedStartDate(podCreatedAt: Date): Date {
    // Existing pods might start within 1-3 days
    const daysToAdd = Math.floor(Math.random() * 3) + 1
    const startDate = new Date(podCreatedAt)
    startDate.setDate(startDate.getDate() + daysToAdd)
    return startDate
  }

  /**
   * Get default user preferences
   */
  private static getDefaultPreferences(): UserPreferences {
    return {
      timezone: 'UTC',
      availabilityWindows: [],
      notificationSettings: {
        email: true,
        push: true,
        sms: false,
        quietHours: {
          start: '22:00',
          end: '08:00'
        }
      },
      collaborationStyle: 'flexible',
      experienceLevel: 'beginner'
    }
  }
}