# EcoAlert API Setup Guide

## Required API Keys and Services

### 1. Authentication - Clerk (Required)
**Purpose**: User authentication and session management

**Setup**:
1. Go to [https://clerk.dev](https://clerk.dev)
2. Sign up for a free account
3. Create a new application
4. Copy the following keys from your Clerk dashboard:
   - Frontend API URL
   - Publishable Key
   - Secret Key
   - Webhook Secret

### 2. Database - Convex (Required)
**Purpose**: Database backend (No API key needed)

**Setup**:
1. Install Convex CLI: `npm install -g convex`
2. Run `npm run convex:init` in your project
3. Convex will be automatically configured

### 3. AI/ML - Google Gemini (Recommended)
**Purpose**: AI-powered insights and content generation

**Setup**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key to your environment file

**Free Tier**: Generous free tier available

### 4. Weather & Air Quality - OpenWeatherMap (Recommended)
**Purpose**: Weather data and air quality information

**Setup**:
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the "API keys" tab
4. Copy the API key to your environment file

**Free Tier**: 1,000 calls/day, includes air quality data

### 5. Water Quality Data (Optional)
**Purpose**: Water quality monitoring

**Options**:
1. **Government APIs** (Free in many countries):
   - EPA Water Quality Portal (US)
   - European Environment Agency
   - National environmental agencies

2. **Mock Data**: Use the application's built-in mock data for development

3. **Public Datasets**: 
   - Kaggle water quality datasets
   - Government open data portals

## Environment File Setup

Create a `.env.local` file in your project root:

```env
# Clerk Authentication
CLERK_FRONTEND_API_URL=your_clerk_frontend_api_url_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=http://localhost:54321

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here

# OpenWeatherMap API (for weather and air quality)
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here

# Water Quality (Optional - can use mock data)
# WATER_QUALITY_API_KEY=your_water_quality_api_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Quick Start with Mock Data

If you want to run the app immediately without all API keys:

1. **Set up Clerk and Convex** (required for the app to work)
2. **Skip optional APIs** for now
3. The app will use mock data for demonstration

## Development Commands

```bash
# Start development server
npm run dev

# Start Convex development
npm run convex

# Build for production
npm run build
```

## Testing the App

1. Make sure you have Clerk authentication set up
2. Create a `.env.local` file with at least Clerk and Convex configuration
3. Run `npm run dev`
4. Open http://localhost:3000 in your browser
5. Sign up/sign in with Clerk

## Notes

- **Convex**: No API key required - it uses your project ID
- **Clerk**: Required for user authentication
- **Google Gemini**: Recommended for AI features, but app can work without it
- **OpenWeatherMap**: Recommended for weather and air quality data
- **Water Quality**: Can use mock data if no API available

## Free Alternatives

All recommended services have free tiers suitable for development and testing:
- Clerk: Free tier available
- Convex: Free for development
- Google Gemini: Free tier available
- OpenWeatherMap: 1,000 calls/day free