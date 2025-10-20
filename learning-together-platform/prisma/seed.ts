import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Sprint templates are handled in-memory by SprintTemplateService
  console.log('ℹ️ Sprint templates are managed in-memory, not in database')

  // Create sample users with preferences
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      timezone: 'America/New_York',
      preferences: {
        timezone: 'America/New_York',
        availabilityWindows: [
          { dayOfWeek: 1, startTime: '07:00', duration: 120 },
          { dayOfWeek: 3, startTime: '07:00', duration: 120 },
          { dayOfWeek: 5, startTime: '07:00', duration: 120 },
        ],
        notificationSettings: {
          email: true,
          push: true,
          sms: false,
          quietHours: { start: '22:00', end: '06:00' }
        },
        collaborationStyle: 'structured',
        experienceLevel: 'intermediate'
      },
      integrations: {
        fitness: { provider: 'strava', connected: true },
        calendar: { provider: 'google', connected: true }
      }
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      timezone: 'America/Los_Angeles',
      preferences: {
        timezone: 'America/Los_Angeles',
        availabilityWindows: [
          { dayOfWeek: 2, startTime: '19:00', duration: 120 },
          { dayOfWeek: 4, startTime: '19:00', duration: 120 },
        ],
        notificationSettings: {
          email: true,
          push: false,
          sms: true,
          quietHours: { start: '23:00', end: '07:00' }
        },
        collaborationStyle: 'flexible',
        experienceLevel: 'beginner'
      },
      integrations: {
        github: { provider: 'github', connected: true },
        calendar: { provider: 'outlook', connected: false }
      }
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      name: 'Charlie Davis',
      timezone: 'Europe/London',
      preferences: {
        timezone: 'Europe/London',
        availabilityWindows: [
          { dayOfWeek: 1, startTime: '18:00', duration: 90 },
          { dayOfWeek: 3, startTime: '18:00', duration: 90 },
          { dayOfWeek: 5, startTime: '18:00', duration: 90 },
        ],
        notificationSettings: {
          email: true,
          push: true,
          sms: false,
          quietHours: { start: '21:00', end: '08:00' }
        },
        collaborationStyle: 'casual',
        experienceLevel: 'advanced'
      }
    },
  })

  console.log('✅ Created users:', { user1, user2, user3 })

  // Create sample goals
  const goal1 = await prisma.goal.create({
    data: {
      userId: user1.id,
      sprintType: 'gym_3x_week',
      title: 'Gym 3x per week for 30 days',
      description: 'Build a consistent gym habit',
      schedule: {
        defaultSlots: [
          { dayOfWeek: 1, startTime: '07:00', duration: 60 },
          { dayOfWeek: 3, startTime: '07:00', duration: 60 },
          { dayOfWeek: 5, startTime: '07:00', duration: 60 },
        ],
        backupSlot: { dayOfWeek: 6, startTime: '09:00', duration: 60 },
        timezone: 'America/New_York',
        frequency: 'weekly',
      },
      proofMethod: 'gym_checkin_photo',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const goal2 = await prisma.goal.create({
    data: {
      userId: user2.id,
      sprintType: 'net_prompting',
      title: '.NET Prompting Mastery',
      description: 'Learn advanced .NET prompting techniques',
      schedule: {
        defaultSlots: [
          { dayOfWeek: 2, startTime: '19:00', duration: 90 },
          { dayOfWeek: 4, startTime: '19:00', duration: 90 },
        ],
        backupSlot: { dayOfWeek: 0, startTime: '14:00', duration: 90 },
        timezone: 'America/Los_Angeles',
        frequency: 'weekly',
      },
      proofMethod: 'code_commit',
      startDate: new Date(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Created goals:', { goal1, goal2 })

  // Create sample pods
  const gymPod = await prisma.pod.create({
    data: {
      sprintType: 'gym_3x_week',
      locale: 'en',
      maxMembers: 4,
      currentMembers: 2,
      status: 'active',
      matchingData: {
        averageCompatibility: 0.85,
        timezoneSpread: 3, // hours
        experienceLevels: ['intermediate', 'beginner']
      }
    },
  })

  const netPod = await prisma.pod.create({
    data: {
      sprintType: 'net_prompting',
      locale: 'en',
      maxMembers: 3,
      currentMembers: 1,
      status: 'forming',
      matchingData: {
        averageCompatibility: 0.75,
        timezoneSpread: 8,
        experienceLevels: ['beginner']
      }
    },
  })

  console.log('✅ Created pods:', { gymPod, netPod })

  // Create pod memberships
  await prisma.podMembership.create({
    data: {
      userId: user1.id,
      podId: gymPod.id,
      role: 'facilitator',
      matchSignals: {
        timezone: 'America/New_York',
        availabilityScore: 0.9,
        experienceLevel: 'intermediate',
        collaborationStyle: 'structured',
        responseTime: 2.5
      }
    },
  })

  await prisma.podMembership.create({
    data: {
      userId: user3.id,
      podId: gymPod.id,
      role: 'member',
      matchSignals: {
        timezone: 'Europe/London',
        availabilityScore: 0.8,
        experienceLevel: 'advanced',
        collaborationStyle: 'casual',
        responseTime: 4.2
      }
    },
  })

  await prisma.podMembership.create({
    data: {
      userId: user2.id,
      podId: netPod.id,
      role: 'member',
      matchSignals: {
        timezone: 'America/Los_Angeles',
        availabilityScore: 0.7,
        experienceLevel: 'beginner',
        collaborationStyle: 'flexible',
        responseTime: 6.1
      }
    },
  })

  console.log('✅ Created pod memberships')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })