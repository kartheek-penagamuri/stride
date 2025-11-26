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

Example pattern:
```typescript
export async function GET(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    // Your logic here
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Database Layer (`lib/db.ts`)

- **Synchronous Operations**: All database operations use better-sqlite3 synchronously
- **Async Exports**: Functions exported as async for API route compatibility
- **Type Safety**: Use `DbUser`, `DbHabit`, `DbHabitCompletion` types
- **Error Handling**: Throw `DatabaseError` with code and message
- **Security**: Always use parameterized queries to prevent SQL injection
- **Initialization**: Tables auto-initialize on first access

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

## Authentication Flow

- **Cookie**: `stride_user` contains `{ id, email, name }`
- **Helper**: `getAuthUserFromCookies()` returns user object or null
- **Protected Routes**: Check auth at the start of every protected API route
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
