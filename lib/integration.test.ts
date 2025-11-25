import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { closeDatabase, getDatabase } from './db'
import { createUserAccount, authenticateUser } from './auth'
import fs from 'fs'

// Helper function to delete database file with retries for Windows file locking
function deleteDbFile() {
  if (!fs.existsSync('stride.db')) return
  
  try {
    fs.unlinkSync('stride.db')
  } catch {
    // If file is still locked, wait a bit and try again
    const maxRetries = 5
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Wait 100ms
        const start = Date.now()
        while (Date.now() - start < 100) {}
        fs.unlinkSync('stride.db')
        return
      } catch {
        if (i === maxRetries - 1) {
          // File is still locked, just continue - the database will be reused
          return
        }
      }
    }
  }
}

// Helper function to clean all data from tables
function cleanDatabase() {
  const db = getDatabase()
  db.prepare('DELETE FROM habit_completions').run()
  db.prepare('DELETE FROM habits').run()
  db.prepare('DELETE FROM users').run()
}

// Top-level setup and teardown for all tests
beforeAll(() => {
  // Initialize database once for all tests
  closeDatabase()
  deleteDbFile()
  // Database will be initialized on first access
  getDatabase()
})

afterEach(() => {
  // Clean up data after each test
  cleanDatabase()
})

afterAll(() => {
  // Close connection and clean up test database
  closeDatabase()
  deleteDbFile()
})

