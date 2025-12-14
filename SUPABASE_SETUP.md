# Supabase Setup Guide

## Files Created/Modified

### New Files
- `src/lib/supabase/browser.ts` - Client-side Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client with cookie handling
- `src/lib/supabase/data.ts` - Data access layer for Supabase queries
- `src/lib/supabase/storage.ts` - File upload helpers for lesson attachments
- `src/middleware.ts` - Route protection for `/parent/*` routes
- `src/app/parent/login/page.tsx` - Parent authentication page
- `src/app/parent/layout.tsx` - Parent layout with auth check
- `src/components/ParentNav.tsx` - Navigation component for parent dashboard
- `src/components/MiAcademyCardWrapper.tsx` - Client wrapper for async MiAcademy resource
- `supabase/migrations/0001_homeschool.sql` - Database schema migration
- `src/app/parent/lessons/page.tsx` - Lessons admin page (placeholder)
- `src/app/parent/assignments/page.tsx` - Assignments admin page (placeholder)
- `src/app/parent/resources/page.tsx` - Resources admin page (placeholder)

### Modified Files
- `package.json` - Added `@supabase/supabase-js` dependency
- `src/types/index.ts` - Added Supabase database row types
- `src/app/parent/page.tsx` - Updated to use Supabase data and auth check
- `src/app/kids/[kidId]/page.tsx` - Updated to read from Supabase instead of JSON
- `src/components/index.ts` - Exported ParentNav component

## Setup Instructions

### 1. Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Go to Settings > API
3. Use the **"Publishable and secret API keys"** tab (not the legacy one)
4. Copy your **Project URL** and **Publishable key** (the new name for anon key)

### 2. Run Database Migration
1. In Supabase dashboard, go to SQL Editor
2. Copy contents of `supabase/migrations/0001_homeschool.sql`
3. Run the migration to create tables and RLS policies

### 3. Create Storage Bucket
1. Go to Storage in Supabase dashboard
2. Create a new bucket named `homeschool`
3. Set it to **public** (for public URLs) or configure policies for authenticated access

### 4. Set Environment Variables
Update `.env.local` file with your values:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key_here
```

**Note:** Use the **Publishable key** from the "Publishable and secret API keys" tab (not the legacy anon key). The variable name `NEXT_PUBLIC_SUPABASE_ANON_KEY` is kept for compatibility with Supabase client libraries, but you should use the new publishable key value.

### 5. Seed Initial Data
The migration includes seed data for:
- Kids (Atlas, Stella)
- MiAcademy resource (pinned for today)

You can add more data via:
- Supabase dashboard (Table Editor)
- Parent admin UI (once CRUD is implemented)
- Direct SQL inserts

## What Still Uses JSON

The following still use JSON files (not migrated to Supabase):
- `content/quotes.json` - Daily quotes (can stay as JSON for now)
- `content/avatar-assets.json` - Avatar assets
- `content/studio-templates.json` - Studio templates
- `content/shop-items.json` - Shop items

**localStorage (unchanged):**
- Done state (`homeschool_done::*`)
- Stars (`homeschool_stars::*`)
- Streaks (`homeschool_streak::*`)
- Unlocks (`homeschool_unlocks::*`)
- Purchases (`homeschool_purchases::*`)
- Avatar state (`homeschool_avatar::*`)
- Studio state (`homeschool_studio::*`)

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run development server:
```bash
npm run dev
```

4. Access:
- Main dashboard: http://localhost:3000
- Kid portal: http://localhost:3000/kids/atlas
- Parent login: http://localhost:3000/parent/login
- Parent dashboard: http://localhost:3000/parent (requires auth)

## Next Steps (To Complete Implementation)

1. **Parent Admin UI - Lessons:**
   - Create lesson form
   - Edit lesson form
   - Delete lesson
   - Manage links (add/remove)
   - Upload attachments

2. **Parent Admin UI - Assignments:**
   - Create assignment for a date
   - Select kids via checkboxes
   - Select and reorder lessons
   - Edit/delete assignments

3. **Parent Admin UI - Resources:**
   - CRUD for resources
   - Toggle `pinned_today` (enforce only one pinned)

4. **Kids Pages:**
   - Ensure MiAcademy shows first (currently using wrapper)
   - Verify lesson ordering by `sort_order`

## Authentication

- Parent routes (`/parent/*`) require authentication
- Uses Supabase Auth (email/password or magic link)
- Middleware protects routes automatically
- Kids pages remain public (read-only via RLS)

## RLS Policies

- **Public Read:** All tables allow `SELECT` for anonymous users
- **Authenticated Write:** All tables require authentication for `INSERT/UPDATE/DELETE`
- This allows kids to view content without auth, while parents must sign in to manage

