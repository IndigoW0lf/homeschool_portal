-- Migration: Reapply Families Policy
-- Description: Fixes visibility issues on the 'families' table by replacing the SELECT policy with a simplified, robust version using user_family_ids().

-- ============================================================================
-- Fix 'families' table RLS
-- ============================================================================

-- Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Users can view their families" ON public.families;
DROP POLICY IF EXISTS "families_select" ON public.families;
DROP POLICY IF EXISTS "families_access" ON public.families;

-- Create robust SELECT policy
-- This allows any user to view a family if they are listed in family_members
CREATE POLICY "families_select" ON public.families
  FOR SELECT USING (
    id IN (SELECT public.user_family_ids())
  );

-- Ensure RLS is enabled
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
