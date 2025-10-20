# Technology Stack & Build System

## Core Stack

- **Framework**: Next.js 15.5.6 with App Router and Turbopack
- **Runtime**: React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (development) / PostgreSQL (production) with Prisma ORM
- **Cache**: Redis for session management and caching
- **Authentication**: NextAuth.js with OAuth providers (Google, GitHub, Microsoft)
- **AI Integration**: OpenAI API for Session Coach features
- **Video**: Jitsi Meet SDK for embedded video conferencing
- **Payments**: Stripe for deposit handling
- **Validation**: Zod for runtime type checking

## Development Tools

- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Database Tools**: Prisma Studio, migrations, seeding
- **Containerization**: Docker Compose for local services
- **Build Tool**: Turbopack (Next.js built-in)

## Common Commands

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run build           # Production build with Turbopack
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Database Management
```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database (development)
npm run db:migrate      # Create and run migrations (production)
npm run db:studio       # Open Prisma Studio GUI
npm run db:seed         # Seed database with sample data
```

### Docker Services
```bash
npm run docker:up       # Start PostgreSQL and Redis containers
npm run docker:down     # Stop containers
```

## Architecture Patterns

- **API Routes**: RESTful endpoints in `/app/api/` following Next.js conventions
- **Service Layer**: Business logic in `/lib/services/` with clear separation of concerns
- **Validation Layer**: Zod schemas in `/lib/validations/` for type-safe data handling
- **Component Organization**: Feature-based components in `/components/[feature]/`
- **Custom Hooks**: Reusable logic in `/hooks/` for state management and API calls
- **Type Safety**: Comprehensive TypeScript with Prisma-generated types

## Environment Configuration

Required environment variables (see `.env.example`):
- Database: `DATABASE_URL`, `REDIS_URL`
- Auth: `NEXTAUTH_SECRET`, OAuth provider credentials
- External APIs: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`
- Email service configuration for notifications