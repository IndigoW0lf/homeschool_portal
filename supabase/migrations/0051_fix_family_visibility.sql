-- Migration: Fix Family Visibility (Dependency Safe)
-- Description: Updates user_family_ids() in-place to fix RLS issues without breaking dependent policies.

-- ============================================================================
-- 1. Update helper function (CREATE OR REPLACE preserves dependencies)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id 
  FROM public.family_members 
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth;

-- ============================================================================
-- 2. Fix variable definitions (just in case)
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_family_access(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid()
    AND family_id = target_family_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION user_is_family_admin(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid()
    AND family_id = target_family_id 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth;

-- ============================================================================
-- 3. Re-create the problematic RLS Policy
-- ============================================================================

DROP POLICY IF EXISTS "family_members_select" ON public.family_members;

CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR 
    family_id IN (SELECT public.user_family_ids())
  );

-- Ensure RLS is enabled
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
