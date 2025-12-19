-- Migration: Add user_id to content tables for multi-tenancy
-- This allows each user to have their own lessons, assignments, resources, etc.

-- ============================================================================
-- STEP 1: Add user_id columns (nullable initially for existing data)
-- ============================================================================

-- Lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Assignment Items
ALTER TABLE assignment_items 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Resources
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Schedule Items (already has student_id, but needs user_id for RLS)
ALTER TABLE schedule_items 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Day Plans
ALTER TABLE day_plans 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: Enable RLS on all content tables
-- ============================================================================

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS policies for each table
-- ============================================================================

-- Lessons policies
DROP POLICY IF EXISTS "Users can view their own lessons" ON lessons;
CREATE POLICY "Users can view their own lessons" ON lessons
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own lessons" ON lessons;
CREATE POLICY "Users can insert their own lessons" ON lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lessons" ON lessons;
CREATE POLICY "Users can update their own lessons" ON lessons
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own lessons" ON lessons;
CREATE POLICY "Users can delete their own lessons" ON lessons
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Assignment Items policies
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignment_items;
CREATE POLICY "Users can view their own assignments" ON assignment_items
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignment_items;
CREATE POLICY "Users can insert their own assignments" ON assignment_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assignments" ON assignment_items;
CREATE POLICY "Users can update their own assignments" ON assignment_items
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignment_items;
CREATE POLICY "Users can delete their own assignments" ON assignment_items
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Resources policies
DROP POLICY IF EXISTS "Users can view their own resources" ON resources;
CREATE POLICY "Users can view their own resources" ON resources
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
CREATE POLICY "Users can insert their own resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
CREATE POLICY "Users can update their own resources" ON resources
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;
CREATE POLICY "Users can delete their own resources" ON resources
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Schedule Items policies
DROP POLICY IF EXISTS "Users can view their own schedule items" ON schedule_items;
CREATE POLICY "Users can view their own schedule items" ON schedule_items
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own schedule items" ON schedule_items;
CREATE POLICY "Users can insert their own schedule items" ON schedule_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedule items" ON schedule_items;
CREATE POLICY "Users can update their own schedule items" ON schedule_items
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own schedule items" ON schedule_items;
CREATE POLICY "Users can delete their own schedule items" ON schedule_items
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Day Plans policies
DROP POLICY IF EXISTS "Users can view their own day plans" ON day_plans;
CREATE POLICY "Users can view their own day plans" ON day_plans
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own day plans" ON day_plans;
CREATE POLICY "Users can insert their own day plans" ON day_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own day plans" ON day_plans;
CREATE POLICY "Users can update their own day plans" ON day_plans
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own day plans" ON day_plans;
CREATE POLICY "Users can delete their own day plans" ON day_plans
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- NOTE: To migrate existing data, run this query manually in Supabase SQL editor
-- replacing YOUR_USER_ID with your actual Supabase user ID:
--
-- UPDATE kids SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE lessons SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE assignment_items SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE resources SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE schedule_items SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE day_plans SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- ============================================================================
