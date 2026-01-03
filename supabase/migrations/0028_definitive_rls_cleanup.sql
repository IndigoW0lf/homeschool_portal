-- 0028: Definitive RLS Policy Cleanup
-- Drops ALL existing policies and recreates with proper patterns:
-- 1. ONE policy per table (using FOR ALL with USING + WITH CHECK)
-- 2. (SELECT auth.uid()) instead of auth.uid()
-- 3. (SELECT auth.role()) instead of auth.role()

-- ============================================================================
-- STEP 1: Drop ALL existing policies on affected tables
-- ============================================================================

-- kids
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'kids' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.kids', pol.policyname);
  END LOOP;
END $$;

-- lessons
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lessons' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lessons', pol.policyname);
  END LOOP;
END $$;

-- lesson_links
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lesson_links' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lesson_links', pol.policyname);
  END LOOP;
END $$;

-- lesson_attachments
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lesson_attachments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lesson_attachments', pol.policyname);
  END LOOP;
END $$;

-- assignments
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignments', pol.policyname);
  END LOOP;
END $$;

-- assignment_kids
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignment_kids' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignment_kids', pol.policyname);
  END LOOP;
END $$;

-- assignment_lessons
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assignment_lessons' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignment_lessons', pol.policyname);
  END LOOP;
END $$;

-- resources
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'resources' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.resources', pol.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create single policy per table with proper patterns
-- ============================================================================

-- KIDS: User-scoped (own data + family access)
CREATE POLICY "kids_access" ON public.kids FOR ALL
  USING (
    user_id = (SELECT auth.uid())
    OR user_id IS NULL
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- LESSONS: User-scoped with public read
CREATE POLICY "lessons_access" ON public.lessons FOR ALL
  USING (
    user_id = (SELECT auth.uid())
    OR user_id IS NULL
    OR (SELECT auth.role()) = 'authenticated'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- LESSON_LINKS: Follows parent lesson access
CREATE POLICY "lesson_links_access" ON public.lesson_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = lesson_id 
      AND (l.user_id = (SELECT auth.uid()) OR l.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = lesson_id 
      AND l.user_id = (SELECT auth.uid())
    )
  );

-- LESSON_ATTACHMENTS: Follows parent lesson access  
CREATE POLICY "lesson_attachments_access" ON public.lesson_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = lesson_id 
      AND (l.user_id = (SELECT auth.uid()) OR l.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = lesson_id 
      AND l.user_id = (SELECT auth.uid())
    )
  );

-- ASSIGNMENTS: User-scoped with public read
CREATE POLICY "assignments_access" ON public.assignments FOR ALL
  USING (
    user_id = (SELECT auth.uid())
    OR user_id IS NULL
    OR (SELECT auth.role()) = 'authenticated'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- ASSIGNMENT_KIDS: Follows parent assignment access
CREATE POLICY "assignment_kids_access" ON public.assignment_kids FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.id = assignment_id 
      AND (a.user_id = (SELECT auth.uid()) OR a.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.id = assignment_id 
      AND a.user_id = (SELECT auth.uid())
    )
  );

-- ASSIGNMENT_LESSONS: Follows parent assignment access
CREATE POLICY "assignment_lessons_access" ON public.assignment_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.id = assignment_id 
      AND (a.user_id = (SELECT auth.uid()) OR a.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.id = assignment_id 
      AND a.user_id = (SELECT auth.uid())
    )
  );

-- RESOURCES: User-scoped with public read
CREATE POLICY "resources_access" ON public.resources FOR ALL
  USING (
    user_id = (SELECT auth.uid())
    OR user_id IS NULL
    OR (SELECT auth.role()) = 'authenticated'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );
