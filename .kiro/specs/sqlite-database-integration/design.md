# Design Document: SQLite Database Integration

## Overview

This feature migrates the application's database layer from PostgreSQL to SQLite, providing a lightweight, file-based database solution that eliminates the need for external database infrastructure. The migration maintains all existing functionality including user authentication, habit CRUD operations, streak tracking, and completion history while introducing a new habit_completions table for detailed progress tracking.

SQLite is an ideal choice for this application because it:
- Requires no separate server process or configuration
- Stores all data in a single file that's easy to back up
- Provides full SQL support with ACID compliance
- Handles concurrent access through built-in locking
- Has zero configuration and works out of the box

The design maintains backward compatibility with existing API function signatures, ensuring that no changes are required to the application layer or API routes.

## Architecture

### High-Level Architecture

```
Application Layer (API Routes, Components)
           ↓
    Database Layer (lib/db.ts)
           ↓
    SQLite Database (stride.db)
```

### Database Layer Responsibilities

1. **Connection Management**: Initialize and manage SQLite database connections
2. **Schema Management**: Create and maintain database tables and indexes
3. **Query Execution**: Execute parameterized queries with proper error handling
4. **Data Transformation**: Convert between database rows and application types
5. **Transaction Management**: Handle atomic operations for complex updates

### Migration Strategy

The migration follows these principles:
- **Drop-in replacement**: Same function signatures as PostgreSQL implementation
- **Enhanced tracking**: Add habit_completions table for detailed history
- **Syntax conversion**: Replace PostgreSQL-specific syntax with SQLite equivalents
- **Automatic initialization**: Create database and tables on first run

## Components and Interfaces

### Database Connection Module

**Location**: `lib/db.ts`

**Core Functions**:

```typescript
// Initialize database and create tables
function initializeDatabase(): Promise<void>

// Get database connection
function getDatabase(): Database

// Execute query with parameters
function query<T>(sql: string, params?: any[]): Promise<T[]>

// Execute single-row query
function get<T>(sql: string, params?: any[]): Promise<T | undefined>

// Execute write operation
function run(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }>
```

### User Management Functions

```typescript
// Ensure users table exists
export async function ensureUsersTable(): Promise<void>

// Find user by email
export async function findUserByEmail(email: string): Promise<DbUser | null>

// Insert new user
export async function insertUser(params: {
  email: string
  passwordHash: string
  name?: string
}): Promise<DbUser>
```

### Habit Management Functions

```typescript
// Ensure habits table exists
export async function ensureHabitsTable(): Promise<void>

// List all habits for a user
export async function listHabitsForUser(userId: number): Promise<DbHabit[]>

// Find specific habit
export async function findHabitById(
  userId: number,
  habitId: number
): Promise<DbHabit | null>

// Create new habit
export async function createHabitForUser(
  userId: number,
  params: { title: string; description: string; category?: string }
): Promise<DbHabit>

// Update habit
export async function updateHabitForUser(
  userId: number,
  habitId: number,
  params: { title?: string; description?: string; category?: string }
): Promise<DbHabit | null>

// Delete habit
export async function deleteHabitForUser(
  userId: number,
  habitId: number
): Promise<void>

// Complete habit (update streak and last_completed)
export async function completeHabitForUser(
  userId: number,
  habitId: number
): Promise<DbHabit | null>
```

### Completion Tracking Functions (New)

```typescript
// Ensure habit_completions table exists
export async function ensureHabitCompletionsTable(): Promise<void>

// Record a habit completion
export async function recordHabitCompletion(
  userId: number,
  habitId: number
): Promise<DbHabitCompletion>

// Get all completions for a habit
export async function getHabitCompletions(
  habitId: number,
  userId: number
): Promise<DbHabitCompletion[]>

// Get completions within date range
export async function getHabitCompletionsInRange(
  habitId: number,
  userId: number,
  startDate: string,
  endDate: string
): Promise<DbHabitCompletion[]>

// Count total completions for a habit
export async function countHabitCompletions(
  habitId: number,
  userId: number
): Promise<number>

// Get completion history with habit details
export async function getCompletionHistoryForUser(
  userId: number,
  limit?: number
): Promise<DbHabitCompletionWithDetails[]>
```

## Data Models

### Database Schema

#### Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### Habits Table

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
```

#### Habit Completions Table (New)

```sql
CREATE TABLE IF NOT EXISTS habit_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON habit_completions(completed_at);
```

### TypeScript Types

```typescript
export type DbUser = {
  id: number
  email: string
  name: string | null
  password_hash: string
  created_at: string
}

