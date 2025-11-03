# Atomic Habits Tracker

A modern web application for building and tracking atomic habits, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Habit Tracking** - Create, track, and manage your daily habits
- 📊 **Progress Visualization** - See your streaks and completion rates
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🔄 **Real-time Updates** - Instant feedback when completing habits
- 📱 **Mobile Friendly** - Works perfectly on all devices
- 🚀 **Fast Performance** - Built with Next.js 14 and optimized for speed

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Ready for Vercel, Netlify, or any hosting platform

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stride
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
stride/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API clients
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## API Routes

- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create a new habit
- `GET /api/habits/[id]` - Get a specific habit
- `PUT /api/habits/[id]` - Update a habit
- `DELETE /api/habits/[id]` - Delete a habit
- `POST /api/habits/[id]/complete` - Mark habit as completed

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

The app is ready to deploy to any platform that supports Next.js:

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
1. Run `npm run build`
2. Deploy the generated files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

- [ ] User authentication
- [ ] Database integration
- [ ] Habit analytics and insights
- [ ] Social features and sharing
- [ ] Mobile app
- [ ] Habit templates and recommendations