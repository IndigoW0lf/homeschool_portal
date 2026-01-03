-- ============================================================
-- AGGRESSIVE RLS POLICY CLEANUP
-- This migration drops ALL existing policies and recreates clean ones
-- ============================================================

-- ============================================================
-- 1. FIX generate_miacademy_schedule - drop ALL versions
-- ============================================================
DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Drop all functions named generate_miacademy_schedule regardless of signature
  FOR func_record IN 
    SELECT proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc 
    WHERE proname = 'generate_miacademy_schedule' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.generate_miacademy_schedule(%s)', func_record.args);
  END LOOP;
END $$;

CREATE FUNCTION public.generate_miacademy_schedule(
  start_date DATE,
  end_date DATE,
  kid_ids TEXT[]
)
RETURNS TABLE(
  schedule_date DATE,
  kid_id TEXT,
  day_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d::DATE AS schedule_date,
    k.id AS kid_id,
    TO_CHAR(d, 'Day') AS day_name
  FROM generate_series(start_date, end_date, '1 day'::interval) d
  CROSS JOIN UNNEST(kid_ids) AS k(id)
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- ============================================================
-- 2. KIDS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'kids' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.kids', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "kids_read" ON public.kids FOR SELECT USING (true);
CREATE POLICY "kids_write" ON public.kids FOR ALL 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL)
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

-- ============================================================
-- 3. ASSIGNMENT_ITEMS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignment_items' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignment_items', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "assignment_items_read" ON public.assignment_items FOR SELECT 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);
CREATE POLICY "assignment_items_write" ON public.assignment_items FOR ALL 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- 4. DAY_PLANS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'day_plans' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.day_plans', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "day_plans_access" ON public.day_plans FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 5. HOLIDAYS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'holidays' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.holidays', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "holidays_read" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "holidays_write" ON public.holidays FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 6. JOURNAL_ENTRIES - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journal_entries') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'journal_entries' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.journal_entries', pol.policyname);
    END LOOP;
    
    EXECUTE 'CREATE POLICY "journal_entries_read" ON public.journal_entries FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "journal_entries_write" ON public.journal_entries FOR ALL 
      USING ((SELECT auth.role()) = ''authenticated'')
      WITH CHECK ((SELECT auth.role()) = ''authenticated'')';
  END IF;
END $$;

-- ============================================================
-- 7. KID_REWARDS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kid_rewards') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'kid_rewards' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.kid_rewards', pol.policyname);
    END LOOP;
    
    EXECUTE 'CREATE POLICY "kid_rewards_read" ON public.kid_rewards FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "kid_rewards_write" ON public.kid_rewards FOR ALL 
      USING ((SELECT auth.role()) = ''authenticated'')
      WITH CHECK ((SELECT auth.role()) = ''authenticated'')';
  END IF;
END $$;

-- ============================================================
-- 8. LESSON_ATTACHMENTS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lesson_attachments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lesson_attachments', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "lesson_attachments_read" ON public.lesson_attachments FOR SELECT USING (true);
CREATE POLICY "lesson_attachments_write" ON public.lesson_attachments FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 9. LESSON_LINKS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lesson_links' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lesson_links', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "lesson_links_read" ON public.lesson_links FOR SELECT USING (true);
CREATE POLICY "lesson_links_write" ON public.lesson_links FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 10. PROGRESS_AWARDS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'progress_awards' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.progress_awards', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "progress_awards_read" ON public.progress_awards FOR SELECT USING (true);
CREATE POLICY "progress_awards_write" ON public.progress_awards FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 11. SAVED_IDEAS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'saved_ideas' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.saved_ideas', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "saved_ideas_read" ON public.saved_ideas FOR SELECT 
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "saved_ideas_write" ON public.saved_ideas FOR ALL 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- 12. SCHEDULE_ITEMS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'schedule_items' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.schedule_items', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "schedule_items_read" ON public.schedule_items FOR SELECT 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);
CREATE POLICY "schedule_items_write" ON public.schedule_items FOR ALL 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- 13. STUDENT_PROGRESS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_progress' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_progress', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "student_progress_read" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "student_progress_write" ON public.student_progress FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 14. STUDENT_UNLOCKS - Drop ALL policies, create clean ones
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_unlocks' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_unlocks', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "student_unlocks_read" ON public.student_unlocks FOR SELECT USING (true);
CREATE POLICY "student_unlocks_write" ON public.student_unlocks FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');
