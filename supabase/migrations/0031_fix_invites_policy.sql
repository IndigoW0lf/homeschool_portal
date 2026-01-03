-- 0031: Fix family_invites policy - can't access auth.users table directly
-- Remove the email lookup from auth.users as it causes permission denied

-- Drop existing policies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'family_invites' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.family_invites', pol.policyname);
  END LOOP;
END $$;

-- FAMILY_INVITES: Simpler policy
-- Users can see invites they created or invites for families they belong to
CREATE POLICY "family_invites_access" ON public.family_invites FOR ALL
  USING (
    invited_by = (SELECT auth.uid())
    OR family_id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_invites.family_id 
      AND fm.user_id = (SELECT auth.uid())
      AND fm.role = 'admin'
    )
  );
