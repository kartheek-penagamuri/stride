import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

let db: Database.Database | null = null
let isInitialized = false
const DEFAULT_DB_FILENAME = process.env.SQLITE_DB_FILENAME || 'stride.db'
const DB_FILE_PATH = resolveDatabaseFilePath()

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * SQLite error code constants
 */
export const ERROR_CODES = {
  UNIQUE_CONSTRAINT: 'SQLITE_CONSTRAINT_UNIQUE',
  FOREIGN_KEY: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  NOT_NULL: 'SQLITE_CONSTRAINT_NOTNULL',
  FILE_ACCESS: 'SQLITE_CANTOPEN',
  LOCKED: 'SQLITE_BUSY',
  CONSTRAINT: 'SQLITE_CONSTRAINT',
  UNKNOWN: 'SQLITE_ERROR'
} as const

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  DUPLICATE_EMAIL: 'An account with this email already exists',
  INVALID_USER: 'User not found',
  INVALID_HABIT: 'Habit not found',
  FOREIGN_KEY_VIOLATION: 'Referenced record does not exist',
  DATABASE_LOCKED: 'Database is temporarily locked, please try again',
  FILE_ACCESS: 'Unable to access database file',
  NOT_NULL_VIOLATION: 'Required field is missing',
  CONSTRAINT_VIOLATION: 'Database constraint violation'
} as const

function resolveDatabaseFilePath(): string {
  if (process.env.SQLITE_DB_PATH) {
    return resolveWorkspacePath(process.env.SQLITE_DB_PATH)
  }

  if (process.env.SQLITE_DB_DIRECTORY) {
    return path.join(resolveWorkspacePath(process.env.SQLITE_DB_DIRECTORY), DEFAULT_DB_FILENAME)
  }

  const defaultDirectory = process.env.VERCEL ? '/tmp' : process.cwd()
  return path.join(defaultDirectory, DEFAULT_DB_FILENAME)
}

function resolveWorkspacePath(targetPath: string): string {
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath)
}

function ensureDatabaseDirectoryExists(): void {
  const directory = path.dirname(DB_FILE_PATH)
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }
}

export function getDatabaseFilePath(): string {
  return DB_FILE_PATH
}

/**
 * Map SQLite errors to DatabaseError with descriptive messages
 * @param error The original error from SQLite
 * @param context Additional context about the operation
 * @returns DatabaseError with appropriate code and message
 */
function handleDatabaseError(error: unknown, context?: string): DatabaseError {
  const errorObject = error as { message?: unknown; code?: unknown }
  const errorMessage = typeof errorObject.message === 'string' ? errorObject.message : ''
  const errorCode = typeof errorObject.code === 'string' ? errorObject.code : ''
  const originalError = error instanceof Error ? error : undefined

  // Log the error for debugging
  console.error('Database error:', errorMessage || error, context ? `(${context})` : '')

  // Handle unique constraint violations
  if (errorCode === 'SQLITE_CONSTRAINT_UNIQUE' || errorMessage.includes('UNIQUE constraint failed')) {
    if (errorMessage.includes('users.email')) {
      return new DatabaseError(ERROR_MESSAGES.DUPLICATE_EMAIL, ERROR_CODES.UNIQUE_CONSTRAINT, originalError)
    }
    return new DatabaseError(ERROR_MESSAGES.CONSTRAINT_VIOLATION, ERROR_CODES.UNIQUE_CONSTRAINT, originalError)
  }

  // Handle foreign key violations
  if (errorCode === 'SQLITE_CONSTRAINT_FOREIGNKEY' || errorMessage.includes('FOREIGN KEY constraint failed')) {
    return new DatabaseError(ERROR_MESSAGES.FOREIGN_KEY_VIOLATION, ERROR_CODES.FOREIGN_KEY, originalError)
  }

  // Handle not null violations
  if (errorCode === 'SQLITE_CONSTRAINT_NOTNULL' || errorMessage.includes('NOT NULL constraint failed')) {
    return new DatabaseError(ERROR_MESSAGES.NOT_NULL_VIOLATION, ERROR_CODES.NOT_NULL, originalError)
  }

  // Handle general constraint violations
  if (errorCode === 'SQLITE_CONSTRAINT' || errorMessage.includes('constraint')) {
    return new DatabaseError(ERROR_MESSAGES.CONSTRAINT_VIOLATION, ERROR_CODES.CONSTRAINT, originalError)
  }

  // Handle database locked errors
  if (errorCode === 'SQLITE_BUSY' || errorMessage.includes('database is locked')) {
    return new DatabaseError(ERROR_MESSAGES.DATABASE_LOCKED, ERROR_CODES.LOCKED, originalError)
  }

  // Handle file access errors
  if (errorCode === 'SQLITE_CANTOPEN' || errorMessage.includes('unable to open database')) {
    return new DatabaseError(ERROR_MESSAGES.FILE_ACCESS, ERROR_CODES.FILE_ACCESS, originalError)
  }

  // Default error
  return new DatabaseError(errorMessage || 'Database operation failed', ERROR_CODES.UNKNOWN, originalError)
}

