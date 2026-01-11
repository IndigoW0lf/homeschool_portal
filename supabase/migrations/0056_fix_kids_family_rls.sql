-- Migration: Fix Kids RLS for Family-Based Access
-- Description: Replaces owner-only kids RLS policies with family-based ones.
-- The previous migration (0023) overwrote the family-based policies from 0025.

-- ============================================================================
-- Drop ALL existing kids policies dynamically (per workflow rule #7)
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies 
             WHERE tablename = 'kids' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.kids', pol.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- Create single family-based policy (per workflow rule #1)
-- ============================================================================

-- Single policy for all operations - family members have full access
CREATE POLICY "kids_family_access" ON public.kids
  FOR ALL
  USING (family_id IN (SELECT public.user_family_ids()))
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));
