# Implementation Plan

- [x] 1. Set up SQLite dependencies and configuration




  - Install better-sqlite3 and type definitions
  - Install fast-check for property-based testing
  - Remove pg dependency from package.json
  - Update .gitignore to exclude stride.db and *.db files
  - _Requirements: 1.1, 1.2, 10.1, 10.2, 10.3_

- [x] 2. Create core database connection module



  - [x] 2.1 Implement getDatabase() function with singleton pattern



    - Initialize SQLite database file
    - Enable foreign key constraints with PRAGMA
    - Handle database file creation
    - _Requirements: 1.1, 1.2, 1.4, 7.1, 7.2, 7.3_
  
  - [x] 2.2 Implement query helper functions



    - Create query() function for multi-row results
    - Create get() function for single-row results
    - Create run() function for write operations
    - Convert parameter placeholders from $1, $2 to ?
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 2.3 Write property test for function signature compatibility
    - **Property 1: Function signature compatibility**
    - **Validates: Requirements 1.3**

- [x] 3. Implement users table and operations





  - [x] 3.1 Create ensureUsersTable() function

    - Create users table with INTEGER PRIMARY KEY AUTOINCREMENT
    - Add columns: id, email, password_hash, name, created_at, updated_at
    - Add UNIQUE constraint on email
    - Create index on email column
    - Use datetime('now') for timestamp defaults
    - _Requirements: 2.1, 2.2, 2.3, 5.3, 5.4, 7.4_
  
  - [x] 3.2 Implement findUserByEmail() function

    - Convert email to lowercase before query
    - Use parameterized query with ? placeholder
    - Return DbUser or null
    - _Requirements: 2.4, 5.2_
  
  - [x] 3.3 Implement insertUser() function

    - Convert email to lowercase before insert
    - Use parameterized INSERT query
    - Handle RETURNING clause with last_insert_rowid()
    - Return inserted DbUser
    - _Requirements: 2.4, 5.2, 5.5_
  
  - [ ]* 3.4 Write property test for email uniqueness
    - **Property 2: Email uniqueness enforcement**
    - **Validates: Requirements 2.2**
  
  - [ ]* 3.5 Write property test for email lowercase normalization
    - **Property 3: Email lowercase normalization**
    - **Validates: Requirements 2.4**
  
  - [ ]* 3.6 Write property test for timestamp format
    - **Property 4: Timestamp format consistency**
    - **Validates: Requirements 2.5, 4.5**

- [x] 4. Implement habits table and operations




  - [x] 4.1 Create ensureHabitsTable() function


    - Create habits table with INTEGER PRIMARY KEY AUTOINCREMENT
    - Add columns: id, user_id, title, description, category, streak, completed_today, last_completed, created_at, updated_at
    - Add FOREIGN KEY constraint on user_id with CASCADE DELETE
    - Set defaults: streak=0, completed_today=0, category='general'
    - Create index on user_id column
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 5.3, 7.4_
  
  - [x] 4.2 Implement listHabitsForUser() function


    - Query habits by user_id with ORDER BY created_at DESC
    - Return array of DbHabit
    - _Requirements: 3.1_
  
  - [x] 4.3 Implement findHabitById() function


    - Query habit by id and user_id
    - Return DbHabit or null
    - _Requirements: 3.1_
  
  - [x] 4.4 Implement createHabitForUser() function


    - Insert habit with user_id, title, description, category
    - Use last_insert_rowid() to get inserted id
    - Return inserted DbHabit
    - _Requirements: 3.1, 3.5, 5.5_
  
  - [x] 4.5 Implement updateHabitForUser() function


    - Build dynamic UPDATE query based on provided params
    - Update updated_at timestamp
    - Return updated DbHabit or null
    - _Requirements: 3.1_
  
  - [x] 4.6 Implement deleteHabitForUser() function


    - Delete habit by id and user_id
    - Cascade deletion handled by foreign key constraint
    - _Requirements: 3.3_
  
  - [ ]* 4.7 Write property test for foreign key enforcement
    - **Property 5: Foreign key enforcement for habits**
    - **Validates: Requirements 3.2**
  
  - [ ]* 4.8 Write property test for cascade deletion
    - **Property 6: Cascade deletion of habits**
    - **Validates: Requirements 3.3**
  
  - [ ]* 4.9 Write property test for date format
    - **Property 7: Date format consistency**
    - **Validates: Requirements 3.4**
  
  - [ ]* 4.10 Write property test for default values
    - **Property 8: Default values for new habits**
    - **Validates: Requirements 3.5**

