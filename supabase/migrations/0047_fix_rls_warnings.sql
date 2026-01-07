-- Comprehensive RLS Policy Fixes
-- Addresses: overly permissive policies, auth.uid() performance, duplicate policies

-- ============================================================================
-- SECTION 1: Fix USING (true) policies - Replace with family-based access
-- ============================================================================

-- 1. assignment_kids - link to kids table for family access
DROP POLICY IF EXISTS "assignment_kids_access" ON assignment_kids;
CREATE POLICY "assignment_kids_family_access" ON assignment_kids FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- 2. assignment_lessons - linked content, authenticated users only
DROP POLICY IF EXISTS "assignment_lessons_access" ON assignment_lessons;
CREATE POLICY "assignment_lessons_family_access" ON assignment_lessons FOR ALL
  USING (
    (SELECT auth.uid()) IS NOT NULL
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

-- 3. assignments - authenticated users only (table has no user_id column)
DROP POLICY IF EXISTS "assignments_access" ON assignments;
CREATE POLICY "assignments_family_access" ON assignments FOR ALL
  USING (
    (SELECT auth.uid()) IS NOT NULL
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

-- 4. family_invites - fix UPDATE with_check
DROP POLICY IF EXISTS "family_invites_update" ON family_invites;
CREATE POLICY "family_invites_update" ON family_invites FOR UPDATE
  USING (
    invited_by = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_invites.family_id 
      AND fm.user_id = (SELECT auth.uid()) 
      AND fm.role = 'admin'
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

-- 5. holidays - authenticated users only (table has no family_id column)
DROP POLICY IF EXISTS "holidays_access" ON holidays;
CREATE POLICY "holidays_family_access" ON holidays FOR ALL
  USING (
    (SELECT auth.uid()) IS NOT NULL
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

-- 6. journal_entries - kid belongs to family
DROP POLICY IF EXISTS "journal_entries_access" ON journal_entries;
CREATE POLICY "journal_entries_family_access" ON journal_entries FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- 7. kid_rewards - kid belongs to family
DROP POLICY IF EXISTS "kid_rewards_access" ON kid_rewards;
CREATE POLICY "kid_rewards_family_access" ON kid_rewards FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- 8. progress_awards - kid belongs to family
DROP POLICY IF EXISTS "progress_awards_access" ON progress_awards;
CREATE POLICY "progress_awards_family_access" ON progress_awards FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- 9. resources - authenticated users only (table has no user_id column)
DROP POLICY IF EXISTS "resources_access" ON resources;
CREATE POLICY "resources_family_access" ON resources FOR ALL
  USING (
    (SELECT auth.uid()) IS NOT NULL
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

-- 10. student_progress - kid belongs to family
DROP POLICY IF EXISTS "student_progress_access" ON student_progress;
CREATE POLICY "student_progress_family_access" ON student_progress FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- 11. student_unlocks - kid belongs to family
DROP POLICY IF EXISTS "student_unlocks_access" ON student_unlocks;
CREATE POLICY "student_unlocks_family_access" ON student_unlocks FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- SECTION 2: Fix duplicate policies - consolidate into single policies
-- ============================================================================

-- families - remove old access policy, keep the specific ones
DROP POLICY IF EXISTS "families_access" ON families;

-- family_members - remove old access policy (keep the new proper SELECT one)
DROP POLICY IF EXISTS "family_members_access" ON family_members;

-- profiles - consolidate SELECT policies
DROP POLICY IF EXISTS "profiles_family_view" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_unified_select" ON profiles FOR SELECT
  USING (
    id = (SELECT auth.uid())
    OR id IN (
      SELECT fm.user_id FROM family_members fm 
      WHERE fm.family_id IN (SELECT user_family_ids())
    )
  );

-- Fix profiles_update to use (SELECT auth.uid())
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- SECTION 3: Fix performance - wrap auth.uid() with SELECT
-- ============================================================================

-- families insert
DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "Users can create families" ON families FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- family_members insert - fix old policy
DROP POLICY IF EXISTS "Users can add family members" ON family_members;
DROP POLICY IF EXISTS "Admins can add family members" ON family_members;
CREATE POLICY "Users can add family members" ON family_members FOR INSERT
  WITH CHECK (
    user_is_family_admin(family_id) 
    OR (user_id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  );

-- external_curriculum - fix both policies
DROP POLICY IF EXISTS "Users can view family external curriculum" ON external_curriculum;
DROP POLICY IF EXISTS "Users can insert family external curriculum" ON external_curriculum;

CREATE POLICY "external_curriculum_select" ON external_curriculum FOR SELECT
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

CREATE POLICY "external_curriculum_insert" ON external_curriculum FOR INSERT
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- worksheet_responses - consolidate and fix
DROP POLICY IF EXISTS "worksheet_responses_family_read" ON worksheet_responses;
DROP POLICY IF EXISTS "worksheet_responses_kid_write" ON worksheet_responses;

CREATE POLICY "worksheet_responses_access" ON worksheet_responses FOR ALL
  USING (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  )
  WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids()))
  );

-- ============================================================================
-- SECTION 4: Add missing foreign key indexes for performance
-- ============================================================================

-- assignment_items
CREATE INDEX IF NOT EXISTS idx_assignment_items_created_by ON assignment_items(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_items_user_id ON assignment_items(user_id);

-- day_plans
CREATE INDEX IF NOT EXISTS idx_day_plans_user_id ON day_plans(user_id);

-- families
CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);

-- family_invites
CREATE INDEX IF NOT EXISTS idx_family_invites_invited_by ON family_invites(invited_by);

-- family_members
CREATE INDEX IF NOT EXISTS idx_family_members_invited_by ON family_members(invited_by);

-- kid_rewards
CREATE INDEX IF NOT EXISTS idx_kid_rewards_kid_id ON kid_rewards(kid_id);

-- lessons
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON lessons(created_by);
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons(user_id);

-- resources (no user_id column in this table - skip)

-- schedule_items
CREATE INDEX IF NOT EXISTS idx_schedule_items_lesson_id ON schedule_items(lesson_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_assignment_id ON schedule_items(assignment_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_resource_id ON schedule_items(resource_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_student_id ON schedule_items(student_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_user_id ON schedule_items(user_id);

-- worksheet_responses
CREATE INDEX IF NOT EXISTS idx_worksheet_responses_assignment_id ON worksheet_responses(assignment_id);

-- ============================================================================
-- SECTION 5: Drop unused indexes (optional - keeping for now in case they become used)
-- Note: These are INFO level warnings, not critical. Keeping these commented out.
-- ============================================================================
-- DROP INDEX IF EXISTS idx_shop_purchases_kid_id;
-- DROP INDEX IF EXISTS idx_lessons_type;
-- DROP INDEX IF EXISTS idx_resources_category;
-- DROP INDEX IF EXISTS idx_resources_pinned_today;
-- DROP INDEX IF EXISTS idx_shop_purchases_status;
-- DROP INDEX IF EXISTS idx_saved_ideas_created_at;
-- DROP INDEX IF EXISTS idx_kids_family_id;
-- DROP INDEX IF EXISTS idx_assignment_kids_assignment_id;
-- DROP INDEX IF EXISTS idx_assignment_lessons_assignment_id;