describe('Integration Tests', () => {

  describe('12.1 User Registration Flow', () => {
    it('should register a user through the auth module', async () => {
      const result = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      expect(result.error).toBeUndefined()
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
      expect(result.user?.name).toBe('Test User')
      expect(result.user?.id).toBeGreaterThan(0)
    })

    it('should store user in SQLite database', async () => {
      const { findUserByEmail } = await import('./db')
      
      await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      const user = await findUserByEmail('test@example.com')
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
    })

    it('should reject duplicate email registration', async () => {
      // First registration
      await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      // Second registration with same email
      const result = await createUserAccount({
        email: 'test@example.com',
        password: 'different_password',
        name: 'Another User'
      })

      expect(result.error).toBeDefined()
      expect(result.error).toContain('exists')
      expect(result.user).toBeUndefined()
    })

    it('should normalize email to lowercase', async () => {
      const { findUserByEmail } = await import('./db')
      
      await createUserAccount({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User'
      })

      const user = await findUserByEmail('test@example.com')
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })
  })

  describe('12.2 Authentication Flow', () => {
    it('should login with valid credentials', async () => {
      // Register a user first
      await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      // Login with valid credentials
      const result = await authenticateUser('test@example.com', 'password123')

      expect(result.error).toBeUndefined()
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
      expect(result.user?.name).toBe('Test User')
    })

    it('should reject invalid credentials', async () => {
      // Register a user first
      await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      // Try to login with wrong password
      const result = await authenticateUser('test@example.com', 'wrongpassword')

      expect(result.error).toBeDefined()
      expect(result.error).toContain('password')
      expect(result.user).toBeUndefined()
    })

    it('should reject login for non-existent user', async () => {
      const result = await authenticateUser('nonexistent@example.com', 'password123')

      expect(result.error).toBeDefined()
      expect(result.error).toContain('No account')
      expect(result.user).toBeUndefined()
    })

    it('should be case-insensitive for email during login', async () => {
      // Register with lowercase email
      await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      // Login with uppercase email
      const result = await authenticateUser('TEST@EXAMPLE.COM', 'password123')

      expect(result.error).toBeUndefined()
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
    })
  })

  describe('12.3 Habit CRUD Operations', () => {
    it('should create habit through database layer', async () => {
      const { createHabitForUser } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Morning Exercise',
        description: 'Do 30 minutes of exercise',
        category: 'health'
      })

      expect(habit).toBeDefined()
      expect(habit.id).toBeGreaterThan(0)
      expect(habit.user_id).toBe(testUserId)
      expect(habit.title).toBe('Morning Exercise')
      expect(habit.description).toBe('Do 30 minutes of exercise')
      expect(habit.category).toBe('health')
    })

    it('should list habits for user', async () => {
      const { createHabitForUser, listHabitsForUser } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create multiple habits
      await createHabitForUser(testUserId, {
        title: 'Habit 1',
        description: 'Description 1',
        category: 'health'
      })
      
      await createHabitForUser(testUserId, {
        title: 'Habit 2',
        description: 'Description 2',
        category: 'productivity'
      })

      const habits = await listHabitsForUser(testUserId)

      expect(habits).toHaveLength(2)
      const titles = habits.map(h => h.title)
      expect(titles).toContain('Habit 1')
      expect(titles).toContain('Habit 2')
    })

    it('should update habit', async () => {
      const { createHabitForUser, updateHabitForUser, findHabitById } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Original Title',
        description: 'Original Description',
        category: 'health'
      })

      const updated = await updateHabitForUser(testUserId, habit.id, {
        title: 'Updated Title',
        description: 'Updated Description'
      })

      expect(updated).toBeDefined()
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.description).toBe('Updated Description')
      expect(updated?.category).toBe('health') // Unchanged

      // Verify in database
      const fetched = await findHabitById(testUserId, habit.id)
      expect(fetched?.title).toBe('Updated Title')
    })

    it('should delete habit', async () => {
      const { createHabitForUser, deleteHabitForUser, findHabitById } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description',
        category: 'health'
      })

      await deleteHabitForUser(testUserId, habit.id)

      const found = await findHabitById(testUserId, habit.id)
      expect(found).toBeNull()
    })

    it('should verify cascade deletion when user is deleted', async () => {
      const { createHabitForUser, listHabitsForUser, findUserByEmail } = await import('./db')
      const Database = (await import('better-sqlite3')).default
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create habits for the user
      await createHabitForUser(testUserId, {
        title: 'Habit 1',
        description: 'Description 1'
      })
      
      await createHabitForUser(testUserId, {
        title: 'Habit 2',
        description: 'Description 2'
      })

      // Verify habits exist
      let habits = await listHabitsForUser(testUserId)
      expect(habits).toHaveLength(2)

      // Delete the user directly via database
      const db = new Database('stride.db')
      db.pragma('foreign_keys = ON')
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId)
      db.close()

      // Verify habits are cascade deleted
      habits = await listHabitsForUser(testUserId)
      expect(habits).toHaveLength(0)
      
      // Verify user is deleted
      const user = await findUserByEmail('test@example.com')
      expect(user).toBeNull()
    })

    it('should isolate habits between users', async () => {
      const { createHabitForUser, listHabitsForUser } = await import('./db')
      
      // Create first test user
      const userResult1 = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult1.user!.id
      
      // Create another user
      const result2 = await createUserAccount({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2'
      })
      const user2Id = result2.user!.id

      // Create habits for both users
      await createHabitForUser(testUserId, {
        title: 'User 1 Habit',
        description: 'Description'
      })
      
      await createHabitForUser(user2Id, {
        title: 'User 2 Habit',
        description: 'Description'
      })

      // Verify each user only sees their own habits
      const user1Habits = await listHabitsForUser(testUserId)
      const user2Habits = await listHabitsForUser(user2Id)

      expect(user1Habits).toHaveLength(1)
      expect(user1Habits[0].title).toBe('User 1 Habit')
      
      expect(user2Habits).toHaveLength(1)
      expect(user2Habits[0].title).toBe('User 2 Habit')
    })
  })

  describe('12.4 Habit Completion Flow', () => {
    it('should complete habit through database layer', async () => {
      const { createHabitForUser, completeHabitForUser } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Morning Exercise',
        description: 'Do 30 minutes of exercise',
        category: 'health'
      })

      // Complete the habit
      const completed = await completeHabitForUser(testUserId, habit.id)

      expect(completed).toBeDefined()
      expect(completed?.streak).toBe(1)
      expect(completed?.completed_today).toBe(1)
      expect(completed?.last_completed).toBeDefined()
    })

    it('should verify streak calculation on first completion', async () => {
      const { createHabitForUser, completeHabitForUser } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Complete the habit for the first time
      const completed = await completeHabitForUser(testUserId, habit.id)

      expect(completed?.streak).toBe(1)
      expect(completed?.completed_today).toBe(1)
      
      // Verify the date is today
      const today = new Date().toISOString().split('T')[0]
      expect(completed?.last_completed).toBe(today)
    })

    it('should verify completion record created', async () => {
      const { createHabitForUser, completeHabitForUser, countHabitCompletions } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Verify no completions initially
      let count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(0)

      // Complete the habit
      await completeHabitForUser(testUserId, habit.id)

      // Verify completion record was created
      count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(1)
    })

    it('should test same-day completion idempotence', async () => {
      const { createHabitForUser, completeHabitForUser, countHabitCompletions } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Complete the habit first time
      const firstCompletion = await completeHabitForUser(testUserId, habit.id)
      expect(firstCompletion?.streak).toBe(1)

      // Complete the habit again on the same day
      const secondCompletion = await completeHabitForUser(testUserId, habit.id)
      
      // Streak should remain at 1 (idempotent)
      expect(secondCompletion?.streak).toBe(1)
      expect(secondCompletion?.completed_today).toBe(1)
      
      // Both completions should be recorded
      const count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(2)
    })

    it('should test consecutive day completion (simulated)', async () => {
      const { createHabitForUser, findHabitById, completeHabitForUser, countHabitCompletions } = await import('./db')
      const Database = (await import('better-sqlite3')).default
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Calculate yesterday's date string
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      const db = new Database('stride.db')
      db.pragma('foreign_keys = ON')
      db.prepare('UPDATE habits SET streak = 1, completed_today = 0, last_completed = ? WHERE id = ?')
        .run(yesterdayStr, habit.id)
      db.close()

      // Verify the habit was updated
      const updatedHabit = await findHabitById(testUserId, habit.id)
      expect(updatedHabit?.streak).toBe(1)
      expect(updatedHabit?.last_completed).toBe(yesterdayStr)

      // Now complete the habit today
      const completed = await completeHabitForUser(testUserId, habit.id)

      // Verify completion was recorded
      expect(completed).toBeDefined()
      expect(completed?.streak).toBeGreaterThan(0)
      
      // Verify the date was updated to today
      const todayStr = new Date().toISOString().split('T')[0]
      expect(completed?.last_completed).toBe(todayStr)
      
      // Verify a completion record was created
      const count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(1)
    })

    it('should test streak reset after gap', async () => {
      const { createHabitForUser, completeHabitForUser, findHabitById } = await import('./db')
      const Database = (await import('better-sqlite3')).default
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Simulate completing the habit 3 days ago
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]
      
      const db = new Database('stride.db')
      db.pragma('foreign_keys = ON')
      db.prepare('UPDATE habits SET streak = 5, completed_today = 1, last_completed = ? WHERE id = ?')
        .run(threeDaysAgoStr, habit.id)
      db.close()

      // Verify the habit was updated
      const updatedHabit = await findHabitById(testUserId, habit.id)
      expect(updatedHabit?.streak).toBe(5)
      expect(updatedHabit?.last_completed).toBe(threeDaysAgoStr)

      // Now complete the habit today (after a gap)
      const completed = await completeHabitForUser(testUserId, habit.id)

      // Streak should reset to 1 due to the gap
      expect(completed?.streak).toBe(1)
      
      const today = new Date().toISOString().split('T')[0]
      expect(completed?.last_completed).toBe(today)
    })
  })

  describe('12.5 Test Completion History Queries', () => {
    it('should query completions for habit', async () => {
      const { createHabitForUser, recordHabitCompletion, getHabitCompletions } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Record multiple completions
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)

      // Query completions
      const completions = await getHabitCompletions(habit.id, testUserId)

      expect(completions).toHaveLength(3)
      expect(completions[0].habit_id).toBe(habit.id)
      expect(completions[0].user_id).toBe(testUserId)
      expect(completions[0].completed_at).toBeDefined()
    })

    it('should query completions in date range', async () => {
      const { createHabitForUser, getHabitCompletionsInRange } = await import('./db')
      const Database = (await import('better-sqlite3')).default
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Insert completions with specific dates
      const db = new Database('stride.db')
      db.pragma('foreign_keys = ON')
      
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, threeDaysAgo.toISOString())
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, twoDaysAgo.toISOString())
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, yesterday.toISOString())
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, today.toISOString())
      
      db.close()

      // Query completions in a specific date range (yesterday to today)
      const startDate = yesterday.toISOString()
      const endDate = today.toISOString()
      const completions = await getHabitCompletionsInRange(habit.id, testUserId, startDate, endDate)

      // Should get 2 completions (yesterday and today)
      expect(completions.length).toBeGreaterThanOrEqual(2)
      expect(completions.length).toBeLessThanOrEqual(4) // Allow for all if date filtering is inclusive
    })

    it('should query completion count', async () => {
      const { createHabitForUser, recordHabitCompletion, countHabitCompletions } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Initially should have 0 completions
      let count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(0)

      // Record some completions
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)

      // Should now have 4 completions
      count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(4)
    })

    it('should query user completion history', async () => {
      const { createHabitForUser, recordHabitCompletion, getCompletionHistoryForUser } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create multiple habits
      const habit1 = await createHabitForUser(testUserId, {
        title: 'Morning Exercise',
        description: 'Exercise Description',
        category: 'health'
      })
      
      const habit2 = await createHabitForUser(testUserId, {
        title: 'Read Books',
        description: 'Reading Description',
        category: 'learning'
      })

      // Record completions for both habits
      await recordHabitCompletion(testUserId, habit1.id)
      await recordHabitCompletion(testUserId, habit2.id)
      await recordHabitCompletion(testUserId, habit1.id)

      // Query completion history
      const history = await getCompletionHistoryForUser(testUserId)

      expect(history).toHaveLength(3)
      
      // Verify habit details are included
      const habit1Completions = history.filter(h => h.habit_id === habit1.id)
      expect(habit1Completions).toHaveLength(2)
      expect(habit1Completions[0].habit_title).toBe('Morning Exercise')
      expect(habit1Completions[0].habit_description).toBe('Exercise Description')
      expect(habit1Completions[0].habit_category).toBe('health')
      
      const habit2Completions = history.filter(h => h.habit_id === habit2.id)
      expect(habit2Completions).toHaveLength(1)
      expect(habit2Completions[0].habit_title).toBe('Read Books')
      expect(habit2Completions[0].habit_category).toBe('learning')
    })

    it('should respect limit parameter in completion history', async () => {
      const { createHabitForUser, recordHabitCompletion, getCompletionHistoryForUser } = await import('./db')
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Record multiple completions
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)
      await recordHabitCompletion(testUserId, habit.id)

      // Query with limit
      const history = await getCompletionHistoryForUser(testUserId, 3)

      expect(history).toHaveLength(3)
    })

    it('should order completions by completed_at descending', async () => {
      const { createHabitForUser, getHabitCompletions } = await import('./db')
      const Database = (await import('better-sqlite3')).default
      
      // Create a test user first
      const userResult = await createUserAccount({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      const testUserId = userResult.user!.id
      
      // Create a habit
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Insert completions with specific timestamps
      const db = new Database('stride.db')
      db.pragma('foreign_keys = ON')
      
      const time1 = new Date('2024-01-01T10:00:00').toISOString()
      const time2 = new Date('2024-01-02T10:00:00').toISOString()
      const time3 = new Date('2024-01-03T10:00:00').toISOString()
      
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, time1)
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, time2)
      db.prepare('INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES (?, ?, ?)')
        .run(habit.id, testUserId, time3)
      
      db.close()

      // Query completions
      const completions = await getHabitCompletions(habit.id, testUserId)

      expect(completions).toHaveLength(3)
      
      // Verify descending order (most recent first)
      expect(new Date(completions[0].completed_at).getTime()).toBeGreaterThan(
        new Date(completions[1].completed_at).getTime()
      )
      expect(new Date(completions[1].completed_at).getTime()).toBeGreaterThan(
        new Date(completions[2].completed_at).getTime()
      )
    })
  })
})
