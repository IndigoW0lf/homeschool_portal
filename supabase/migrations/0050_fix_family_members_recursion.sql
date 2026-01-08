-- Fix infinite recursion in family_members RLS policy
-- The previous policy queried family_members to check access to family_members

DROP POLICY IF EXISTS "family_members_select" ON family_members;

-- Use the SECURITY DEFINER function to avoid recursion
CREATE POLICY "family_members_select" ON family_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR family_id IN (SELECT user_family_ids())
  );
