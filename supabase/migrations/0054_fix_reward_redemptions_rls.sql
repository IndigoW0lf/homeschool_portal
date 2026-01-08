-- Migration: Fix Reward Redemptions RLS & Student Progress Access
-- Description: Ensures parents can see pending redemptions from their family's kids,
-- and that the API can update student_progress for moon deduction.

-- ============================================================================
-- 1. FIX REWARD_REDEMPTIONS RLS (Optimize auth calls)
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "reward_redemptions_select" ON public.reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_insert" ON public.reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_update" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Public read reward_redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Auth write reward_redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Auth update reward_redemptions" ON public.reward_redemptions;

-- Create optimized policies
-- Parents can view redemptions for their family's kids
CREATE POLICY "reward_redemptions_select" ON public.reward_redemptions
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

-- Anyone can create a redemption (kid portal is unauthenticated)
CREATE POLICY "reward_redemptions_insert" ON public.reward_redemptions
  FOR INSERT WITH CHECK (true);

-- Authenticated users can update redemptions for their family's kids
CREATE POLICY "reward_redemptions_update" ON public.reward_redemptions
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

-- ============================================================================
-- 2. ENSURE STUDENT_PROGRESS ALLOWS API UPDATES
-- ============================================================================

-- The API runs as service role, but let's ensure RLS is correct
DROP POLICY IF EXISTS "student_progress_update" ON public.student_progress;

CREATE POLICY "student_progress_update" ON public.student_progress
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );
