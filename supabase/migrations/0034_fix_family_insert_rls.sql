-- Migration: Fix RLS for families table INSERT
-- Ensures authenticated users can create families

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create families" ON families;

-- Re-create the INSERT policy
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure family_members allows self-insert for first user of new family
DROP POLICY IF EXISTS "Admins can add family members" ON family_members;

CREATE POLICY "Users can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    user_is_family_admin(family_id) 
    OR user_id = auth.uid()  -- Users can add themselves
  );
