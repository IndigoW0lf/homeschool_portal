-- Fix profiles RLS to allow viewing family members' profiles
-- This enables the family members list to show all members, not just yourself

DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- Allow viewing your own profile OR profiles of users in your family
CREATE POLICY "profiles_select" ON profiles FOR SELECT 
  USING (
    id = auth.uid()
    OR id IN (
      SELECT fm.user_id FROM family_members fm
      WHERE fm.family_id IN (SELECT user_family_ids())
    )
  );
