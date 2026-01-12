-- Migration: Fix Saved Ideas Table and Permissions
-- Ensures the table exists with correct schema and permissive RLS for owners

-- 1. Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.saved_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_message TEXT,
  source_type TEXT DEFAULT 'luna',
  suggestion_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts/duplicates
DROP POLICY IF EXISTS "saved_ideas_read" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_write" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_select" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_insert" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_delete" ON public.saved_ideas;
DROP POLICY IF EXISTS "Users can view own ideas" ON public.saved_ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON public.saved_ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON public.saved_ideas;

-- 4. Re-create clean, permissive policies
-- READ: Users can read their own ideas
CREATE POLICY "saved_ideas_read" ON public.saved_ideas
  FOR SELECT
  USING (user_id = auth.uid());

-- WRITE: Users can insert/update/delete their own ideas
-- We use a comprehensive INSERT check to ensure they can't insert for others
CREATE POLICY "saved_ideas_insert" ON public.saved_ideas
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_ideas_update" ON public.saved_ideas
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_ideas_delete" ON public.saved_ideas
  FOR DELETE
  USING (user_id = auth.uid());

-- 5. Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_saved_ideas_user_id ON public.saved_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_ideas_created_at ON public.saved_ideas(created_at DESC);
