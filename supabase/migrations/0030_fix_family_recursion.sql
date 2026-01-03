-- 0030: Fix infinite recursion in family_members policy
-- The policy was checking family_members to access family_members = infinite loop
-- Fix: Use simple user_id check instead of subquery

-- Drop existing policies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'family_members' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.family_members', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'families' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.families', pol.policyname);
  END LOOP;
END $$;

-- FAMILY_MEMBERS: Simple policy - users can see rows where they are the user
-- To check "am I in this family", we just check if any row exists with their user_id
CREATE POLICY "family_members_access" ON public.family_members FOR ALL
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- FAMILIES: Users can access families they created or are members of
-- Use a simple approach: allow if user created it, or check via member relationship
CREATE POLICY "families_access" ON public.families FOR ALL
  USING (
    created_by = (SELECT auth.uid())
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
  );
