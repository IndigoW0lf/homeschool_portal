-- Migration: Fix RLS Performance V2
-- Description: Consolidates duplicate policies and optimizes auth calls to use (SELECT auth.uid()) 
-- to prevent per-row re-evaluation (auth_rls_initplan warning) and multiple permissive policies.

-- ============================================================================
-- 1. FAMILY MEMBERS
-- ============================================================================

-- Drop redundant "English sentence" policies
DROP POLICY IF EXISTS "Users can add family members" ON public.family_members;
DROP POLICY IF EXISTS "Members can view family members" ON public.family_members;
DROP POLICY IF EXISTS "Admins can add family members" ON public.family_members;
DROP POLICY IF EXISTS "Admins can remove family members" ON public.family_members;

-- Drop snake_case policies to recreate them optimized
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;

-- Recreate optimized policies
CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR 
    family_id IN (SELECT public.user_family_ids())
  );

CREATE POLICY "family_members_insert" ON public.family_members
  FOR INSERT WITH CHECK (
    -- User can add themselves (joining) OR Admin can add others
    (user_id = (SELECT auth.uid()))
    OR
    public.user_is_family_admin(family_id)
  );

CREATE POLICY "family_members_update" ON public.family_members
  FOR UPDATE USING (
    public.user_is_family_admin(family_id)
  );

CREATE POLICY "family_members_delete" ON public.family_members
  FOR DELETE USING (
    -- User can leave OR Admin can remove
    user_id = (SELECT auth.uid())
    OR
    public.user_is_family_admin(family_id)
  );

-- ============================================================================
-- 2. FAMILIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create families" ON public.families;
DROP POLICY IF EXISTS "Users can view their families" ON public.families;
DROP POLICY IF EXISTS "Admins can update their family" ON public.families;

-- families_select was already fixed in 0052, but we ensure it's optimized here
-- (It uses user_family_ids which is already a function call, so effectively InitPlan, but good to be explicit)

DROP POLICY IF EXISTS "families_insert" ON public.families;
CREATE POLICY "families_insert" ON public.families
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS "families_update" ON public.families;
CREATE POLICY "families_update" ON public.families
  FOR UPDATE USING (
    public.user_is_family_admin(id)
  );

DROP POLICY IF EXISTS "families_delete" ON public.families;
CREATE POLICY "families_delete" ON public.families
  FOR DELETE USING (
    public.user_is_family_admin(id)
  );


-- ============================================================================
-- 3. JOURNAL ENTRIES
-- ============================================================================

-- Drop potential duplicates
DROP POLICY IF EXISTS "journal_entries_family_access" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_select" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_update" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_delete" ON public.journal_entries;

CREATE POLICY "journal_entries_select" ON public.journal_entries
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "journal_entries_insert" ON public.journal_entries
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "journal_entries_update" ON public.journal_entries
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "journal_entries_delete" ON public.journal_entries
  FOR DELETE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 4. KID REWARDS
-- ============================================================================

DROP POLICY IF EXISTS "kid_rewards_family_access" ON public.kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_select" ON public.kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_insert" ON public.kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_update" ON public.kid_rewards;
DROP POLICY IF EXISTS "kid_rewards_delete" ON public.kid_rewards;

CREATE POLICY "kid_rewards_select" ON public.kid_rewards
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "kid_rewards_insert" ON public.kid_rewards
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "kid_rewards_update" ON public.kid_rewards
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "kid_rewards_delete" ON public.kid_rewards
  FOR DELETE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 5. PROGRESS AWARDS
-- ============================================================================

DROP POLICY IF EXISTS "progress_awards_family_access" ON public.progress_awards;
DROP POLICY IF EXISTS "progress_awards_select" ON public.progress_awards;
DROP POLICY IF EXISTS "progress_awards_insert" ON public.progress_awards;
-- Usually read-only/append-only, but good to be thorough if they exist

CREATE POLICY "progress_awards_select" ON public.progress_awards
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "progress_awards_insert" ON public.progress_awards
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 6. STUDENT PROGRESS
-- ============================================================================

DROP POLICY IF EXISTS "student_progress_family_access" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_select" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_insert" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_update" ON public.student_progress;

CREATE POLICY "student_progress_select" ON public.student_progress
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "student_progress_insert" ON public.student_progress
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "student_progress_update" ON public.student_progress
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 7. STUDENT UNLOCKS
-- ============================================================================

DROP POLICY IF EXISTS "student_unlocks_family_access" ON public.student_unlocks;
DROP POLICY IF EXISTS "student_unlocks_select" ON public.student_unlocks;
DROP POLICY IF EXISTS "student_unlocks_insert" ON public.student_unlocks;

CREATE POLICY "student_unlocks_select" ON public.student_unlocks
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "student_unlocks_insert" ON public.student_unlocks
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 8. WORKSHEET RESPONSES
-- ============================================================================

DROP POLICY IF EXISTS "worksheet_responses_access" ON public.worksheet_responses;
DROP POLICY IF EXISTS "worksheet_responses_select" ON public.worksheet_responses;
DROP POLICY IF EXISTS "worksheet_responses_insert" ON public.worksheet_responses;
DROP POLICY IF EXISTS "worksheet_responses_update" ON public.worksheet_responses;

CREATE POLICY "worksheet_responses_select" ON public.worksheet_responses
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "worksheet_responses_insert" ON public.worksheet_responses
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "worksheet_responses_update" ON public.worksheet_responses
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 9. SCHEDULE ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "schedule_items_access" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_select" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_insert" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_update" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_delete" ON public.schedule_items;

CREATE POLICY "schedule_items_select" ON public.schedule_items
  FOR SELECT USING (
    -- Access if user owns it OR it belongs to a student in their family
    user_id = (SELECT auth.uid())
    OR
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "schedule_items_insert" ON public.schedule_items
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    OR
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "schedule_items_update" ON public.schedule_items
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
    OR
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );

CREATE POLICY "schedule_items_delete" ON public.schedule_items
  FOR DELETE USING (
    user_id = (SELECT auth.uid())
    OR
    student_id IN (SELECT id FROM kids WHERE family_id IN (SELECT public.user_family_ids()))
  );


-- ============================================================================
-- 10. PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "profiles_unified_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = (SELECT auth.uid())
    OR 
    id IN (
      SELECT fm.user_id FROM public.family_members fm 
      WHERE fm.family_id IN (SELECT public.user_family_ids())
    )
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = (SELECT auth.uid())
  );
