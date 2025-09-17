# Clerk and Convex Integration Setup Guide

## Overview

This guide walks you through integrating Clerk authentication with Convex backend for the EcoAlert application.

## Prerequisites

1. A Clerk account (sign up at https://clerk.dev)
2. A Convex account (sign up at https://convex.dev)
3. Node.js and npm installed

## Step 1: Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.dev)
2. Click "Create Application"
3. Choose a name for your application (e.g., "EcoAlert")
4. Configure your sign-in and sign-up options:
   - Enable Email/Password authentication
   - Enable Google OAuth
   - Enable Phone authentication if needed
5. Note your Publishable Key and Frontend API URL

## Step 2: Get Your Clerk Webhook Secret and Configure Webhook Endpoint

2. **Configure Webhook in Clerk Dashboard**:
   - Go to your [Clerk Dashboard](https://dashboard.clerk.dev)
   - Navigate to **Webhooks** in the left sidebar
   - Click **Create Endpoint**
   - Enter your webhook URL in the "URL" field (from step 1)
   - Select the events you want to listen to (e.g., "User Created", "User Updated", "User Deleted")
   - Click **Create**
   - Your webhook secret will be displayed - copy this value
   - Add it to your `.env` file as `CLERK_WEBHOOK_SECRET`
   - In your `/api/auth/webhook` handler:
     - Enforce `POST` only.
     - Verify `svix-id`, `svix-timestamp`, and `svix-signature` using the Clerk SDK (or `svix`) before any processing.
       - Use the exact raw request body (e.g., `await req.text()` in App Router; disable body parsing in Pages Router) for signature verification.
       - Enforce a reasonable timestamp tolerance (replay protection is built-in; keep default or set a strict value).
       - Treat duplicate deliveries as possible (SVIX retries). Make the handler idempotent.
       - Do not log secrets or full `svix-signature` values.
     - On verification failure, return `401 Unauthorized` and perform no side effects. Return 2xx only after successful verification and handling.
## Step 3: Create a JWT Template for Convex
1. In your Clerk Dashboard, go to **JWT Templates**
2. Click **New template** and choose **Convex** from the list
3. Copy and securely store the **Issuer URL** (this is your `CLERK_FRONTEND_API_URL`)
4. Optionally, map extra JWT claims if needed

## Step 4: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Clerk credentials in `.env`:
   ```env
   # Clerk Configuration
   CLERK_FRONTEND_API_URL=YOUR_CLERK_FRONTEND_API_URL_HERE
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
   CLERK_WEBHOOK_SECRET=your_webhook_secret_here
   
   # Convex Configuration
   NEXT_PUBLIC_CONVEX_URL=http://localhost:54321
   ```

   Where:
   - `CLERK_FRONTEND_API_URL`: The Issuer URL from your JWT template
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key (found in Dashboard > API Keys)
   - `CLERK_WEBHOOK_SECRET`: Your Clerk webhook secret (follow instructions in Step 2 to get this)
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL

## Step 5: Configure Convex Authentication

The `convex/auth.config.js` file is already created and configured to use Clerk as the authentication provider.

## Step 6: Update Your Application

The following files have been created/updated for you:

1. **`src/components/convex-client-provider.tsx`** - Convex client provider with Clerk integration
2. **`src/components/clerk-provider.tsx`** - Clerk provider with custom styling
3. **`src/components/auth-flow.tsx`** - Complete authentication component with Google, email, and phone options
4. **`src/components/auth-header.tsx`** - Header component with Clerk's official authentication components
5. **`src/hooks/use-auth.ts`** - Custom authentication hook for managing auth state
6. **`src/app/layout.tsx`** - Updated to include both Clerk and Convex providers
7. **`src/app/page.tsx`** - Enhanced to show different content based on authentication state
8. **`src/middleware.ts`** - Updated to use Clerk's official middleware
9. **`convex/auth.config.js`** - Convex authentication configuration
10. **API Routes** for handling authentication:
    - `src/app/api/auth/clerk/route.ts`
    - `src/app/api/auth/sync/route.ts`
    - `src/app/api/auth/webhook/route.ts`

## Step 7: Deploy Convex Configuration

Run the following command to deploy your authentication configuration to Convex:

```bash
npx convex dev
```

This will push and sync your authentication configuration to your Convex backend.

## Step 8: Test the Authentication Flow

1. Start your Next.js application:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Test the authentication flow:
   - Sign in with Google
   - Sign in with email/password
   - Sign in with phone (if configured)
   - Verify user data is synced to your Convex database

## Troubleshooting

### Common Issues

1. **"Missing NEXT_PUBLIC_CONVEX_URL"**
   - Ensure the environment variable is set in your `.env` file
   - Make sure the variable is prefixed with `NEXT_PUBLIC_`

2. **"Authentication not working"**
   - Verify your Clerk credentials in the `.env` file
   - Check that your JWT template is properly configured
   - Ensure the Convex configuration is deployed

3. **"User data not syncing"**
   - Check the console for errors
   - Verify the webhook endpoint is accessible
   - Ensure the webhook secret is correctly configured

4. **"Webhook secret not found"**
   - Follow Step 2 above to create a webhook endpoint in Clerk Dashboard
   - Copy the webhook secret and add it to your `.env` file

5. **"Webhook endpoint not working"**
   - Ensure your webhook URL is accessible (publicly accessible URL in production)
   - For local development: `http://localhost:3000/api/auth/webhook`
   - For production: `https://yourdomain.com/api/auth/webhook`
   - Verify your webhook endpoint is running and accepting POST requests

### Debugging Tips

1. Check browser console for authentication errors
2. Use Clerk Dashboard to monitor authentication events
3. Check Convex dashboard for database operations
4. Verify network requests to the authentication endpoints

## Next Steps

1. Configure additional authentication methods in Clerk Dashboard
2. Set up user roles and permissions in your Convex schema
3. Implement protected routes using Convex's authentication helpers
4. Add user profile management features

## Support

If you encounter any issues:
1. Check the [Clerk Documentation](https://clerk.dev/docs)
2. Check the [Convex Documentation](https://docs.convex.dev)
3. Review the troubleshooting section above