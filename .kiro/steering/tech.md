# Tech Stack

## Framework & Language

- **Next.js 15.5** with App Router
- **TypeScript** (strict mode enabled)
- **React 19**

## Database

- **SQLite** via `better-sqlite3`
- File-based database (`stride.db` in project root)
- Zero configuration, automatic initialization
- Foreign key constraints enabled
- Date handling uses local timezone for user-facing features (streaks, completions)

## Styling & UI

- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Nunito** font from Google Fonts
- Custom glass morphism effects

## AI Integration

- **OpenAI SDK** for habit generation
- Model: `gpt-5.1` (configurable)
- Temperature: `0.7` (configurable)

## Testing

- **Vitest** for unit and integration tests
- Sequential test execution to avoid database locking on Windows
- Property-based testing with `fast-check`

## Authentication

- Cookie-based authentication (`stride_user` cookie)
- Password hashing with `bcryptjs` (12 rounds)
- No external auth provider

## Common Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Testing
npm test             # Run Vitest tests
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for habit generation

Optional:
- `OPENAI_MODEL` - Model to use (default: `gpt-5.1`)
- `OPENAI_MAX_TOKENS` - Max tokens (default: `2000`)
- `OPENAI_TEMPERATURE` - Creativity level (default: `0.7`)
- `NEXT_PUBLIC_APP_URL` - App URL (default: `http://localhost:3000`)

## Path Aliases

- `@/*` maps to project root (configured in `tsconfig.json`)
