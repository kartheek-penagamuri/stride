# Project Structure & Organization

## Root Directory Layout

```
learning-together-platform/
├── src/                    # Application source code
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── docker-compose.yml      # Local development services
└── package.json           # Dependencies and scripts
```

## Source Code Organization (`/src`)

### App Router Structure (`/app`)
```
app/
├── api/                   # API routes (Next.js App Router)
│   ├── auth/             # Authentication endpoints
│   ├── users/            # User management
│   ├── goals/            # Goal CRUD operations
│   ├── pods/             # Pod management
│   ├── sessions/         # Session management
│   └── matching/         # Matching algorithm endpoints
├── auth/                 # Authentication pages
├── dashboard/            # Main dashboard
├── onboarding/           # User onboarding flow
├── matching/             # Pod matching interface
├── pods/                 # Pod-specific pages
├── profile/              # User profile management
├── test-video/           # Video testing utilities
├── layout.tsx            # Root layout component
├── page.tsx              # Home page
└── globals.css           # Global styles
```

### Component Organization (`/components`)
```
components/
├── matching/             # Pod matching components
├── onboarding/           # Onboarding flow components
├── profile/              # User profile components
├── providers/            # React context providers
├── sessions/             # Session management UI
└── video/                # Video conferencing components
```

### Business Logic (`/lib`)
```
lib/
├── services/             # Business logic services
│   ├── user-service.ts
│   ├── goal-service.ts
│   ├── pod-service.ts
│   ├── session-service.ts
│   ├── matching-service.ts
│   ├── checkin-service.ts
│   ├── notification-service.ts
│   └── video-service.ts
├── validations/          # Zod validation schemas
├── auth.ts              # Authentication configuration
├── prisma.ts            # Database client
├── redis.ts             # Cache client
└── env.ts               # Environment validation
```

### Shared Resources
```
hooks/                    # Custom React hooks
types/                    # TypeScript type definitions
middleware.ts             # Next.js middleware
```

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Pages**: kebab-case directories, `page.tsx` files
- **API Routes**: kebab-case directories, `route.ts` files
- **Services**: kebab-case with `-service.ts` suffix
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Types**: camelCase (`index.ts` in `/types`)

### Database Models
- **Tables**: snake_case (mapped via `@@map`)
- **Models**: PascalCase in Prisma schema
- **Fields**: camelCase in Prisma, snake_case in database

### API Endpoints
- RESTful conventions: `/api/resource` (GET, POST), `/api/resource/[id]` (GET, PUT, DELETE)
- Nested resources: `/api/pods/[podId]/sessions`
- Actions: `/api/matching/request`, `/api/sessions/[id]/attendance`

## Feature Organization

Each major feature follows this pattern:
```
Feature: Pod Management
├── /app/pods/            # Pages and layouts
├── /app/api/pods/        # API endpoints
├── /components/pods/     # UI components (if needed)
├── /lib/services/pod-service.ts    # Business logic
├── /lib/validations/pod-validation.ts  # Data validation
└── /types/index.ts       # Type definitions
```

## Import Conventions

- Use `@/` alias for src imports: `import { UserService } from '@/lib/services/user-service'`
- Relative imports for same-directory files
- Group imports: external packages, then internal modules
- Prisma client via `@/lib/prisma`