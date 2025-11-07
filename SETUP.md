# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the contents of `supabase/schema.sql`
   - Get your project URL and anon key from Settings > API

3. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Database Setup

The `supabase/schema.sql` file contains:
- Table definitions (users, referrals, checkins)
- Row Level Security (RLS) policies
- Database trigger for automatic user profile creation
- Automatic referral code generation
- Referral tracking on signup

**Important:** Run the entire SQL script in your Supabase SQL Editor to set up the database correctly.

## Testing the Application

1. **Sign up** a new user at `/register`
2. **Note your referral code** from the dashboard
3. **Sign up another user** using `/register?ref=YOUR_CODE`
4. **Check in daily** to earn rewards
5. **View referrals** and check-in history on the dashboard

## Deployment to Vercel

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Troubleshooting

- **"Unauthorized" errors**: Check that RLS policies are set up correctly
- **Referral codes not generating**: Verify the database trigger is created
- **Check-in not working**: Ensure the API route has proper authentication
- **Referrals not showing**: Check that the referral relationship was created in the database

