import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { findUserByEmail, insertUser, closeDatabase, getDatabase } from './db'
import fs from 'fs'

// Helper function to delete database file with retries for Windows file locking
function deleteDbFile() {
  if (!fs.existsSync('stride.db')) return
  
  try {
    fs.unlinkSync('stride.db')
  } catch (err) {
    // If file is still locked, wait a bit and try again
    const maxRetries = 5
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Wait 100ms
        const start = Date.now()
        while (Date.now() - start < 100) {}
        fs.unlinkSync('stride.db')
        return
      } catch (retryErr) {
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

describe('Users Table Operations', () => {

  describe('insertUser', () => {
    it('should insert a user with all fields', async () => {
      const user = await insertUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User'
      })

      expect(user).toBeDefined()
      expect(user.id).toBeGreaterThan(0)
      expect(user.email).toBe('test@example.com')
      expect(user.password_hash).toBe('hashed_password')
      expect(user.name).toBe('Test User')
      expect(user.created_at).toBeDefined()
    })

    it('should convert email to lowercase', async () => {
      const user = await insertUser({
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hashed_password',
        name: 'Test User'
      })

      expect(user.email).toBe('test@example.com')
    })

    it('should insert a user without a name', async () => {
      const user = await insertUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password'
      })

      expect(user).toBeDefined()
      expect(user.name).toBeNull()
    })

    it('should reject duplicate emails', async () => {
      await insertUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password'
      })

      await expect(
        insertUser({
          email: 'test@example.com',
          passwordHash: 'another_hash'
        })
      ).rejects.toThrow()
    })
  })

  describe('findUserByEmail', () => {
    it('should find an existing user', async () => {
      const inserted = await insertUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User'
      })

      const found = await findUserByEmail('test@example.com')

      expect(found).toBeDefined()
      expect(found?.id).toBe(inserted.id)
      expect(found?.email).toBe('test@example.com')
    })

    it('should be case-insensitive', async () => {
      await insertUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password'
      })

      const found = await findUserByEmail('TEST@EXAMPLE.COM')

      expect(found).toBeDefined()
      expect(found?.email).toBe('test@example.com')
    })

    it('should return null for non-existent user', async () => {
      const found = await findUserByEmail('nonexistent@example.com')

      expect(found).toBeNull()
    })
  })
})