/**
 * Initialize database schema by creating all required tables
 * This function is called automatically on first database access
 */
function initializeDatabase(): void {
  if (isInitialized) {
    return
  }

  try {
    // Directly create tables without calling the async wrapper functions
    // to avoid circular dependency with getDatabase()

    // Create users table
    db!.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run()

    db!.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run()

    // Create habits table
    db!.prepare(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        streak INTEGER NOT NULL DEFAULT 0,
        completed_today INTEGER NOT NULL DEFAULT 0,
        last_completed TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run()

    db!.prepare(`CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)`).run()

    // Create habit_completions table
    db!.prepare(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        completed_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run()

    db!.prepare(`CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON habit_completions(habit_id)`).run()
    db!.prepare(`CREATE INDEX IF NOT EXISTS idx_completions_user_id ON habit_completions(user_id)`).run()
    db!.prepare(`CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON habit_completions(completed_at)`).run()

    isInitialized = true

    // Log successful initialization
    console.log('Database schema initialized successfully')
  } catch (error) {
    throw handleDatabaseError(error, 'initializeDatabase')
  }
}

/**
 * Get the singleton SQLite database instance
 * Initializes the database file and enables foreign key constraints
 * Ensures tables exist before any operations
 */
export function getDatabase(): Database.Database {
  if (!db) {
    try {
      // Initialize SQLite database file
      ensureDatabaseDirectoryExists()
      db = new Database(DB_FILE_PATH)

      // Enable foreign key constraints
      db.pragma('foreign_keys = ON')

      console.log(`SQLite database initialized: ${DB_FILE_PATH}`)

      // Call initializeDatabase() on first getDatabase() call
      // Ensure tables exist before any operations
      initializeDatabase()
    } catch (error) {
      throw handleDatabaseError(error, 'getDatabase')
    }
  }

  return db
}

/**
 * Close the database connection (primarily for testing)
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    isInitialized = false
  }
}

/**
 * Execute a query that returns multiple rows
 * @param sql SQL query with ? placeholders
 * @param params Parameters to bind to the query
 * @returns Array of result rows
 */
export function query<T = unknown>(sql: string, params?: unknown[]): T[] {
  try {
    const database = getDatabase()
    const stmt = database.prepare(sql)
    return stmt.all(params || []) as T[]
  } catch (error) {
    throw handleDatabaseError(error, 'query')
  }
}

/**
 * Execute a query that returns a single row
 * @param sql SQL query with ? placeholders
 * @param params Parameters to bind to the query
 * @returns Single result row or undefined
 */
export function get<T = unknown>(sql: string, params?: unknown[]): T | undefined {
  try {
    const database = getDatabase()
    const stmt = database.prepare(sql)
    return stmt.get(params || []) as T | undefined
  } catch (error) {
    throw handleDatabaseError(error, 'get')
  }
}

/**
 * Execute a write operation (INSERT, UPDATE, DELETE)
 * @param sql SQL query with ? placeholders
 * @param params Parameters to bind to the query
 * @returns Object with lastID and changes count
 */
export function run(sql: string, params?: unknown[]): { lastID: number; changes: number } {
  try {
    const database = getDatabase()
    const stmt = database.prepare(sql)
    const info = stmt.run(params || [])
    return {
      lastID: Number(info.lastInsertRowid),
      changes: info.changes
    }
  } catch (error) {
    throw handleDatabaseError(error, 'run')
  }
}

export async function ensureUsersTable() {
  try {
    run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
  } catch (error) {
    throw handleDatabaseError(error, 'ensureUsersTable')
  }
}

export type DbUser = {
  id: number
  email: string
  name: string | null
  password_hash: string
  created_at: Date | string
}

export type DbHabit = {
  id: number
  user_id: number
  title: string
  description: string
  category: string
  streak: number
  completed_today: number // SQLite stores boolean as 0/1
  last_completed: string | null
  created_at: Date | string
  updated_at: Date | string
}

export type DbHabitCompletion = {
  id: number
  habit_id: number
  user_id: number
  completed_at: string
  created_at: string
}

export type DbHabitCompletionWithDetails = DbHabitCompletion & {
  habit_title: string
  habit_description: string
  habit_category: string
}

/**
 * Find a user by email address
 * @param email Email address to search for (will be converted to lowercase)
 * @returns User object or null if not found
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const normalizedEmail = email.toLowerCase()
    const user = get<DbUser>('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
    return user || null
  } catch (error) {
    throw handleDatabaseError(error, 'findUserByEmail')
  }
}

/**
 * Insert a new user into the database
 * @param params User data including email, passwordHash, and optional name
 * @returns The inserted user object
 */
export async function insertUser(params: { email: string; passwordHash: string; name?: string }): Promise<DbUser> {
  try {
    const normalizedEmail = params.email.toLowerCase()

    // Insert the user
    const result = run(
      `INSERT INTO users (email, password_hash, name)
       VALUES (?, ?, ?)`,
      [normalizedEmail, params.passwordHash, params.name || null]
    )

    // Get the inserted user using last_insert_rowid()
    const insertedUser = get<DbUser>('SELECT * FROM users WHERE id = ?', [result.lastID])

    if (!insertedUser) {
      throw new DatabaseError('Failed to retrieve inserted user', ERROR_CODES.UNKNOWN)
    }

    return insertedUser
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw handleDatabaseError(error, 'insertUser')
  }
}

/**
 * Create the habits table if it doesn't exist
 * Includes foreign key constraint on user_id with CASCADE DELETE
 */
export async function ensureHabitsTable() {
  try {
    run(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        streak INTEGER NOT NULL DEFAULT 0,
        completed_today INTEGER NOT NULL DEFAULT 0,
        last_completed TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    run(`CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)`)
  } catch (error) {
    throw handleDatabaseError(error, 'ensureHabitsTable')
  }
}

/**
 * Create the habit_completions table if it doesn't exist
 * Includes foreign key constraints on habit_id and user_id with CASCADE DELETE
 */
export async function ensureHabitCompletionsTable() {
  try {
    run(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        completed_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    run(`CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON habit_completions(habit_id)`)
    run(`CREATE INDEX IF NOT EXISTS idx_completions_user_id ON habit_completions(user_id)`)
    run(`CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON habit_completions(completed_at)`)
  } catch (error) {
    throw handleDatabaseError(error, 'ensureHabitCompletionsTable')
  }
}

/**
 * List all habits for a user
 * @param userId User ID to query habits for
 * @returns Array of habits ordered by created_at DESC
 */
export async function listHabitsForUser(userId: number): Promise<DbHabit[]> {
  try {
    return query<DbHabit>(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
  } catch (error) {
    throw handleDatabaseError(error, 'listHabitsForUser')
  }
}

/**
 * Find a specific habit by ID and user ID
 * @param userId User ID who owns the habit
 * @param habitId Habit ID to find
 * @returns Habit object or null if not found
 */
export async function findHabitById(userId: number, habitId: number): Promise<DbHabit | null> {
  try {
    const habit = get<DbHabit>(
      'SELECT * FROM habits WHERE id = ? AND user_id = ? LIMIT 1',
      [habitId, userId]
    )
    return habit || null
  } catch (error) {
    throw handleDatabaseError(error, 'findHabitById')
  }
}

/**
 * Create a new habit for a user
 * @param userId User ID who owns the habit
 * @param params Habit data including title, description, and optional category
 * @returns The created habit object
 */
export async function createHabitForUser(
  userId: number,
  params: { title: string; description: string; category?: string }
): Promise<DbHabit> {
  try {
    // Insert the habit
    const result = run(
      `INSERT INTO habits (user_id, title, description, category)
       VALUES (?, ?, ?, ?)`,
      [userId, params.title, params.description, params.category || 'general']
    )

    // Get the inserted habit using last_insert_rowid()
    const insertedHabit = get<DbHabit>('SELECT * FROM habits WHERE id = ?', [result.lastID])

    if (!insertedHabit) {
      throw new DatabaseError('Failed to retrieve inserted habit', ERROR_CODES.UNKNOWN)
    }

    return insertedHabit
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw handleDatabaseError(error, 'createHabitForUser')
  }
}

/**
 * Update a habit for a user
 * @param userId User ID who owns the habit
 * @param habitId Habit ID to update
 * @param params Fields to update (title, description, category)
 * @returns Updated habit object or null if not found
 */
export async function updateHabitForUser(
  userId: number,
  habitId: number,
  params: { title?: string; description?: string; category?: string }
): Promise<DbHabit | null> {
  try {
    const updates: string[] = []
    const values: Array<string | number> = []

    if (params.title !== undefined) {
      updates.push('title = ?')
      values.push(params.title)
    }
    if (params.description !== undefined) {
      updates.push('description = ?')
      values.push(params.description)
    }
    if (params.category !== undefined) {
      updates.push('category = ?')
      values.push(params.category)
    }

    if (updates.length === 0) {
      return null
    }

    // Always update updated_at
    updates.push("updated_at = datetime('now')")

    // Add WHERE clause parameters
    values.push(userId, habitId)

    // Execute update
    run(
      `UPDATE habits
       SET ${updates.join(', ')}
       WHERE user_id = ? AND id = ?`,
      values
    )

    // Get the updated habit
    return findHabitById(userId, habitId)
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw handleDatabaseError(error, 'updateHabitForUser')
  }
}

/**
 * Delete a habit for a user
 * @param userId User ID who owns the habit
 * @param habitId Habit ID to delete
 */
export async function deleteHabitForUser(userId: number, habitId: number): Promise<void> {
  try {
    run('DELETE FROM habits WHERE user_id = ? AND id = ?', [userId, habitId])
  } catch (error) {
    throw handleDatabaseError(error, 'deleteHabitForUser')
  }
}

/**
 * Record a habit completion
 * @param userId User ID who completed the habit
 * @param habitId Habit ID that was completed
 * @returns The created completion record
 */
export async function recordHabitCompletion(
  userId: number,
  habitId: number
): Promise<DbHabitCompletion> {
  try {
    // Insert the completion record
    const result = run(
      `INSERT INTO habit_completions (habit_id, user_id)
       VALUES (?, ?)`,
      [habitId, userId]
    )

    // Get the inserted completion using last_insert_rowid()
    const insertedCompletion = get<DbHabitCompletion>(
      'SELECT * FROM habit_completions WHERE id = ?',
      [result.lastID]
    )

    if (!insertedCompletion) {
      throw new DatabaseError('Failed to retrieve inserted completion', ERROR_CODES.UNKNOWN)
    }

    return insertedCompletion
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw handleDatabaseError(error, 'recordHabitCompletion')
  }
}

/**
 * Get all completions for a specific habit
 * @param habitId Habit ID to query completions for
 * @param userId User ID who owns the habit
 * @returns Array of completions ordered by completed_at DESC
 */
export async function getHabitCompletions(
  habitId: number,
  userId: number
): Promise<DbHabitCompletion[]> {
  try {
    return query<DbHabitCompletion>(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND user_id = ? ORDER BY completed_at DESC',
      [habitId, userId]
    )
  } catch (error) {
    throw handleDatabaseError(error, 'getHabitCompletions')
  }
}

/**
 * Get completions for a habit within a date range
 * @param habitId Habit ID to query completions for
 * @param userId User ID who owns the habit
 * @param startDate Start date in ISO format (YYYY-MM-DD HH:MM:SS)
 * @param endDate End date in ISO format (YYYY-MM-DD HH:MM:SS)
 * @returns Array of completions within the date range ordered by completed_at DESC
 */
export async function getHabitCompletionsInRange(
  habitId: number,
  userId: number,
  startDate: string,
  endDate: string
): Promise<DbHabitCompletion[]> {
  try {
    return query<DbHabitCompletion>(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_at BETWEEN ? AND ? ORDER BY completed_at DESC',
      [habitId, userId, startDate, endDate]
    )
  } catch (error) {
    throw handleDatabaseError(error, 'getHabitCompletionsInRange')
  }
}

/**
 * Count total completions for a habit
 * @param habitId Habit ID to count completions for
 * @param userId User ID who owns the habit
 * @returns Number of completions
 */
export async function countHabitCompletions(
  habitId: number,
  userId: number
): Promise<number> {
  try {
    const result = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM habit_completions WHERE habit_id = ? AND user_id = ?',
      [habitId, userId]
    )

    return result?.count || 0
  } catch (error) {
    throw handleDatabaseError(error, 'countHabitCompletions')
  }
}

/**
 * Get completion history for a user with habit details
 * @param userId User ID to query completion history for
 * @param limit Optional limit on number of results
 * @returns Array of completions with habit details ordered by completed_at DESC
 */
export async function getCompletionHistoryForUser(
  userId: number,
  limit?: number
): Promise<DbHabitCompletionWithDetails[]> {
  try {
    const sql = `
      SELECT 
        hc.id,
        hc.habit_id,
        hc.user_id,
        hc.completed_at,
        hc.created_at,
        h.title as habit_title,
        h.description as habit_description,
        h.category as habit_category
      FROM habit_completions hc
      JOIN habits h ON hc.habit_id = h.id
      WHERE hc.user_id = ?
      ORDER BY hc.completed_at DESC
      ${limit ? 'LIMIT ?' : ''}
    `

    const params = limit ? [userId, limit] : [userId]
    return query<DbHabitCompletionWithDetails>(sql, params)
  } catch (error) {
    throw handleDatabaseError(error, 'getCompletionHistoryForUser')
  }
}

/**
 * Complete a habit for a user with streak calculation
 * @param userId User ID who is completing the habit
 * @param habitId Habit ID to complete
 * @returns Updated habit object or null if not found
 */
export async function completeHabitForUser(
  userId: number,
  habitId: number
): Promise<DbHabit | null> {
  try {
    const database = getDatabase()

    // Use transaction to ensure atomicity
    const transaction = database.transaction(() => {
      // Get existing habit by id and user_id
      const existing = get<DbHabit>(
        'SELECT * FROM habits WHERE id = ? AND user_id = ? LIMIT 1',
        [habitId, userId]
      )

      if (!existing) {
        return null
      }

      // Calculate today's date in YYYY-MM-DD format
      const today = new Date()
      const todayDateString = today.toISOString().slice(0, 10)

      // Determine new streak based on last_completed date
      let newStreak = 1

      if (existing.last_completed === todayDateString) {
        // If last_completed is today: keep current streak
        newStreak = existing.streak
      } else if (existing.last_completed) {
        // Parse the last_completed date
        const lastDate = new Date(existing.last_completed + 'T00:00:00')
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          // If last_completed is yesterday: increment streak
          newStreak = existing.streak + 1
        }
        // Otherwise: reset streak to 1 (already set above)
      }
      // If last_completed is null: reset streak to 1 (already set above)

      // Update habit with new streak, completed_today=1, last_completed=today
      run(
        `UPDATE habits
         SET completed_today = 1,
             streak = ?,
             last_completed = ?,
             updated_at = datetime('now')
         WHERE user_id = ? AND id = ?`,
        [newStreak, todayDateString, userId, habitId]
      )

      // Call recordHabitCompletion() to create completion record
      run(
        `INSERT INTO habit_completions (habit_id, user_id)
         VALUES (?, ?)`,
        [habitId, userId]
      )

      // Return updated DbHabit
      const updatedHabit = get<DbHabit>(
        'SELECT * FROM habits WHERE id = ? AND user_id = ? LIMIT 1',
        [habitId, userId]
      )

      return updatedHabit || null
    })

    // Execute the transaction
    return transaction()
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw handleDatabaseError(error, 'completeHabitForUser')
  }
}
