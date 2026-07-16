# GreenSlip - Smart Agriculture Tracking

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Neon account (https://console.neon.tech)
- A Google Cloud account for OAuth credentials

### 1. Create Neon Database

1. Go to https://console.neon.tech and sign in
2. Create a new project named "greenslip"
3. Select your preferred region (e.g., AWS US East 2)
4. Copy the **Pooled Connection String** from the dashboard

### 2. Set up Google OAuth

1. Go to https://console.developers.google.com/apis/credentials
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - Development: `https://greenslip.vercel.app/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
4. Copy the Client ID and Client Secret

### 3. Configure Environment Variables

1. Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your credentials:

   ```env
   DATABASE_URL="your-neon-pooled-connection-string"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   NEXTAUTH_URL="https://greenslip.vercel.app"
   ```

3. Generate AUTH_SECRET:
   ```bash
   npx auth secret
   ```
   This will automatically add `AUTH_SECRET` to your `.env.local`

### 4. Push Database Schema

Run Drizzle to create tables in your Neon database:

```bash
npm run db:push
```

This creates:

- Auth tables: `user`, `account`, `session`, `verificationToken`, `authenticator`
- App tables: `receipts`, `receipt_items`, `products`, `ai_insights`

### 5. Start Development Server

```bash
npm run dev
```

Visit https://greenslip.vercel.app

### 6. Sign In and Seed Data

1. Click "Sign In with Google" at https://greenslip.vercel.app/signin
2. Complete Google OAuth flow
3. After signing in, find your user ID:
   - Go to Neon Console → SQL Editor
   - Run: `SELECT * FROM "user";`
   - Copy your `id` value

4. Seed mock data:
   ```bash
   npm run db:seed YOUR_USER_ID_HERE
   ```

Example:

```bash
npm run db:seed "cm5abc123xyz"
```

This will populate your account with:

- 5 sample receipts with items
- 6 sample products

### 7. Explore the Dashboard

Visit https://greenslip.vercel.app/dashboard to see:

- ✅ User-specific receipt history
- ✅ Protected routes with middleware
- ✅ Session-based authentication
- ✅ Database-driven data

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to Neon
- `npm run db:studio` - Open Drizzle Studio (visual DB editor)
- `npm run db:generate` - Generate migration files
- `npm run db:seed <user-id>` - Seed mock data for a user

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Auth.js v5 (next-auth) with Google OAuth
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel (recommended)

## 🔒 Security Features

- ✅ Server-side session validation
- ✅ Protected API routes and pages
- ✅ User data isolation (all queries filtered by user ID)
- ✅ OAuth 2.0 with Google
- ✅ Automatic refresh token handling

## 🌐 Deployment to Vercel

1. Push your code to GitHub (don't commit `.env.local`)

2. Import project to Vercel

3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel domain)

4. Add production callback URL to Google Console:

   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. Deploy!

## 🐛 Troubleshooting

### "Unauthorized" errors

- Make sure you're signed in
- Check that your session is valid (try signing out and back in)

### Database connection issues

- Verify `DATABASE_URL` is correct
- Ensure you're using the **pooled** connection string from Neon
- Check that tables exist: `npm run db:push`

### Seed script fails

- Make sure you've signed in at least once
- Use the correct user ID from the database
- Verify `DATABASE_URL` is set in `.env.local`

### OAuth redirect errors

- Check callback URLs match in Google Console
- Verify `NEXTAUTH_URL` is correct
- For local dev, use `https://greenslip.vercel.app` (no trailing slash)

## 📝 Notes

- All receipt and product data is user-specific
- Each user can only see their own data
- Database uses CASCADE delete for referential integrity
- Middleware protects `/dashboard/*` routes automatically

## 🎯 Next Steps

To continue development:

1. Update scanner page to save to database
2. Add product management CRUD UI
3. Implement AI chat with database context
4. Add analytics and insights dashboard
5. Implement receipt image upload (Vercel Blob)

Happy coding! 🌱
