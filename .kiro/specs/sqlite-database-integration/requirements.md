# Requirements Document

## Introduction

This feature migrates the application's database layer from PostgreSQL to SQLite to provide a lightweight, file-based database solution for account management, habit tracking, and progress check-ins. SQLite eliminates the need for external database servers while maintaining all existing functionality including user authentication, habit CRUD operations, and completion tracking.

## Glossary

- **Database Layer**: The abstraction layer that handles all database operations including connections, queries, and schema management
- **SQLite**: A lightweight, file-based relational database engine that requires no separate server process
- **Migration**: The process of converting database operations from PostgreSQL to SQLite
- **Schema**: The structure of database tables including columns, types, and constraints
- **User Account**: A registered user with email, password, and profile information
- **Habit**: A user-created or AI-generated habit with tracking information
- **Check-in**: A record of habit completion on a specific date
- **Progress Tracking**: Historical data showing habit completion patterns and streaks
- **Database Connection**: The mechanism for accessing and querying the SQLite database file

## Requirements

### Requirement 1

**User Story:** As a developer, I want to replace PostgreSQL with SQLite, so that the application can run without requiring external database infrastructure

#### Acceptance Criteria

1. THE Database Layer SHALL use SQLite instead of PostgreSQL for all database operations
2. THE Database Layer SHALL store data in a local file named 'stride.db' in the project root
3. THE Database Layer SHALL maintain backward compatibility with existing database function signatures
4. THE Database Layer SHALL initialize the database file automatically if it does not exist
5. THE Database Layer SHALL handle concurrent access safely using SQLite's built-in locking mechanisms

### Requirement 2

**User Story:** As a user, I want my account information stored securely in SQLite, so that I can register, log in, and maintain my profile

#### Acceptance Criteria

1. THE Database Layer SHALL create a users table with columns for id, email, password_hash, name, created_at, and updated_at
2. THE Database Layer SHALL enforce unique email addresses across all user accounts
3. THE Database Layer SHALL use INTEGER PRIMARY KEY for auto-incrementing user IDs
4. WHEN a user registers, THE Database Layer SHALL store the email in lowercase format
5. THE Database Layer SHALL store timestamps in ISO 8601 format (YYYY-MM-DD HH:MM:SS)

### Requirement 3

**User Story:** As a user, I want my habits stored in SQLite with all tracking information, so that I can manage and track my habits over time

#### Acceptance Criteria

1. THE Database Layer SHALL create a habits table with columns for id, user_id, title, description, category, streak, completed_today, last_completed, created_at, and updated_at
2. THE Database Layer SHALL enforce foreign key constraints linking habits to users
3. THE Database Layer SHALL cascade delete habits when a user account is deleted
4. THE Database Layer SHALL store the last_completed date in YYYY-MM-DD format
5. THE Database Layer SHALL default new habits to streak of 0 and completed_today of false

### Requirement 4

**User Story:** As a user, I want my habit completion history tracked in detail, so that I can see my progress patterns over time

#### Acceptance Criteria

1. THE Database Layer SHALL create a habit_completions table with columns for id, habit_id, user_id, completed_at, and created_at
2. THE Database Layer SHALL record each habit completion as a separate row with timestamp
3. THE Database Layer SHALL enforce foreign key constraints linking completions to both habits and users
4. THE Database Layer SHALL cascade delete completions when the associated habit is deleted
5. THE Database Layer SHALL store completion timestamps in ISO 8601 format

### Requirement 5

**User Story:** As a developer, I want all database queries converted to SQLite syntax, so that all existing functionality continues to work

#### Acceptance Criteria

1. THE Database Layer SHALL replace PostgreSQL-specific syntax with SQLite-compatible syntax
2. THE Database Layer SHALL use ? placeholders instead of $1, $2 for parameterized queries
3. THE Database Layer SHALL use AUTOINCREMENT for auto-incrementing primary keys
4. THE Database Layer SHALL use datetime('now') for current timestamp defaults
5. THE Database Layer SHALL handle RETURNING clauses by querying last_insert_rowid() and selecting the inserted row

### Requirement 6

**User Story:** As a user, I want my habit streaks calculated accurately, so that I can track my consistency

#### Acceptance Criteria

1. WHEN a user completes a habit, THE Database Layer SHALL increment the streak if completed on consecutive days
2. WHEN a user completes a habit after missing days, THE Database Layer SHALL reset the streak to 1
3. WHEN a user completes a habit multiple times in one day, THE Database Layer SHALL maintain the current streak without incrementing
4. THE Database Layer SHALL calculate streaks based on the last_completed date compared to today's date
5. THE Database Layer SHALL update both the streak and last_completed fields atomically

### Requirement 7

**User Story:** As a developer, I want database initialization to happen automatically, so that the application works immediately after setup

#### Acceptance Criteria

1. WHEN the application starts, THE Database Layer SHALL check if the database file exists
2. IF the database file does not exist, THEN THE Database Layer SHALL create it with all required tables
3. THE Database Layer SHALL enable foreign key constraints on every database connection
4. THE Database Layer SHALL create indexes on frequently queried columns (user_id, email)
5. THE Database Layer SHALL log successful database initialization

### Requirement 8

**User Story:** As a developer, I want proper error handling for database operations, so that failures are handled gracefully

#### Acceptance Criteria

1. WHEN a database operation fails, THE Database Layer SHALL throw descriptive error messages
2. THE Database Layer SHALL handle unique constraint violations with specific error messages
3. THE Database Layer SHALL handle foreign key violations with specific error messages
4. THE Database Layer SHALL close database connections properly on errors
5. THE Database Layer SHALL log all database errors for debugging

### Requirement 9

**User Story:** As a user, I want to query my habit completion history, so that I can analyze my progress patterns

#### Acceptance Criteria

1. THE Database Layer SHALL provide a function to retrieve all completions for a specific habit
2. THE Database Layer SHALL provide a function to retrieve completions within a date range
3. THE Database Layer SHALL provide a function to count total completions for a habit
4. THE Database Layer SHALL return completion data ordered by completed_at descending
5. THE Database Layer SHALL include habit details when querying completion history

### Requirement 10

**User Story:** As a developer, I want the SQLite database excluded from version control, so that user data remains private and local

#### Acceptance Criteria

1. THE Database Layer SHALL store the database file as 'stride.db' in the project root
2. THE project configuration SHALL include 'stride.db' in the .gitignore file
3. THE project configuration SHALL include '*.db' pattern in .gitignore to exclude all database files
4. THE Database Layer SHALL document the database file location in the README
5. THE Database Layer SHALL provide instructions for backing up the database file
