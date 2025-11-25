# Project Structure

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

## Key Conventions

### API Routes

- Follow REST conventions: `GET`, `POST`, `PUT`, `DELETE`
- Use Next.js route handlers (`route.ts` files)
- Return `NextResponse.json()` with appropriate status codes
- Check authentication via `getAuthUserFromCookies()` first
- Handle errors with try-catch and return 500 on failure
- Dynamic routes use `[id]` folder naming

### Database Layer (`lib/db.ts`)

- All database operations are synchronous (better-sqlite3)
- Functions are exported as async for API compatibility
- Custom error handling with `DatabaseError` class
- Type-safe with `DbUser`, `DbHabit`, `DbHabitCompletion` types
- Automatic table initialization on first access
- Use parameterized queries to prevent SQL injection

### Components

- Functional components with TypeScript
- Props interfaces defined inline or at top of file
- Use `React.FC<PropsType>` for component typing
- Tailwind classes for styling
- Glass morphism effect via `.glass` class

### Types

- Database types prefixed with `Db` (e.g., `DbHabit`)
- API request/response types suffixed (e.g., `CreateHabitRequest`)
- Client-facing types without prefix (e.g., `Habit`)
- Enums for fixed values (e.g., `AtomicPrinciple`)

### Authentication

- Cookie-based: `stride_user` contains `{ id, email, name }`
- Helper: `getAuthUserFromCookies()` returns user or null
- All protected API routes check auth first
- Return 401 for unauthorized requests

### Error Handling

- API routes: Return JSON with `{ error: string }` and status code
- Database: Throw `DatabaseError` with code and message
- Client: Display user-friendly error messages

### Testing

- Test files: `*.test.ts` alongside source files
- Use Vitest with sequential execution
- Integration tests in `lib/integration.test.ts`
- Property-based tests with `fast-check`

## File Naming

- React components: PascalCase (e.g., `HabitStack.tsx`)
- Utilities/hooks: camelCase (e.g., `useHabits.ts`)
- API routes: `route.ts` in folder structure
- Types: `types.ts` or `index.ts` in types folder
