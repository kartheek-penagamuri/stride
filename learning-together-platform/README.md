# Learning Together Platform (Pactly)

A web-based application that helps people learn better together through small pods (2-4 people), structured sessions, and an AI Session Coach.

## Features

- **Pod-based Learning**: Small groups (2-4 people) for accountability
- **AI Session Coach**: Structured agendas and progress tracking
- **Sprint Templates**: Gym 3×/week and .NET Prompting tracks
- **Progress Tracking**: Daily check-ins and streak management
- **Video Integration**: Embedded Jitsi Meet and external video support
- **Smart Matching**: Algorithm-based pod formation
- **Payment System**: Optional refundable deposits for motivation

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: NextAuth.js with OAuth providers
- **Payments**: Stripe
- **AI**: OpenAI API
- **Video**: Jitsi Meet SDK

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning-together-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration values:
   - Database credentials
   - OAuth provider keys (Google, GitHub, Microsoft)
   - OpenAI API key
   - Stripe keys
   - Email service configuration

4. **Start the database services**
   ```bash
   npm run docker:up
   ```

5. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                 # Utility libraries
│   ├── prisma.ts       # Database client
│   ├── redis.ts        # Redis client
│   └── env.ts          # Environment validation
├── types/              # TypeScript type definitions
└── generated/          # Generated files (Prisma client)

prisma/
├── schema.prisma       # Database schema
└── seed.ts            # Database seeding script
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts and preferences
- **Goals**: Sprint goals and schedules
- **Pods**: Learning groups (2-4 members)
- **Sessions**: Scheduled learning sessions
- **CheckIns**: Daily progress tracking
- **CoachDocs**: AI-generated session materials

## Development

### Database Management

```bash
# View database in browser
npm run db:studio

# Reset database (careful!)
npm run db:push --force-reset

# Create a new migration
npm run db:migrate
```

### Docker Services

The project includes PostgreSQL and Redis services via Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth credentials
- `OPENAI_API_KEY` - OpenAI API key for AI Coach
- `STRIPE_SECRET_KEY` - Stripe payment processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.