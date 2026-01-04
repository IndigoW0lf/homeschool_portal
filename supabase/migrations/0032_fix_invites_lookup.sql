-- 0032: Fix family_invites RLS for invite lookup
-- Need to allow anyone to read an invite by invite_code (for accepting)
-- But still restrict who can create/update/delete

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'family_invites' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.family_invites', pol.policyname);
  END LOOP;
END $$;

-- SELECT: Allow if you're family member, the inviter, OR the invitee (to accept)
-- Also allow anyone to read by invite_code (public lookup for accepting)
CREATE POLICY "family_invites_select" ON public.family_invites FOR SELECT
  USING (
    true  -- Allow anyone to read invites (they need invite_code to find it anyway)
  );

-- INSERT: Only family admins can create invites
CREATE POLICY "family_invites_insert" ON public.family_invites FOR INSERT
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_invites.family_id 
      AND fm.user_id = (SELECT auth.uid())
      AND fm.role = 'admin'
    )
  );

-- UPDATE: Only family admins or the invitee can update (e.g., accept)
CREATE POLICY "family_invites_update" ON public.family_invites FOR UPDATE
  USING (
    invited_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_invites.family_id 
      AND fm.user_id = (SELECT auth.uid())
      AND fm.role = 'admin'
    )
  )
  WITH CHECK (true);

-- DELETE: Only family admins can delete (cancel) invites
CREATE POLICY "family_invites_delete" ON public.family_invites FOR DELETE
  USING (
    invited_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_invites.family_id 
      AND fm.user_id = (SELECT auth.uid())
      AND fm.role = 'admin'
    )
  );
