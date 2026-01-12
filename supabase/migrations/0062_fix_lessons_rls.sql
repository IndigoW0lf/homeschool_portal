-- Fix lessons RLS policy to allow authenticated users to update lessons
-- The previous policy required user_id to match, but some lessons may have been
-- created by different users or imported without user_id set.

-- Drop existing policy
DROP POLICY IF EXISTS "lessons_access" ON public.lessons;

-- Recreate with relaxed update permissions
-- Users can read any lesson, and authenticated users can update any lesson they can read
CREATE POLICY "lessons_access" ON public.lessons FOR ALL
  USING (
    -- Read: anyone authenticated can see all lessons
    (SELECT auth.role()) = 'authenticated'
  )
  WITH CHECK (
    -- Write: authenticated users can create/update lessons
    (SELECT auth.role()) = 'authenticated'
  );
