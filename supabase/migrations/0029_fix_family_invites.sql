-- 0029: Fix family_invites schema
-- Adds missing invite_code column and fixes RLS

-- Add invite_code column with auto-generated UUID
ALTER TABLE family_invites 
ADD COLUMN IF NOT EXISTS invite_code UUID DEFAULT gen_random_uuid();

-- Create unique index on invite_code
CREATE INDEX IF NOT EXISTS idx_family_invites_invite_code ON family_invites(invite_code);

-- Add status column if missing
ALTER TABLE family_invites
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));

-- Ensure RLS is enabled
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'family_invites' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.family_invites', pol.policyname);
  END LOOP;
END $$;

-- Create proper RLS policy for family_invites
-- Users can see invites they sent, or invites for their email
CREATE POLICY "family_invites_access" ON public.family_invites FOR ALL
  USING (
    invited_by = (SELECT auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_invites.family_id 
      AND fm.user_id = (SELECT auth.uid())
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

-- Also fix families and family_members RLS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'families' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.families', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'family_members' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.family_members', pol.policyname);
  END LOOP;
END $$;

-- Families: Members can see their family
CREATE POLICY "families_access" ON public.families FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = families.id 
      AND fm.user_id = (SELECT auth.uid())
    )
    OR created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = families.id 
      AND fm.user_id = (SELECT auth.uid())
      AND fm.role = 'admin'
    )
  );

-- Family members: Members can see their family's members
CREATE POLICY "family_members_access" ON public.family_members FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm 
      WHERE fm.user_id = (SELECT auth.uid())
    )
    OR user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_members.family_id 
      AND fm.user_id = (SELECT auth.uid())
      AND fm.role = 'admin'
    )
    OR user_id = (SELECT auth.uid())
  );
