# EcoAlert Complete Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the EcoAlert application with all its components including the Convex database, frontend, and backend services.

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- Git
- Convex CLI (`npm install -g convex`)
- Clerk account (for authentication)

## Quick Start

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd EcoAlert

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### 2. Initialize Convex Database

```bash
# Initialize Convex
npm run convex:init

# Deploy database (development)
npm run convex:deploy

# Deploy database (production)
npm run convex:prod
```

### 3. Configure Clerk Authentication

1. Create a Clerk account at [https://clerk.dev](https://clerk.dev)
2. Create a new application
3. Copy your Clerk keys to `.env.local`:
   ```
   CLERK_SECRET_KEY=your_secret_key_here
   CLERK_PUBLISHABLE_KEY=your_publishable_key_here
   ```

### 4. Run the Application

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:3000
```

## Detailed Setup Instructions

### Environment Configuration

Create a `.env.local` file with the following configuration:

```env
# Convex Configuration
CONVEX_URL=http://localhost:3000
CONVEX_SECRET=your_convex_secret_here

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_here

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=EcoAlert
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Database Schema

The EcoAlert application uses a comprehensive Convex database schema with the following main tables:

1. **environmentalData** - Real-time sensor data
2. **users** - User profiles and preferences
3. **communityMembers** - Community engagement data
4. **challenges** - Environmental challenges and goals
5. **discussions** - Community discussions
6. **educationalContent** - Learning materials
7. **emergencyAlerts** - Emergency notifications

### API Endpoints

The application provides the following API endpoints:

#### Environmental Data
- `GET /api/environmental/current` - Get current environmental data
- `GET /api/environmental/historical` - Get historical data
- `POST /api/environmental/data` - Submit sensor data

#### User Management
- `GET /api/user/profile` - Get user profile
- `POST /api/user/preferences` - Update user preferences
- `GET /api/user/achievements` - Get user achievements

#### Community Features
- `GET /api/challenges` - Get available challenges
- `POST /api/challenges/join` - Join a challenge
- `GET /api/discussions` - Get community discussions
- `POST /api/discussions` - Create new discussion

#### Educational Content
- `GET /api/content` - Get educational content
- `GET /api/courses` - Get available courses
- `POST /api/quizzes/complete` - Complete a quiz

#### Emergency Alerts
- `GET /api/alerts` - Get active alerts
- `POST /api/alerts` - Create emergency alert

### Frontend Components

The application is built with React/Next.js and includes the following main components:

#### Core Components
- **Environmental Dashboard** - Real-time environmental data visualization
- **Community Features** - Challenges, discussions, and member profiles
- **Educational Content** - Courses, certifications, and quizzes
- **Emergency Alerts** - Alert notifications and reporting
- **Sensor Network** - Sensor data visualization and management

#### UI Components
- **Alert System** - Toast notifications and alerts
- **Badge System** - Achievement badges and indicators
- **Card Components** - Content cards and information panels
- **Form Controls** - Input fields, buttons, and interactive elements
- **Navigation** - Tabs and navigation menus

### Development Workflow

#### Adding New Features

1. **Database Changes**
   - Update `convex/schema.ts` with new tables
   - Create corresponding API functions in `convex/_generated/server.ts`
   - Add migrations if needed

2. **Frontend Changes**
   - Create new components in `src/components/`
   - Add API integration in pages
   - Update styling as needed

3. **Testing**
   - Run tests: `npm test`
   - Run linting: `npm run lint`
   - Build for production: `npm run build`

#### Database Management

```bash
# Start Convex development server
npm run convex

# Deploy to production
npm run convex:prod

# View database in dashboard
npx convex dashboard
```

### Production Deployment

#### 1. Build the Application

```bash
# Build frontend
npm run build

# Deploy Convex database
npm run convex:prod
```

#### 2. Environment Variables

Set up production environment variables:

```env
# Production settings
NODE_ENV=production
CONVEX_URL=https://your-domain.com
CLERK_SECRET_KEY=your_production_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### 3. Deploy to Vercel (or other platform)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Monitoring and Analytics

#### Application Monitoring

The application includes comprehensive monitoring for:

1. **Performance Metrics**
   - Database response times
   - API performance
   - User engagement rates

2. **Error Tracking**
   - Application errors
   - API failures
   - Database issues

3. **User Analytics**
   - Active users
   - Feature usage
   - Conversion rates

#### Convex Monitoring

Configure monitoring through the Convex dashboard:

1. Set up custom metrics
2. Configure alert thresholds
3. Monitor database performance
4. Track API usage patterns

### Security Considerations

#### Authentication
- Clerk-based authentication
- Secure session management
- Role-based access control

#### Data Security
- Encrypted data storage
- Secure API endpoints
- Rate limiting and throttling

#### Privacy
- GDPR compliance
- Data anonymization
- User consent management

### Performance Optimization

#### Database Optimization
- Proper indexing strategies
- Query optimization
- Caching mechanisms

#### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction

#### API Optimization
- Response caching
- Efficient data fetching
- Pagination for large datasets

### Troubleshooting

#### Common Issues

1. **Database Connection Issues**
   - Check Convex configuration
   - Verify environment variables
   - Ensure database is deployed

2. **Authentication Problems**
   - Verify Clerk keys
   - Check user session management
   - Ensure proper redirect URLs

3. **Performance Issues**
   - Check database indexes
   - Monitor API response times
   - Optimize frontend rendering

#### Debug Tools

- Convex Dashboard: Database monitoring and debugging
- Browser DevTools: Frontend debugging and performance analysis
- Network Tab: API request inspection
- Console: Error logging and debugging

### Support and Resources

#### Documentation
- [Convex Documentation](https://docs.convex.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.dev/docs)

#### Community Support
- GitHub Issues: Report bugs and request features
- Discord/Slack: Join community discussions
- Documentation: Contribute and improve guides

#### Professional Support
- Convex Support: Enterprise and premium support
- Development Team: Contact for custom development
- Consulting: Architecture and optimization services

## Next Steps

1. **Set up your development environment**
2. **Configure authentication with Clerk**
3. **Deploy the Convex database**
4. **Customize the application for your needs**
5. **Set up monitoring and analytics**
6. **Deploy to production**

For additional help and support, please refer to the comprehensive documentation in the `convex/` directory or contact the development team.