-- Migration: Multi-Adult Support via Family/Household Model
-- Creates families, family_members, and family_invites tables
-- Updates existing tables to use family_id for ownership

-- ============================================================================
-- STEP 1: Create families table
-- ============================================================================

CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create family_members junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ DEFAULT NOW(), -- NULL if pending
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

-- ============================================================================
-- STEP 3: Create family_invites table for pending invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ, -- NULL until accepted
  UNIQUE(family_id, email)
);

ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(email);
CREATE INDEX IF NOT EXISTS idx_family_invites_family_id ON family_invites(family_id);

-- ============================================================================
-- STEP 4: Add family_id to kids table
-- ============================================================================

ALTER TABLE kids ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_kids_family_id ON kids(family_id);

-- ============================================================================
-- STEP 5: Helper function to check family membership
-- ============================================================================

CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_has_family_access(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid() AND family_id = target_family_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_is_family_admin(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid() 
    AND family_id = target_family_id 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 6: RLS Policies for families
-- ============================================================================

-- Users can view families they are members of
CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (user_has_family_access(id) OR created_by = auth.uid());

-- Users can create families
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update their family
CREATE POLICY "Admins can update their family"
  ON families FOR UPDATE
  USING (user_is_family_admin(id));

-- ============================================================================
-- STEP 7: RLS Policies for family_members
-- ============================================================================

-- Members can view other members of their families
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (user_has_family_access(family_id));

-- Admins can add members (or system during signup)
CREATE POLICY "Admins can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    user_is_family_admin(family_id) 
    OR (auth.uid() = user_id AND auth.uid() IS NOT NULL) -- Self-join via invite
  );

-- Admins can remove members
CREATE POLICY "Admins can remove family members"
  ON family_members FOR DELETE
  USING (user_is_family_admin(family_id) OR user_id = auth.uid());

-- ============================================================================
-- STEP 8: RLS Policies for family_invites
-- ============================================================================

-- Family members can view invites for their family
CREATE POLICY "Members can view family invites"
  ON family_invites FOR SELECT
  USING (
    user_has_family_access(family_id) 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can create invites
CREATE POLICY "Admins can create invites"
  ON family_invites FOR INSERT
  WITH CHECK (user_is_family_admin(family_id));

-- Admins can delete invites, or invitee can "accept" (which deletes)
CREATE POLICY "Admins can delete invites"
  ON family_invites FOR DELETE
  USING (
    user_is_family_admin(family_id) 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================================================
-- STEP 9: Update kids RLS to use family_id (alongside user_id for migration)
-- ============================================================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Users can manage their own kids" ON kids;

-- New policy: access via family OR legacy user_id
CREATE POLICY "Users can access family kids"
  ON kids FOR SELECT
  USING (
    family_id IN (SELECT user_family_ids())
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

CREATE POLICY "Users can insert family kids"
  ON kids FOR INSERT
  WITH CHECK (
    family_id IN (SELECT user_family_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update family kids"
  ON kids FOR UPDATE
  USING (
    family_id IN (SELECT user_family_ids())
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

CREATE POLICY "Users can delete family kids"
  ON kids FOR DELETE
  USING (
    family_id IN (SELECT user_family_ids())
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

-- ============================================================================
-- STEP 10: Auto-create family on user signup (update existing trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create a family for the new user
  INSERT INTO public.families (name, created_by)
  VALUES ('My Family', NEW.id)
  RETURNING id INTO new_family_id;
  
  -- Add user as admin of their family
  INSERT INTO public.family_members (family_id, user_id, role, accepted_at)
  VALUES (new_family_id, NEW.id, 'admin', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 11: Updated_at trigger for families
-- ============================================================================

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 12: Migrate existing users to family model
-- This creates families for existing users and links their kids
-- ============================================================================

-- Create families for existing users who don't have one
INSERT INTO families (name, created_by)
SELECT 'My Family', p.id
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM family_members fm WHERE fm.user_id = p.id
);

-- Add existing users as admins of their families
INSERT INTO family_members (family_id, user_id, role, accepted_at)
SELECT f.id, f.created_by, 'admin', NOW()
FROM families f
WHERE f.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM family_members fm 
  WHERE fm.family_id = f.id AND fm.user_id = f.created_by
);

-- Link existing kids to their owner's family
UPDATE kids k
SET family_id = (
  SELECT f.id FROM families f
  JOIN family_members fm ON fm.family_id = f.id
  WHERE fm.user_id = k.user_id
  LIMIT 1
)
WHERE k.family_id IS NULL AND k.user_id IS NOT NULL;