describe('Habits Table Operations', () => {
  let testUserId: number

  beforeEach(async () => {
    // Create a test user for each test
    const { insertUser } = await import('./db')
    
    const user = await insertUser({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User'
    })
    testUserId = user.id
  })

  describe('createHabitForUser', () => {
    it('should create a habit with all fields', async () => {
      const { createHabitForUser } = await import('./db')
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
      expect(habit.streak).toBe(0)
      expect(habit.completed_today).toBe(0) // SQLite stores boolean as 0/1
      expect(habit.last_completed).toBeNull()
    })

    it('should use default category if not provided', async () => {
      const { createHabitForUser } = await import('./db')
      const habit = await createHabitForUser(testUserId, {
        title: 'Read',
        description: 'Read for 20 minutes'
      })

      expect(habit.category).toBe('general')
    })
  })

  describe('listHabitsForUser', () => {
    it('should list all habits for a user', async () => {
      const { createHabitForUser, listHabitsForUser } = await import('./db')
      
      const habit1 = await createHabitForUser(testUserId, {
        title: 'Habit 1',
        description: 'Description 1'
      })
      
      const habit2 = await createHabitForUser(testUserId, {
        title: 'Habit 2',
        description: 'Description 2'
      })

      const habits = await listHabitsForUser(testUserId)

      expect(habits).toHaveLength(2)
      // Verify both habits are present (order may vary if created in same second)
      const titles = habits.map(h => h.title)
      expect(titles).toContain('Habit 1')
      expect(titles).toContain('Habit 2')
    })

    it('should return empty array for user with no habits', async () => {
      const { listHabitsForUser } = await import('./db')
      const habits = await listHabitsForUser(testUserId)

      expect(habits).toHaveLength(0)
    })
  })

  describe('findHabitById', () => {
    it('should find an existing habit', async () => {
      const { createHabitForUser, findHabitById } = await import('./db')
      
      const created = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      const found = await findHabitById(testUserId, created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.title).toBe('Test Habit')
    })

    it('should return null for non-existent habit', async () => {
      const { findHabitById } = await import('./db')
      const found = await findHabitById(testUserId, 999)

      expect(found).toBeNull()
    })

    it('should return null if habit belongs to different user', async () => {
      const { createHabitForUser, findHabitById, insertUser } = await import('./db')
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Create another user
      const otherUser = await insertUser({
        email: 'other@example.com',
        passwordHash: 'hash'
      })

      const found = await findHabitById(otherUser.id, habit.id)

      expect(found).toBeNull()
    })
  })

  describe('updateHabitForUser', () => {
    it('should update habit fields', async () => {
      const { createHabitForUser, updateHabitForUser } = await import('./db')
      
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
    })

    it('should return null if no fields to update', async () => {
      const { createHabitForUser, updateHabitForUser } = await import('./db')
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      const updated = await updateHabitForUser(testUserId, habit.id, {})

      expect(updated).toBeNull()
    })

    it('should return null for non-existent habit', async () => {
      const { updateHabitForUser } = await import('./db')
      
      const updated = await updateHabitForUser(testUserId, 999, {
        title: 'New Title'
      })

      expect(updated).toBeNull()
    })
  })

  describe('deleteHabitForUser', () => {
    it('should delete a habit', async () => {
      const { createHabitForUser, deleteHabitForUser, findHabitById } = await import('./db')
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      await deleteHabitForUser(testUserId, habit.id)

      const found = await findHabitById(testUserId, habit.id)
      expect(found).toBeNull()
    })

    it('should not delete habit belonging to different user', async () => {
      const { createHabitForUser, deleteHabitForUser, findHabitById, insertUser } = await import('./db')
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // Create another user
      const otherUser = await insertUser({
        email: 'other@example.com',
        passwordHash: 'hash'
      })

      // Try to delete with wrong user ID
      await deleteHabitForUser(otherUser.id, habit.id)

      // Habit should still exist
      const found = await findHabitById(testUserId, habit.id)
      expect(found).toBeDefined()
    })
  })

  describe('completeHabitForUser', () => {
    it('should complete a habit and set streak to 1 for first completion', async () => {
      const { createHabitForUser, completeHabitForUser, countHabitCompletions } = await import('./db')
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      const completed = await completeHabitForUser(testUserId, habit.id)

      expect(completed).toBeDefined()
      expect(completed?.streak).toBe(1)
      expect(completed?.completed_today).toBe(1)
      expect(completed?.last_completed).toBeDefined()
      
      // Verify completion record was created
      const count = await countHabitCompletions(habit.id, testUserId)
      expect(count).toBe(1)
    })

    it('should keep streak when completing same day', async () => {
      const { createHabitForUser, completeHabitForUser } = await import('./db')
      
      const habit = await createHabitForUser(testUserId, {
        title: 'Test Habit',
        description: 'Test Description'
      })

      // First completion
      await completeHabitForUser(testUserId, habit.id)
      
      // Second completion same day
      const completed = await completeHabitForUser(testUserId, habit.id)

      expect(completed?.streak).toBe(1) // Should stay at 1
    })

    it('should return null for non-existent habit', async () => {
      const { completeHabitForUser } = await import('./db')
      
      const completed = await completeHabitForUser(testUserId, 999)

      expect(completed).toBeNull()
    })
  })

  describe('refreshHabitCompletionStatus', () => {
    it('should clear completed_today when last_completed is before today', async () => {
      const { createHabitForUser, refreshHabitCompletionStatus, findHabitById } = await import('./db')

      const habit = await createHabitForUser(testUserId, {
        title: 'Old Completion Habit',
        description: 'Completed yesterday'
      })

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const db = getDatabase()
      db.prepare('UPDATE habits SET completed_today = 1, last_completed = ? WHERE id = ?')
        .run(yesterdayStr, habit.id)

      await refreshHabitCompletionStatus(testUserId)
      const updated = await findHabitById(testUserId, habit.id)

      expect(updated?.completed_today).toBe(0)
    })

    it('should mark completed_today when last_completed is today', async () => {
      const { createHabitForUser, refreshHabitCompletionStatus, findHabitById } = await import('./db')

      const habit = await createHabitForUser(testUserId, {
        title: 'Today Completion Habit',
        description: 'Completed today'
      })

      const todayStr = new Date().toISOString().split('T')[0]
      const db = getDatabase()
      db.prepare('UPDATE habits SET completed_today = 0, last_completed = ? WHERE id = ?')
        .run(todayStr, habit.id)

      await refreshHabitCompletionStatus(testUserId)
      const updated = await findHabitById(testUserId, habit.id)

      expect(updated?.completed_today).toBe(1)
    })
  })
})

