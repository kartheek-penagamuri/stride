# Atomic Habits Tracker

A modern web application for building and tracking atomic habits, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Habit Generation** - Transform your goals into actionable habits using OpenAI
- 🎯 **Habit Tracking** - Create, track, and manage your daily habits
- 📊 **Progress Visualization** - See your streaks and completion rates
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- � **Roeal-time Updates** - Instant feedback when completing habits
- �  **Mobile Friendly** - Works perfectly on all devices
- 🚀 **Fast Performance** - Built with Next.js 14 and optimized for speed
- ⚡ **Atomic Habits Framework** - Based on James Clear's proven methodology

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI SDK for habit generation
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

4. Configure your OpenAI API key (required for AI habit generation):

   a. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   
   b. Open `.env.local` and replace `your-openai-api-key-here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-proj-...your-actual-key...
   ```
   
   c. (Optional) Adjust other OpenAI settings if needed:
   - `OPENAI_MODEL`: The model to use (default: `gpt-4-turbo-preview`)
   - `OPENAI_MAX_TOKENS`: Maximum tokens for responses (default: `2000`)
   - `OPENAI_TEMPERATURE`: Creativity level 0-1 (default: `0.7`)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

This application requires environment variables to be configured in a `.env.local` file. Copy `.env.example` to `.env.local` and configure the following:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI habit generation | `sk-proj-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4-turbo-preview` |
| `OPENAI_MAX_TOKENS` | Maximum tokens for AI responses | `2000` |
| `OPENAI_TEMPERATURE` | AI creativity level (0-1) | `0.7` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

### Getting an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file
6. **Important**: Keep your API key secure and never commit it to version control

**Note**: The AI habit generation feature requires a valid OpenAI API key with available credits. Without it, the "Start Your Journey" feature will not work.

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

### Habits API
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create a new habit
- `GET /api/habits/[id]` - Get a specific habit
- `PUT /api/habits/[id]` - Update a habit
- `DELETE /api/habits/[id]` - Delete a habit
- `POST /api/habits/[id]/complete` - Mark habit as completed

### AI API
- `POST /api/ai/generate-habits` - Generate habit recommendations from a goal using OpenAI

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### AI Habit Generation Not Working

If the "Start Your Journey" feature isn't working, check the following:

1. **API Key Configuration**
   - Ensure `OPENAI_API_KEY` is set in `.env.local`
   - Verify the key starts with `sk-` and is complete
   - Restart the development server after adding the key

2. **OpenAI Account Issues**
   - Verify your OpenAI account has available credits
   - Check if your API key is active at [OpenAI Platform](https://platform.openai.com/api-keys)
   - Ensure you haven't exceeded rate limits

3. **Network Issues**
   - Check your internet connection
   - Verify you can access OpenAI's API (not blocked by firewall/proxy)

4. **Error Messages**
   - Check the browser console for detailed error messages
   - Check the terminal/server logs for API errors

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