- [x] 5. Implement habit completions table and operations



  - [x] 5.1 Create ensureHabitCompletionsTable() function


    - Create habit_completions table with INTEGER PRIMARY KEY AUTOINCREMENT
    - Add columns: id, habit_id, user_id, completed_at, created_at
    - Add FOREIGN KEY constraints on habit_id and user_id with CASCADE DELETE
    - Create indexes on habit_id, user_id, and completed_at
    - _Requirements: 4.1, 4.3, 4.4, 7.4_
  
  - [x] 5.2 Implement recordHabitCompletion() function



    - Insert completion record with habit_id, user_id, and current timestamp
    - Use last_insert_rowid() to get inserted id
    - Return inserted DbHabitCompletion
    - _Requirements: 4.2, 4.5_
  
  - [x] 5.3 Implement getHabitCompletions() function

    - Query completions by habit_id and user_id
    - Order by completed_at DESC
    - Return array of DbHabitCompletion
    - _Requirements: 9.1, 9.4_
  
  - [x] 5.4 Implement getHabitCompletionsInRange() function

    - Query completions by habit_id, user_id, and date range
    - Use WHERE completed_at BETWEEN ? AND ?
    - Order by completed_at DESC
    - Return array of DbHabitCompletion
    - _Requirements: 9.2, 9.4_
  
  - [x] 5.5 Implement countHabitCompletions() function

    - Query COUNT(*) for habit_id and user_id
    - Return number
    - _Requirements: 9.3_
  
  - [x] 5.6 Implement getCompletionHistoryForUser() function

    - JOIN habit_completions with habits table
    - Include habit title, description, and category
    - Order by completed_at DESC
    - Support optional limit parameter
    - Return array of DbHabitCompletionWithDetails
    - _Requirements: 9.5, 9.4_
  
  - [ ]* 5.7 Write property test for completion record creation
    - **Property 9: Completion record creation**
    - **Validates: Requirements 4.2**
  
  - [ ]* 5.8 Write property test for foreign key enforcement
    - **Property 10: Foreign key enforcement for completions**
    - **Validates: Requirements 4.3**
  
  - [ ]* 5.9 Write property test for cascade deletion
    - **Property 11: Cascade deletion of completions**
    - **Validates: Requirements 4.4**

- [x] 6. Implement streak calculation logic




  - [x] 6.1 Implement completeHabitForUser() function


    - Get existing habit by id and user_id
    - Calculate today's date in YYYY-MM-DD format
    - Determine new streak based on last_completed date:
      - If last_completed is today: keep current streak
      - If last_completed is yesterday: increment streak
      - Otherwise: reset streak to 1
    - Update habit with new streak, completed_today=1, last_completed=today
    - Call recordHabitCompletion() to create completion record
    - Use transaction to ensure atomicity
    - Return updated DbHabit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 6.2 Write property test for consecutive day streak
    - **Property 12: Consecutive day streak increment**
    - **Validates: Requirements 6.1**
  
  - [ ]* 6.3 Write property test for streak reset
    - **Property 13: Streak reset after gap**
    - **Validates: Requirements 6.2**
  
  - [ ]* 6.4 Write property test for same-day idempotence
    - **Property 14: Same-day completion idempotence**
    - **Validates: Requirements 6.3**
  
  - [ ]* 6.5 Write property test for streak calculation
    - **Property 15: Streak calculation correctness**
    - **Validates: Requirements 6.4**

