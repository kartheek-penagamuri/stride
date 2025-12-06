---
inclusion: always
---

# Project Structure & Conventions

## Directory Organization

```
stride/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST endpoints)
│   │   ├── ai/           # AI-related endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   └── habits/       # Habit CRUD endpoints
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Home/landing page
│   └── globals.css       # Global styles and Tailwind
├── components/            # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities and business logic
│   ├── services/         # External service integrations
│   ├── api.ts           # Client-side API wrapper
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database layer (SQLite)
│   ├── types.ts         # Shared type definitions
│   └── constants.ts     # App-wide constants
├── types/                # Additional TypeScript types
├── scripts/              # Utility scripts
│   └── seed-completions.ts  # Seed habit completion data for testing
└── stride.db             # SQLite database file (gitignored)
```

## API Route Patterns

When creating or modifying API routes:

1. **Structure**: Use Next.js route handlers in `route.ts` files
2. **Authentication**: Always check auth first with `getAuthUserFromCookies()` - return 401 if unauthorized
3. **HTTP Methods**: Follow REST conventions (GET, POST, PUT, DELETE)
4. **Responses**: Use `NextResponse.json()` with appropriate status codes
5. **Error Handling**: Wrap in try-catch, return `{ error: string }` with 500 on failure
6. **Dynamic Routes**: Use `[id]` folder naming (e.g., `app/api/habits/[id]/route.ts`)
7. **Data Transformation**: Use `toClientHabit()` utility to transform `DbHabit` to client `Habit` type (includes completion history)

