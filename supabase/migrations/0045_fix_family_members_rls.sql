-- Fix circular dependency in family_members RLS policy
-- The existing policy used user_has_family_access() which queries family_members
-- This creates a circular dependency - users can't query their own membership!

-- Drop existing policy
DROP POLICY IF EXISTS "Members can view family members" ON family_members;

-- Create fixed policy: users can view members of any family they belong to
-- Use a direct subquery instead of the helper function to avoid circular dependency
CREATE POLICY "Members can view family members" ON family_members
  FOR SELECT USING (
    -- Direct check: user belongs to this family (same family_id)
    family_id IN (
      SELECT fm.family_id 
      FROM family_members fm 
      WHERE fm.user_id = auth.uid()
    )
    -- OR it's the user's own membership record
    OR user_id = auth.uid()
  );

-- Also ensure the user_family_ids function is SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id 
  FROM public.family_members 
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';