describe('Habit Completions Table Operations', () => {
  let testUserId: number
  let testHabitId: number

  beforeEach(async () => {
    // Create a test user and habit for each test
    const { insertUser, createHabitForUser } = await import('./db')
    
    const user = await insertUser({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User'
    })
    testUserId = user.id
    
    const habit = await createHabitForUser(testUserId, {
      title: 'Test Habit',
      description: 'Test Description',
      category: 'health'
    })
    testHabitId = habit.id
  })

  describe('recordHabitCompletion', () => {
    it('should record a habit completion', async () => {
      const { recordHabitCompletion } = await import('./db')
      
      const completion = await recordHabitCompletion(testUserId, testHabitId)

      expect(completion).toBeDefined()
      expect(completion.id).toBeGreaterThan(0)
      expect(completion.habit_id).toBe(testHabitId)
      expect(completion.user_id).toBe(testUserId)
      expect(completion.completed_at).toBeDefined()
      expect(completion.created_at).toBeDefined()
    })
  })

  describe('getHabitCompletions', () => {
    it('should get all completions for a habit', async () => {
      const { recordHabitCompletion, getHabitCompletions } = await import('./db')
      
      // Record multiple completions
      await recordHabitCompletion(testUserId, testHabitId)
      await recordHabitCompletion(testUserId, testHabitId)
      await recordHabitCompletion(testUserId, testHabitId)

      const completions = await getHabitCompletions(testHabitId, testUserId)

      expect(completions).toHaveLength(3)
      expect(completions[0].habit_id).toBe(testHabitId)
      expect(completions[0].user_id).toBe(testUserId)
    })

    it('should return empty array for habit with no completions', async () => {
      const { getHabitCompletions } = await import('./db')
      
      const completions = await getHabitCompletions(testHabitId, testUserId)

      expect(completions).toHaveLength(0)
    })
  })

  describe('countHabitCompletions', () => {
    it('should count completions correctly', async () => {
      const { recordHabitCompletion, countHabitCompletions } = await import('./db')
      
      // Record multiple completions
      await recordHabitCompletion(testUserId, testHabitId)
      await recordHabitCompletion(testUserId, testHabitId)

      const count = await countHabitCompletions(testHabitId, testUserId)

      expect(count).toBe(2)
    })

    it('should return 0 for habit with no completions', async () => {
      const { countHabitCompletions } = await import('./db')
      
      const count = await countHabitCompletions(testHabitId, testUserId)

      expect(count).toBe(0)
    })
  })

  describe('getCompletionHistoryForUser', () => {
    it('should get completion history with habit details', async () => {
      const { recordHabitCompletion, getCompletionHistoryForUser } = await import('./db')
      
      // Record a completion
      await recordHabitCompletion(testUserId, testHabitId)

      const history = await getCompletionHistoryForUser(testUserId)

      expect(history).toHaveLength(1)
      expect(history[0].habit_id).toBe(testHabitId)
      expect(history[0].habit_title).toBe('Test Habit')
      expect(history[0].habit_description).toBe('Test Description')
      expect(history[0].habit_category).toBe('health')
    })

    it('should respect limit parameter', async () => {
      const { recordHabitCompletion, getCompletionHistoryForUser } = await import('./db')
      
      // Record multiple completions
      await recordHabitCompletion(testUserId, testHabitId)
      await recordHabitCompletion(testUserId, testHabitId)
      await recordHabitCompletion(testUserId, testHabitId)

      const history = await getCompletionHistoryForUser(testUserId, 2)

      expect(history).toHaveLength(2)
    })
  })
})
