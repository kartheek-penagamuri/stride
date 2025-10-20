import { prisma } from '@/lib/prisma'
import { UserPreferences } from '@/types'
import { z } from 'zod'

// Validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  timezone: z.string().optional().default('UTC'),
  image: z.string().url().optional(),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  timezone: z.string().optional(),
  image: z.string().url().optional(),
})

export const UserPreferencesSchema = z.object({
  timezone: z.string(),
  availabilityWindows: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  })),
  notificationSettings: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
    quietHours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    }),
  }),
  collaborationStyle: z.enum(['structured', 'flexible', 'casual']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserDto) {
    const validatedData = CreateUserSchema.parse(userData)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create user with default preferences
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        timezone: validatedData.timezone,
        image: validatedData.image,
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UpdateProfileDto) {
    const validatedUpdates = UpdateProfileSchema.parse(updates)

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * Get user preferences (stored as JSON in a separate table or user field)
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    // For now, we'll store preferences in a JSON field on the user
    // In the future, this could be a separate table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        timezone: true,
        // We'll add a preferences JSON field to the user model later
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Return default preferences for now
    // TODO: Add preferences field to user model and store/retrieve from there
    return {
      timezone: user.timezone,
      availabilityWindows: [],
      notificationSettings: {
        email: true,
        push: true,
        sms: false,
        quietHours: {
          start: '22:00',
          end: '08:00',
        },
      },
      collaborationStyle: 'structured',
      experienceLevel: 'beginner',
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, preferences: UserPreferences) {
    const validatedPreferences = UserPreferencesSchema.parse(preferences)

    // For now, we'll just update the timezone
    // TODO: Add preferences JSON field to user model
    await prisma.user.update({
      where: { id: userId },
      data: {
        timezone: validatedPreferences.timezone,
      },
    })

    return validatedPreferences
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string) {
    // This will cascade delete related records due to Prisma schema constraints
    await prisma.user.delete({
      where: { id: userId },
    })

    return { success: true }
  }

  /**
   * Get user's connected accounts
   */
  static async getUserAccounts(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: {
        provider: true,
        providerAccountId: true,
        type: true,
        scope: true,
      },
    })

    return accounts
  }

  /**
   * Search users by email or name
   */
  static async searchUsers(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
            },
          },
          {
            name: {
              contains: query,
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
      take: limit,
    })

    return users
  }

  /**
   * Check if user exists
   */
  static async userExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    return !!user
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    const [user, goalsCount, podMembershipsCount, checkInsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
      prisma.goal.count({
        where: { userId },
      }),
      prisma.podMembership.count({
        where: { userId, status: 'active' },
      }),
      prisma.checkIn.count({
        where: { userId },
      }),
    ])

    if (!user) {
      throw new Error('User not found')
    }

    return {
      memberSince: user.createdAt,
      totalGoals: goalsCount,
      activePods: podMembershipsCount,
      totalCheckIns: checkInsCount,
    }
  }
}