Example pattern:
```typescript
export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Your logic here
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Dynamic Route Parameters (Next.js 15)**:
In Next.js 15, route parameters in dynamic routes are now Promises and must be awaited:

```typescript
type Params = {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Await params before accessing properties
    const { id } = await params
    const habitId = Number(id)
    
    // Your logic here
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Habit API Utilities

The `app/api/habits/utils.ts` file provides helper functions for habit-related API routes:

- **`toClientHabit(habit: DbHabit): Promise<Habit>`**: Transforms a database habit record into a client-friendly format
  - Fetches completion history from `habit_completions` table
  - Calculates `totalCompletions` count
  - Includes `completedDates` array for visualization
  - Determines `completedToday` status using local timezone
  - **Important**: This is an async function that queries the database, so always use `await`

Example usage:
```typescript
const dbHabit = await findHabitById(userId, habitId)
const clientHabit = await toClientHabit(dbHabit)
return NextResponse.json({ habit: clientHabit })

// For multiple habits:
const dbHabits = await listHabitsForUser(userId)
const clientHabits = await Promise.all(dbHabits.map(h => toClientHabit(h)))
return NextResponse.json({ habits: clientHabits })
```

## Database Layer (`lib/db.ts`)

- **Synchronous Operations**: All database operations use better-sqlite3 synchronously
- **Async Exports**: Functions exported as async for API route compatibility
- **Type Safety**: Use `DbUser`, `DbHabit`, `DbHabitCompletion` types
- **Error Handling**: Throw `DatabaseError` with code and message
- **Security**: Always use parameterized queries to prevent SQL injection
- **Initialization**: Tables auto-initialize on first access
- **Timezone Handling**: Date calculations use local timezone (not UTC) for streak tracking and completion dates. All timestamps are explicitly set using local time rather than relying on database defaults.
- **Completion History**: The `habit_completions` table stores detailed completion records; use `getHabitCompletions()` to retrieve history

### Date Handling Convention

When working with dates in the database layer:

```typescript
// CORRECT: Use local timezone for date strings (date-only)
const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')
const todayDateString = `${year}-${month}-${day}`

// CORRECT: Use local timezone for timestamps (date + time)
const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')
const hours = String(today.getHours()).padStart(2, '0')
const minutes = String(today.getMinutes()).padStart(2, '0')
const seconds = String(today.getSeconds()).padStart(2, '0')
const localTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
// Result: "YYYY-MM-DD HH:MM:SS" in local timezone

// INCORRECT: Don't use toISOString() for timestamps or dates
const todayDateString = today.toISOString().slice(0, 10) // This uses UTC!
const localTimestamp = now.toISOString().replace('T', ' ').slice(0, 19) // This also uses UTC!
```

This ensures habit completions and streaks align with the user's local day boundaries, not UTC midnight. All completion timestamps are stored in local time for consistency with the user's experience.

**Important**: Always construct timestamps from local time components (`getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, etc.) rather than using `toISOString()` which converts to UTC.

When adding database functions, follow existing patterns and maintain type safety.

## Component Conventions

- **Type**: Functional components with TypeScript
- **Props**: Define interfaces inline or at top of file
- **Typing**: Use `React.FC<PropsType>` or implicit typing
- **Styling**: Use Tailwind utility classes
- **Glass Effect**: Apply `.glass` class for glass morphism
- **Icons**: Use Lucide React icons
- **State Management**: Use React hooks (useState, useEffect, custom hooks)

## Type Naming Conventions

Follow these prefixes/suffixes consistently:

- **Database types**: `Db` prefix (e.g., `DbHabit`, `DbUser`)
- **API request types**: `Request` suffix (e.g., `CreateHabitRequest`)
- **API response types**: `Response` suffix (e.g., `GenerateHabitsResponse`)
- **Client types**: No prefix (e.g., `Habit`, `User`)
- **Enums**: PascalCase (e.g., `AtomicPrinciple`, `HabitCategory`)

### Type Transformation Pattern

The application uses a clear separation between database types and client types:

- **`DbHabit`**: Raw database record with minimal fields (from `lib/db.ts`)
- **`Habit`**: Enriched client type with computed fields (from `lib/types.ts`)
  - Includes `totalCompletions` (count of all completions)
  - Includes `completedDates` (array of completion timestamps)
  - Includes `completedToday` (boolean computed from `last_completed`)

Always transform `DbHabit` to `Habit` using `toClientHabit()` before sending to the client.

## Authentication Flow

- **Cookie**: `stride_user` contains `{ id, email, name }`
- **Helper**: `getAuthUserFromCookies()` is an async function that returns user object or null
- **Protected Routes**: Check auth at the start of every protected API route with `await getAuthUserFromCookies()`
- **Unauthorized**: Return 401 status with error message
- **Password Hashing**: Use bcryptjs with 12 rounds

## Error Handling Strategy

- **API Routes**: Return JSON `{ error: string }` with appropriate status code
- **Database**: Throw `DatabaseError` with code and message properties
- **Client Side**: Display user-friendly error messages in UI
- **Logging**: Log errors to console for debugging

## Testing Conventions

- **Location**: Place `*.test.ts` files alongside source files
- **Framework**: Use Vitest with sequential execution (important for SQLite on Windows)
- **Integration Tests**: Keep in `lib/integration.test.ts`
- **Property-Based**: Use `fast-check` for property-based testing
- **Database**: Tests should handle database initialization and cleanup

## File Naming Rules

- **React Components**: PascalCase (e.g., `HabitStack.tsx`, `GoalForm.tsx`)
- **Utilities/Hooks**: camelCase (e.g., `useHabits.ts`, `api.ts`)
- **API Routes**: Always `route.ts` in appropriate folder structure
- **Types**: `types.ts` or `index.ts` in types folder
- **Tests**: `*.test.ts` matching the source file name

## Path Aliases

Use `@/*` to reference project root (configured in `tsconfig.json`):
```typescript
import { db } from '@/lib/db';
import { Habit } from '@/lib/types';
```

## Code Organization Principles

1. **Separation of Concerns**: Keep database logic in `lib/db.ts`, API logic in route handlers, UI in components
2. **Reusability**: Extract common logic into utilities and hooks
3. **Type Safety**: Maintain strict TypeScript typing throughout
4. **Single Responsibility**: Each file/function should have one clear purpose
5. **DRY**: Avoid duplication - extract shared code into utilities

## Development Scripts

### Seed Completion Data

**Location**: `scripts/seed-completions.ts`

**Purpose**: Populate existing habits with realistic completion history for testing and demonstration purposes

**Usage**:
```bash
npx tsx scripts/seed-completions.ts
```

**Behavior**:
- Reads all habits from the database
- **Backdates all habits to 7 days ago** to ensure they have sufficient history
- Generates 3-5 random completion records per habit
- Always includes today and yesterday for recent activity
- Adds random completion dates from the past 7 days
- Calculates and updates streak values based on consecutive completions
- Updates `completed_today` flag appropriately
- Adds realistic timestamps (8 AM - 10 PM) to completion records

**Use Cases**:
- Testing UI with realistic data
- Demonstrating streak calculations
- Populating demo databases
- Validating completion history features

**Note**: This script directly manipulates the database (including backdating `created_at` timestamps) and should only be used in development/testing environments.