export type DbHabit = {
  id: number
  user_id: number
  title: string
  description: string
  category: string
  streak: number
  completed_today: number // SQLite uses 0/1 for boolean
  last_completed: string | null
  created_at: string
  updated_at: string
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
```

### Key Differences from PostgreSQL

1. **Boolean Values**: SQLite uses INTEGER (0/1) instead of BOOLEAN
2. **Timestamps**: Use TEXT with ISO 8601 format instead of TIMESTAMPTZ
3. **Auto-increment**: Use INTEGER PRIMARY KEY AUTOINCREMENT instead of SERIAL
4. **Placeholders**: Use ? instead of $1, $2, $3 for parameters
5. **RETURNING**: Not supported; use last_insert_rowid() and SELECT instead
6. **Foreign Keys**: Must be explicitly enabled with PRAGMA foreign_keys = ON

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Function signature compatibility
*For any* existing database function call in the application, the SQLite implementation should accept the same parameters and return the same type structure as the PostgreSQL implementation
**Validates: Requirements 1.3**

### Property 2: Email uniqueness enforcement
*For any* two user registration attempts with the same email address (case-insensitive), the second attempt should be rejected with a unique constraint error
**Validates: Requirements 2.2**

### Property 3: Email lowercase normalization
*For any* email address with mixed case characters, when stored in the database, it should be converted to lowercase
**Validates: Requirements 2.4**

### Property 4: Timestamp format consistency
*For any* database record with timestamp fields (created_at, updated_at, completed_at), the stored value should match the ISO 8601 format pattern (YYYY-MM-DD HH:MM:SS)
**Validates: Requirements 2.5, 4.5**

### Property 5: Foreign key enforcement for habits
*For any* attempt to create a habit with a non-existent user_id, the operation should be rejected with a foreign key constraint error
**Validates: Requirements 3.2**

### Property 6: Cascade deletion of habits
*For any* user with associated habits, when the user is deleted, all their habits should also be deleted automatically
**Validates: Requirements 3.3**

### Property 7: Date format consistency
*For any* habit with a last_completed value, the stored date should match the YYYY-MM-DD format pattern
**Validates: Requirements 3.4**

### Property 8: Default values for new habits
*For any* newly created habit without explicit streak or completed_today values, the habit should have streak = 0 and completed_today = 0
**Validates: Requirements 3.5**

### Property 9: Completion record creation
*For any* habit completion action, a new row should be inserted into the habit_completions table with the current timestamp
**Validates: Requirements 4.2**

### Property 10: Foreign key enforcement for completions
*For any* attempt to create a completion with a non-existent habit_id or user_id, the operation should be rejected with a foreign key constraint error
**Validates: Requirements 4.3**

### Property 11: Cascade deletion of completions
*For any* habit with associated completions, when the habit is deleted, all its completions should also be deleted automatically
**Validates: Requirements 4.4**

### Property 12: Consecutive day streak increment
*For any* habit completed on consecutive days (day N and day N+1), the streak should increment by 1 on the second completion
**Validates: Requirements 6.1**

### Property 13: Streak reset after gap
*For any* habit with a last_completed date more than 1 day in the past, when completed today, the streak should reset to 1
**Validates: Requirements 6.2**

### Property 14: Same-day completion idempotence
*For any* habit completed multiple times on the same day, the streak value should remain unchanged after the first completion
**Validates: Requirements 6.3**

### Property 15: Streak calculation correctness
*For any* habit with a last_completed date, the streak calculation should correctly determine whether to increment, reset, or maintain based on the date difference
**Validates: Requirements 6.4**

### Property 16: Descriptive error messages
*For any* database operation that fails, the thrown error should include a descriptive message indicating the type of failure
**Validates: Requirements 8.1**

### Property 17: Completion retrieval completeness
*For any* habit with N completions, querying all completions for that habit should return exactly N records
**Validates: Requirements 9.1**

### Property 18: Date range filtering accuracy
*For any* completion query with a date range [start, end], all returned completions should have completed_at timestamps within that range
**Validates: Requirements 9.2**

### Property 19: Completion count accuracy
*For any* habit, the count of completions should equal the number of rows in habit_completions for that habit_id
**Validates: Requirements 9.3**

### Property 20: Completion ordering consistency
*For any* completion query result, the records should be ordered by completed_at in descending order (most recent first)
**Validates: Requirements 9.4**

### Property 21: Completion history includes habit details
*For any* completion history query, each returned record should include the associated habit's title, description, and category
**Validates: Requirements 9.5**

## Error Handling

### Error Categories

1. **Constraint Violations**
   - Unique constraint (duplicate email)
   - Foreign key constraint (invalid user_id or habit_id)
   - Not null constraint (missing required fields)

2. **Database Errors**
   - File access errors (permissions, disk space)
   - Corruption errors
   - Lock timeout errors

3. **Query Errors**
   - Syntax errors (should not occur with parameterized queries)
   - Type mismatch errors

### Error Handling Strategy

```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Error codes
const ERROR_CODES = {
  UNIQUE_CONSTRAINT: 'SQLITE_CONSTRAINT_UNIQUE',
  FOREIGN_KEY: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  NOT_NULL: 'SQLITE_CONSTRAINT_NOTNULL',
  FILE_ACCESS: 'SQLITE_CANTOPEN',
  LOCKED: 'SQLITE_BUSY'
}
```

### Error Messages

```typescript
const ERROR_MESSAGES = {
  DUPLICATE_EMAIL: 'An account with this email already exists',
  INVALID_USER: 'User not found',
  INVALID_HABIT: 'Habit not found',
  FOREIGN_KEY_VIOLATION: 'Referenced record does not exist',
  DATABASE_LOCKED: 'Database is temporarily locked, please try again',
  FILE_ACCESS: 'Unable to access database file'
}
```

## Testing Strategy

### Unit Tests

1. **Schema Creation**
   - Test table creation with correct columns and types
   - Test index creation
   - Test foreign key constraint setup

2. **User Operations**
   - Test user insertion with valid data
   - Test duplicate email rejection
   - Test email lowercase conversion
   - Test user lookup by email

3. **Habit Operations**
   - Test habit creation with defaults
   - Test habit listing for user
   - Test habit update
   - Test habit deletion
   - Test foreign key enforcement

4. **Completion Tracking**
   - Test completion record creation
   - Test completion retrieval
   - Test date range filtering
   - Test completion counting
   - Test cascade deletion

5. **Streak Calculation**
   - Test consecutive day increment
   - Test gap reset
   - Test same-day idempotence
   - Test various date scenarios

### Property-Based Tests

Property-based testing will use the `fast-check` library for TypeScript to generate random test data and verify properties hold across many inputs.

**Configuration**:
- Minimum 100 iterations per property test
- Use custom generators for emails, dates, and habit data
- Seed tests for reproducibility

**Test Organization**:
- Property tests in `lib/db.test.ts`
- Each property test tagged with comment referencing design doc property number
- Use descriptive test names matching property descriptions

### Integration Tests

1. **End-to-End Flows**
   - User registration → habit creation → completion → streak tracking
   - Multiple users with isolated data
   - Concurrent operations

2. **Migration Validation**
   - Verify all existing API routes work with SQLite
   - Test authentication flow
   - Test habit CRUD operations
   - Test completion tracking

### Edge Cases

1. **Date Boundaries**
   - Completions at midnight
   - Timezone considerations
   - Leap years and month boundaries

2. **Concurrent Access**
   - Multiple simultaneous writes
   - Read during write operations

3. **Data Limits**
   - Very long habit titles/descriptions
   - Large number of habits per user
   - Large number of completions

## Implementation Notes

### SQLite Library Choice

Use `better-sqlite3` for Node.js:
- Synchronous API (simpler than async)
- Better performance than node-sqlite3
- Full TypeScript support
- Active maintenance

```typescript
import Database from 'better-sqlite3'

const db = new Database('stride.db')
db.pragma('foreign_keys = ON')
```

### Query Parameterization

Always use parameterized queries to prevent SQL injection:

```typescript
// Good
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// Bad - never do this
const user = db.prepare(`SELECT * FROM users WHERE email = '${email}'`).get()
```

### Transaction Support

Use transactions for operations that modify multiple tables:

```typescript
const completeHabit = db.transaction((userId: number, habitId: number) => {
  // Update habit streak and last_completed
  db.prepare('UPDATE habits SET streak = ?, last_completed = ? WHERE id = ?')
    .run(newStreak, today, habitId)
  
  // Insert completion record
  db.prepare('INSERT INTO habit_completions (habit_id, user_id) VALUES (?, ?)')
    .run(habitId, userId)
})

// Execute as atomic transaction
completeHabit(userId, habitId)
```

### Database Initialization

Initialize database on first import:

```typescript
let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database('stride.db')
    db.pragma('foreign_keys = ON')
    initializeSchema(db)
  }
  return db
}