- [x] 7. Implement error handling





  - [x] 7.1 Create DatabaseError class



    - Extend Error with code and originalError properties
    - Define error code constants
    - _Requirements: 8.1_
  
  - [x] 7.2 Add error handling to all database operations


    - Catch SQLite errors and wrap in DatabaseError
    - Map SQLite error codes to descriptive messages
    - Handle unique constraint violations
    - Handle foreign key violations
    - Handle not null violations
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 7.3 Write property test for error messages
    - **Property 16: Descriptive error messages**
    - **Validates: Requirements 8.1**
  
  - [ ]* 7.4 Write unit tests for constraint violations
    - Test unique constraint error for duplicate email
    - Test foreign key error for invalid user_id
    - _Requirements: 8.2, 8.3_

- [x] 8. Implement completion query properties






  - [ ]* 8.1 Write property test for completion retrieval
    - **Property 17: Completion retrieval completeness**
    - **Validates: Requirements 9.1**
  
  - [ ]* 8.2 Write property test for date range filtering
    - **Property 18: Date range filtering accuracy**
    - **Validates: Requirements 9.2**
  
  - [ ]* 8.3 Write property test for completion count
    - **Property 19: Completion count accuracy**
    - **Validates: Requirements 9.3**
  
  - [ ]* 8.4 Write property test for completion ordering
    - **Property 20: Completion ordering consistency**
    - **Validates: Requirements 9.4**
  
  - [ ]* 8.5 Write property test for habit details inclusion
    - **Property 21: Completion history includes habit details**
    - **Validates: Requirements 9.5**

- [x] 9. Update database initialization







  - [x] 9.1 Create initializeDatabase() function


    - Call ensureUsersTable()
    - Call ensureHabitsTable()
    - Call ensureHabitCompletionsTable()
    - Log successful initialization
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 9.2 Call initializeDatabase() on first getDatabase() call


    - Ensure tables exist before any operations
    - _Requirements: 7.1, 7.2_
  
  - [ ]* 9.3 Write unit tests for initialization
    - Test database file creation
    - Test table creation
    - Test foreign key constraint enablement
    - Test index creation
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
- [x] 10. Update environment configuration




- [ ] 10. Update environment configuration

  - [x] 10.1 Remove DATABASE_URL requirement


    - Remove DATABASE_URL checks from auth routes
    - Remove DATABASE_URL from .env.example
    - _Requirements: 1.1_
  
  - [x] 10.2 Update .gitignore


    - Add stride.db to .gitignore
    - Add *.db pattern to .gitignore
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 10.3 Update README documentation


    - Document SQLite usage
    - Document database file location
    - Add backup instructions
    - Remove PostgreSQL setup instructions
    - _Requirements: 10.4, 10.5_

- [x] 11. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Interetrygration testing and validation


  - [x] 12.1 Test user registration flow

    - Register user through API
    - Verify user stored in SQLite
    - Test duplicate email rejection
    - _Requirements: 2.1, 2.2, 2.4_
  

  - [x] 12.2 Test authentication flow

    - Login with valid credentials
    - Verify session cookie
    - Test invalid credentials
    - _Requirements: 2.1_
  
  - [x] 12.3 Test habit CRUD operations

    - Create habit through API
    - List habits for user
    - Update habit
    - Delete habit
    - Verify cascade deletion
    - _Requirements: 3.1, 3.2, 3.3_
  


  - [x] 12.4 Test habit completion flow


    - Complete habit through API
    - Verify streak calculation
    - Verify completion record created
    - Test same-day completion
    - Test consecutive day completion
    - _Requirements: 4.2, 6.1, 6.2, 6.3_
  
  - [x] 12.5 Test completion history queries

    - Query completions for habit
    - Query completions in date range
    - Query completion count
    - Query user completion history
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 13. Final checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.
