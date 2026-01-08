-- COMPREHENSIVE RLS FIX
-- This migration fixes all family-based RLS issues by:
-- 1. Creating missing reward_redemptions table
-- 2. Making helper functions SECURITY DEFINER (bypass RLS)
-- 3. Removing circular dependencies in family_members
-- 4. Ensuring all family-related tables have proper access

-- ============================================================================
-- STEP 0: Create missing reward_redemptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kid_id text NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.kid_rewards(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  redeemed_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id),
  CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id)
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_kid_id ON reward_redemptions(kid_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- ============================================================================
-- STEP 1: Recreate helper functions with SECURITY DEFINER
-- These MUST bypass RLS to avoid circular dependencies
-- ============================================================================

CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id 
  FROM public.family_members 
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION user_has_family_access(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.family_members 
    WHERE user_id = auth.uid()
    AND family_id = target_family_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION user_is_family_admin(target_family_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.family_members 
    WHERE user_id = auth.uid()
    AND family_id = target_family_id 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth;

-- ============================================================================
-- STEP 2: Fix family_members RLS (the root cause of most issues)
-- ============================================================================

DROP POLICY IF EXISTS "Members can view family members" ON family_members;
DROP POLICY IF EXISTS "family_members_select" ON family_members;
DROP POLICY IF EXISTS "Admins can add family members" ON family_members;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "Admins can remove family members" ON family_members;
DROP POLICY IF EXISTS "family_members_delete" ON family_members;
DROP POLICY IF EXISTS "family_members_update" ON family_members;

-- SELECT: User can see their own record + anyone in same family
CREATE POLICY "family_members_select" ON family_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR family_id IN (
      SELECT user_family_ids()
    )
  );

-- INSERT: Users can add themselves or admins can add others
CREATE POLICY "family_members_insert" ON family_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_members.family_id 
      AND fm.user_id = auth.uid() 
      AND fm.role = 'admin'
    )
  );

-- UPDATE: Admins can update
CREATE POLICY "family_members_update" ON family_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_members.family_id 
      AND fm.user_id = auth.uid() 
      AND fm.role = 'admin'
    )
  );

-- DELETE: Admins or self
CREATE POLICY "family_members_delete" ON family_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_members.family_id 
      AND fm.user_id = auth.uid() 
      AND fm.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 3: Fix profiles RLS
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM family_members 
      WHERE family_id IN (SELECT user_family_ids())
    )
  );

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- STEP 4: Fix shop_purchases RLS
-- ============================================================================

DROP POLICY IF EXISTS "shop_purchases_select" ON shop_purchases;
DROP POLICY IF EXISTS "shop_purchases_insert" ON shop_purchases;
DROP POLICY IF EXISTS "shop_purchases_update" ON shop_purchases;

CREATE POLICY "shop_purchases_select" ON shop_purchases
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "shop_purchases_insert" ON shop_purchases
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "shop_purchases_update" ON shop_purchases
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 5: Fix reward_redemptions RLS (newly created table)
-- ============================================================================

DROP POLICY IF EXISTS "reward_redemptions_select" ON reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_insert" ON reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_update" ON reward_redemptions;

CREATE POLICY "reward_redemptions_select" ON reward_redemptions
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "reward_redemptions_insert" ON reward_redemptions
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "reward_redemptions_update" ON reward_redemptions
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 6: Fix kid_rewards RLS
-- ============================================================================

DROP POLICY IF EXISTS "kid_rewards_select" ON kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_insert" ON kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_update" ON kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_delete" ON kid_rewards;

CREATE POLICY "kid_rewards_select" ON kid_rewards
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "kid_rewards_insert" ON kid_rewards
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "kid_rewards_update" ON kid_rewards
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "kid_rewards_delete" ON kid_rewards
  FOR DELETE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 7: Fix schedule_items RLS
-- ============================================================================

DROP POLICY IF EXISTS "schedule_items_select" ON schedule_items;
DROP POLICY IF EXISTS "schedule_items_insert" ON schedule_items;
DROP POLICY IF EXISTS "schedule_items_update" ON schedule_items;
DROP POLICY IF EXISTS "schedule_items_delete" ON schedule_items;
DROP POLICY IF EXISTS "Users can view schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can create schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can update schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can delete schedule items" ON schedule_items;

CREATE POLICY "schedule_items_select" ON schedule_items
  FOR SELECT USING (
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
    OR user_id = auth.uid()
  );

CREATE POLICY "schedule_items_insert" ON schedule_items
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
    OR user_id = auth.uid()
  );

CREATE POLICY "schedule_items_update" ON schedule_items
  FOR UPDATE USING (
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
    OR user_id = auth.uid()
  );

CREATE POLICY "schedule_items_delete" ON schedule_items
  FOR DELETE USING (
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
    OR user_id = auth.uid()
  );

-- ============================================================================
-- STEP 8: Fix student_progress RLS
-- ============================================================================

DROP POLICY IF EXISTS "student_progress_select" ON student_progress;
DROP POLICY IF EXISTS "student_progress_insert" ON student_progress;
DROP POLICY IF EXISTS "student_progress_update" ON student_progress;

CREATE POLICY "student_progress_select" ON student_progress
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "student_progress_insert" ON student_progress
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "student_progress_update" ON student_progress
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 9: Fix student_unlocks RLS
-- ============================================================================

DROP POLICY IF EXISTS "student_unlocks_select" ON student_unlocks;
DROP POLICY IF EXISTS "student_unlocks_insert" ON student_unlocks;

CREATE POLICY "student_unlocks_select" ON student_unlocks
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "student_unlocks_insert" ON student_unlocks
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 10: Fix progress_awards RLS
-- ============================================================================

DROP POLICY IF EXISTS "progress_awards_select" ON progress_awards;
DROP POLICY IF EXISTS "progress_awards_insert" ON progress_awards;

CREATE POLICY "progress_awards_select" ON progress_awards
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "progress_awards_insert" ON progress_awards
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 11: Fix journal_entries RLS
-- ============================================================================

DROP POLICY IF EXISTS "journal_entries_select" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_update" ON journal_entries;

CREATE POLICY "journal_entries_select" ON journal_entries
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "journal_entries_insert" ON journal_entries
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "journal_entries_update" ON journal_entries
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 12: Fix external_curriculum RLS
-- ============================================================================

DROP POLICY IF EXISTS "external_curriculum_select" ON external_curriculum;
DROP POLICY IF EXISTS "external_curriculum_insert" ON external_curriculum;

CREATE POLICY "external_curriculum_select" ON external_curriculum
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "external_curriculum_insert" ON external_curriculum
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- STEP 13: Fix worksheet_responses RLS
-- ============================================================================

DROP POLICY IF EXISTS "worksheet_responses_select" ON worksheet_responses;
DROP POLICY IF EXISTS "worksheet_responses_insert" ON worksheet_responses;
DROP POLICY IF EXISTS "worksheet_responses_update" ON worksheet_responses;

CREATE POLICY "worksheet_responses_select" ON worksheet_responses
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "worksheet_responses_insert" ON worksheet_responses
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "worksheet_responses_update" ON worksheet_responses
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- DONE - Comprehensive RLS fix complete
-- ============================================================================
