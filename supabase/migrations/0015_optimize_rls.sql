-- Migration: Optimize RLS policies for performance
-- Fixes: 
-- 1. Wrap auth.uid() in (select ...) to cache value instead of per-row evaluation
-- 2. Remove duplicate/conflicting policies

-- ============================================================================
-- STEP 1: Drop ALL existing policies to clean slate
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow all for auth users" ON profiles;

-- kids
DROP POLICY IF EXISTS "Users can view their own kids" ON kids;
DROP POLICY IF EXISTS "Users can insert their own kids" ON kids;
DROP POLICY IF EXISTS "Users can update their own kids" ON kids;
DROP POLICY IF EXISTS "Users can delete their own kids" ON kids;
DROP POLICY IF EXISTS "Allow all for auth users" ON kids;

-- lessons
DROP POLICY IF EXISTS "Users can view their own lessons" ON lessons;
DROP POLICY IF EXISTS "Users can insert their own lessons" ON lessons;
DROP POLICY IF EXISTS "Users can update their own lessons" ON lessons;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON lessons;
DROP POLICY IF EXISTS "Allow all for auth users" ON lessons;

-- assignment_items
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignment_items;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignment_items;
DROP POLICY IF EXISTS "Users can update their own assignments" ON assignment_items;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignment_items;
DROP POLICY IF EXISTS "Allow all for auth users" ON assignment_items;

-- resources
DROP POLICY IF EXISTS "Users can view their own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;
DROP POLICY IF EXISTS "Allow all for auth users" ON resources;

-- schedule_items
DROP POLICY IF EXISTS "Users can view their own schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can insert their own schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can update their own schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can delete their own schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Allow all for auth users" ON schedule_items;

-- day_plans
DROP POLICY IF EXISTS "Users can view their own day plans" ON day_plans;
DROP POLICY IF EXISTS "Users can insert their own day plans" ON day_plans;
DROP POLICY IF EXISTS "Users can update their own day plans" ON day_plans;
DROP POLICY IF EXISTS "Users can delete their own day plans" ON day_plans;
DROP POLICY IF EXISTS "Allow all for auth users" ON day_plans;

-- student_unlocks
DROP POLICY IF EXISTS "Auth write student_unlocks" ON student_unlocks;
DROP POLICY IF EXISTS "Public read student_unlocks" ON student_unlocks;
DROP POLICY IF EXISTS "Allow all for auth users" ON student_unlocks;

-- holidays
DROP POLICY IF EXISTS "Allow all for auth users" ON holidays;

-- ai_chat_sessions (if exists)
DROP POLICY IF EXISTS "Users own their sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "Allow all for auth users" ON ai_chat_sessions;

-- saved_ideas
DROP POLICY IF EXISTS "Users can manage their own ideas" ON saved_ideas;
DROP POLICY IF EXISTS "Allow all for auth users" ON saved_ideas;

-- ============================================================================
-- STEP 2: Create OPTIMIZED policies with (select auth.uid())
-- ============================================================================

-- profiles
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- kids (user_id column)
CREATE POLICY "kids_select" ON kids
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "kids_insert" ON kids
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "kids_update" ON kids
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "kids_delete" ON kids
  FOR DELETE USING ((select auth.uid()) = user_id);

-- lessons (user_id column, allow null for legacy)
CREATE POLICY "lessons_select" ON lessons
  FOR SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "lessons_insert" ON lessons
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lessons_update" ON lessons
  FOR UPDATE USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "lessons_delete" ON lessons
  FOR DELETE USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- assignment_items
CREATE POLICY "assignments_select" ON assignment_items
  FOR SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "assignments_insert" ON assignment_items
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "assignments_update" ON assignment_items
  FOR UPDATE USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "assignments_delete" ON assignment_items
  FOR DELETE USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- resources
CREATE POLICY "resources_select" ON resources
  FOR SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "resources_insert" ON resources
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "resources_update" ON resources
  FOR UPDATE USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "resources_delete" ON resources
  FOR DELETE USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- schedule_items
CREATE POLICY "schedule_select" ON schedule_items
  FOR SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "schedule_insert" ON schedule_items
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "schedule_update" ON schedule_items
  FOR UPDATE USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "schedule_delete" ON schedule_items
  FOR DELETE USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- day_plans
CREATE POLICY "dayplans_select" ON day_plans
  FOR SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "dayplans_insert" ON day_plans
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "dayplans_update" ON day_plans
  FOR UPDATE USING ((select auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "dayplans_delete" ON day_plans
  FOR DELETE USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- student_unlocks (linked to kids via kid_id)
CREATE POLICY "unlocks_all" ON student_unlocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kids 
      WHERE kids.id = student_unlocks.kid_id 
      AND kids.user_id = (select auth.uid())
    )
  );

-- holidays (read-only, public to all authenticated users)
CREATE POLICY "holidays_select" ON holidays
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- ai_chat_sessions (user_id column) - if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_chat_sessions') THEN
    EXECUTE 'CREATE POLICY "chat_sessions_all" ON ai_chat_sessions FOR ALL USING ((select auth.uid()) = user_id)';
  END IF;
END $$;

-- saved_ideas (user_id column)
CREATE POLICY "ideas_all" ON saved_ideas
  FOR ALL USING ((select auth.uid()) = user_id);
