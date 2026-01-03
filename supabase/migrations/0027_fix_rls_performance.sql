-- Migration: Fix RLS Policy Performance Warnings
-- 1. Drops old duplicate kids_access policy
-- 2. Updates helper functions to use (select auth.uid()) pattern
-- 3. Recreates all family-related policies with optimized auth calls

-- ============================================================================
-- STEP 1: Drop old duplicate policy on kids table
-- ============================================================================

DROP POLICY IF EXISTS "kids_access" ON kids;
DROP POLICY IF EXISTS "Users can manage their own kids" ON kids;

-- ============================================================================
-- STEP 2: Drop and recreate helper functions with optimized auth calls
-- and secure search_path settings
-- ============================================================================

-- Helper function using subquery for auth.uid()
CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id 
  FROM public.family_members 
  WHERE user_id = (SELECT auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION user_has_family_access(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.family_members 
    WHERE user_id = (SELECT auth.uid()) 
    AND family_id = target_family_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION user_is_family_admin(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.family_members 
    WHERE user_id = (SELECT auth.uid())
    AND family_id = target_family_id 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- Also fix handle_new_user function
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- ============================================================================
-- STEP 3: Recreate families policies with optimized auth calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their families" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Admins can update their family" ON families;

CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (user_has_family_access(id) OR created_by = (SELECT auth.uid()));

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Admins can update their family"
  ON families FOR UPDATE
  USING (user_is_family_admin(id));

-- ============================================================================
-- STEP 4: Recreate family_members policies with optimized auth calls
-- ============================================================================

DROP POLICY IF EXISTS "Members can view family members" ON family_members;
DROP POLICY IF EXISTS "Admins can add family members" ON family_members;
DROP POLICY IF EXISTS "Admins can remove family members" ON family_members;

CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (user_has_family_access(family_id));

CREATE POLICY "Admins can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    user_is_family_admin(family_id) 
    OR ((SELECT auth.uid()) = user_id AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Admins can remove family members"
  ON family_members FOR DELETE
  USING (user_is_family_admin(family_id) OR user_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 5: Recreate family_invites policies with optimized auth calls
-- ============================================================================

DROP POLICY IF EXISTS "Members can view family invites" ON family_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON family_invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON family_invites;

CREATE POLICY "Members can view family invites"
  ON family_invites FOR SELECT
  USING (
    user_has_family_access(family_id) 
    OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins can create invites"
  ON family_invites FOR INSERT
  WITH CHECK (user_is_family_admin(family_id));

CREATE POLICY "Admins can delete invites"
  ON family_invites FOR DELETE
  USING (
    user_is_family_admin(family_id) 
    OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- ============================================================================
-- STEP 6: Recreate kids policies with optimized auth calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can access family kids" ON kids;
DROP POLICY IF EXISTS "Users can insert family kids" ON kids;
DROP POLICY IF EXISTS "Users can update family kids" ON kids;
DROP POLICY IF EXISTS "Users can delete family kids" ON kids;

-- Single unified policy for each action
CREATE POLICY "Users can access family kids"
  ON kids FOR SELECT
  USING (
    family_id IN (SELECT user_family_ids())
    OR user_id = (SELECT auth.uid())
    OR user_id IS NULL
  );

CREATE POLICY "Users can insert family kids"
  ON kids FOR INSERT
  WITH CHECK (
    family_id IN (SELECT user_family_ids())
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update family kids"
  ON kids FOR UPDATE
  USING (
    family_id IN (SELECT user_family_ids())
    OR user_id = (SELECT auth.uid())
    OR user_id IS NULL
  );

CREATE POLICY "Users can delete family kids"
  ON kids FOR DELETE
  USING (
    family_id IN (SELECT user_family_ids())
    OR user_id = (SELECT auth.uid())
    OR user_id IS NULL
  );
