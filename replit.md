# SecureDel - Project Overview

## Architecture

This is a pure frontend React + Vite + TypeScript application originally built on Lovable, migrated to Replit.

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM v6
- **Auth & Database**: Supabase (email/password + GitHub OAuth)
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Animations**: Framer Motion

## Supabase Integration

- **Project URL**: https://nhusjfphiygaihibohlx.supabase.co
- **Env vars**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (stored as shared env vars)
- **Auth methods**: Email/password + GitHub OAuth + Password reset via email
- **Client**: `src/lib/supabase.ts`
- **Auth Context**: `src/contexts/AuthContext.tsx` — provides `useAuth()` hook with `user`, `session`, `signIn`, `signUp`, `signOut`, `signInWithGithub`, `resetPassword`

## Project Structure

```
src/
  App.tsx              - Root component with routing + AuthProvider
  lib/
    supabase.ts        - Supabase client initialization
    utils.ts           - Tailwind utility
  contexts/
    AuthContext.tsx    - Auth provider and useAuth hook
  pages/
    Home.tsx           - Landing page (Hero, Trust, Problem/Solution, Features, Demo, Why, Testimonials, CTA)
    About.tsx          - About page (Hero, Problem Deep Dive, Philosophy, Tech Stack, Algorithms, Story, Roadmap, FAQ)
    Contact.tsx        - Contact page (Hero, Channels, Contact Form, Bug Report, Location/Availability)
    Auth.tsx           - Login / Sign Up / Forgot Password
    Profile.tsx        - Authenticated user profile & dashboard
    NotFound.tsx
    SecureDel/         - App dashboard and feature pages
  components/
    layout/            - Navbar (auth-aware), Footer, PageWrapper
    ui/                - shadcn/ui components + custom UI
  hooks/               - Custom React hooks
```

## Key Pages / Routes

- `/` - Home landing page
- `/about` - About page
- `/contact` - Contact page
- `/auth` - Login / Sign Up (with `?mode=signup` or `?mode=forgot`)
- `/profile` - Authenticated user profile (redirects to /auth if not logged in)
- `/app` - SecureDel dashboard
  - `/app/file-wiper` - File Wiper tool
  - `/app/browser-cleaner` - Browser Cleaner tool
  - `/app/recent-files` - Recent Files Cleaner
  - `/app/log-scanner` - Log Scanner
  - `/app/secret-scanner` - Secret Scanner
  - `/app/temp-cleaner` - Temp File Cleaner

## Replit Configuration

- Dev server runs on port 5000 (required for Replit webview)
- `lovable-tagger` plugin removed from vite.config.ts (Lovable-specific)
- Host set to `0.0.0.0` with `allowedHosts: true` for Replit proxy compatibility

## Running

- **Development**: `npm run dev` (starts Vite on port 5000)
- **Build**: `npm run build`
- **Preview**: `npm run preview`