function initializeSchema(db: Database.Database) {
  // Create tables if they don't exist
  ensureUsersTable()
  ensureHabitsTable()
  ensureHabitCompletionsTable()
}
```

## Performance Considerations

1. **Indexes**: Create indexes on foreign keys and frequently queried columns
2. **Prepared Statements**: Reuse prepared statements for repeated queries
3. **Transactions**: Batch multiple writes in transactions
4. **WAL Mode**: Consider enabling Write-Ahead Logging for better concurrency

```typescript
db.pragma('journal_mode = WAL')
```

## Security Considerations

1. **File Permissions**: Ensure database file has appropriate permissions (600)
2. **Parameterized Queries**: Always use parameterized queries
3. **Input Validation**: Validate all inputs before database operations
4. **Error Messages**: Don't expose internal database structure in error messages

## Migration Path

### For Existing PostgreSQL Users

1. **Export Data**: Create export script to dump PostgreSQL data to JSON
2. **Import Data**: Create import script to load JSON into SQLite
3. **Verification**: Compare record counts and sample data

### For New Installations

1. Database file created automatically on first run
2. No configuration required
3. Works immediately after `npm install`

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "fast-check": "^3.15.0"
  }
}
```

### Removed Dependencies

```json
{
  "dependencies": {
    "pg": "^8.16.3" // Remove
  }
}
```

## Future Enhancements

1. **Backup System**: Automated database backups
2. **Export/Import**: User data export to JSON/CSV
3. **Analytics**: Aggregate queries for habit statistics
4. **Optimization**: Query performance monitoring and optimization
5. **Cloud Sync**: Optional cloud backup integration
