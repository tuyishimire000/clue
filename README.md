# Clue - Referral Rewards Platform

A referral-based reward platform built with Next.js 15, Supabase, and Vercel. Users can earn daily rewards and bonus rewards for each referral they bring in.

## 🚀 Features

- **Authentication**: Email/password and magic link authentication via Supabase Auth
- **Referral System**: Unique referral codes for each user with tracking
- **Daily Check-Ins**: Earn 100 RWF base reward + 50 RWF per referral daily
- **Dashboard**: View balance, referrals, check-in history, and manage your account
- **Real-time Updates**: Built with React Query for efficient data fetching

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: Supabase (Auth, Database, Functions)
- **Deployment**: Vercel
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Vercel account (for deployment)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase/schema.sql` to create all tables, functions, and policies
4. Go to Settings > API to get your project URL and anon key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Tables

- **users**: Stores user profiles with referral codes and balances
- **referrals**: Tracks referral relationships
- **checkins**: Records daily check-ins with reward amounts

### Key Features

- Automatic referral code generation on user signup
- Referral tracking when users sign up with a referral link
- Row Level Security (RLS) policies for data protection
- Automatic user profile creation via database trigger

## 🎯 Usage

1. **Sign Up**: Create an account (or use a referral link to sign up)
2. **Get Your Referral Code**: Your unique referral code is generated automatically
3. **Share Your Link**: Share your referral link to earn bonuses
4. **Daily Check-In**: Check in daily to earn rewards
   - Base: 100 RWF/day
   - Bonus: +50 RWF per referral/day

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📝 Project Structure

```
├── app/
│   ├── api/
│   │   └── checkin/          # Check-in API route
│   ├── dashboard/            # Dashboard page
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (redirects)
├── lib/
│   ├── supabase/             # Supabase client utilities
│   └── utils.ts              # Utility functions
├── components/               # React components
├── supabase/
│   └── schema.sql           # Database schema
└── middleware.ts            # Next.js middleware for auth
```

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Server-side authentication checks
- Protected API routes
- Secure cookie handling via Supabase SSR

## 📈 Future Enhancements

- Small short-term investment feature
- Email notifications
- Referral analytics dashboard
- Mobile app

## 📄 License

MIT
