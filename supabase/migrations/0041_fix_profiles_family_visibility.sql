-- Fix family_members SELECT to use simpler direct lookup
-- The user_has_family_access function may have recursion/caching issues

DROP POLICY IF EXISTS "Members can view family members" ON family_members;

-- Simple direct policy: you can see family_members if you are a member of that family
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Also ensure profiles visibility for family members
DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT 
  USING (
    id = auth.uid()
    OR id IN (
      -- Allow seeing profiles of users in the same family
      SELECT fm2.user_id 
      FROM family_members fm1
      JOIN family_members fm2 ON fm2.family_id = fm1.family_id
      WHERE fm1.user_id = auth.uid()
    )
  );
