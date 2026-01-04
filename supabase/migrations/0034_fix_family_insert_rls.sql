-- Migration: Fix family setup for existing users
-- This ensures all existing users have a family and are linked to it

-- 1. Fix RLS for families table INSERT
DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix family_members RLS for self-insert
DROP POLICY IF EXISTS "Admins can add family members" ON family_members;
DROP POLICY IF EXISTS "Users can add family members" ON family_members;
CREATE POLICY "Users can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    user_is_family_admin(family_id) 
    OR user_id = auth.uid()
  );

-- 3. Create families for existing users who don't have one
INSERT INTO families (name, created_by)
SELECT 'My Family', p.id
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM family_members fm WHERE fm.user_id = p.id
)
ON CONFLICT DO NOTHING;

-- 4. Add existing users as admins of their families
INSERT INTO family_members (family_id, user_id, role, accepted_at)
SELECT f.id, f.created_by, 'admin', NOW()
FROM families f
WHERE f.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM family_members fm 
  WHERE fm.family_id = f.id AND fm.user_id = f.created_by
)
ON CONFLICT DO NOTHING;

-- 5. Link existing kids to their owner's family
UPDATE kids k
SET family_id = (
  SELECT f.id FROM families f
  JOIN family_members fm ON fm.family_id = f.id
  WHERE fm.user_id = k.user_id
  LIMIT 1
)
WHERE k.family_id IS NULL AND k.user_id IS NOT NULL;
