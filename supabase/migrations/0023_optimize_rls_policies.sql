-- Comprehensive RLS and Function Security Fix
-- Fixes all remaining security/performance warnings

-- ============================================================
-- 1. FIX generate_miacademy_schedule search_path
-- ============================================================
-- Drop ALL versions of this function (there may be multiple with different signatures)
DROP FUNCTION IF EXISTS public.generate_miacademy_schedule(DATE, DATE, TEXT[]);
DROP FUNCTION IF EXISTS public.generate_miacademy_schedule(DATE, DATE, TEXT[], TEXT);
DROP FUNCTION IF EXISTS public.generate_miacademy_schedule(p_start_date DATE, p_end_date DATE, p_kid_ids TEXT[]);

CREATE FUNCTION public.generate_miacademy_schedule(
  start_date DATE,
  end_date DATE,
  kid_ids TEXT[]
)
RETURNS TABLE(
  schedule_date DATE,
  kid_id TEXT,
  day_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d::DATE AS schedule_date,
    k.id AS kid_id,
    TO_CHAR(d, 'Day') AS day_name
  FROM generate_series(start_date, end_date, '1 day'::interval) d
  CROSS JOIN UNNEST(kid_ids) AS k(id)
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6); -- Exclude weekends
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- ============================================================
-- 2. FIX ai_chat_sessions DUPLICATE POLICIES
-- ============================================================
-- Drop all existing policies and create optimized ones
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_all" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_select" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_delete" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "ai_chat_sessions_user_access" ON public.ai_chat_sessions;

-- Single optimized policy for all operations
CREATE POLICY "ai_chat_sessions_user_access" ON public.ai_chat_sessions
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- 3. OPTIMIZE RLS POLICIES - kids table
-- ============================================================
DROP POLICY IF EXISTS "Kids are viewable by everyone" ON public.kids;
DROP POLICY IF EXISTS "Kids are editable by authenticated users" ON public.kids;
DROP POLICY IF EXISTS "Users can manage their own kids" ON public.kids;
DROP POLICY IF EXISTS "kids_select" ON public.kids;
DROP POLICY IF EXISTS "kids_all_auth" ON public.kids;

CREATE POLICY "kids_select" ON public.kids FOR SELECT USING (true);
CREATE POLICY "kids_all_auth" ON public.kids FOR ALL 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

-- ============================================================
-- 4. OPTIMIZE RLS POLICIES - lessons table
-- ============================================================
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON public.lessons;
DROP POLICY IF EXISTS "Lessons are editable by authenticated users" ON public.lessons;
DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can insert their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can update their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "lessons_select" ON public.lessons;
DROP POLICY IF EXISTS "lessons_insert" ON public.lessons;
DROP POLICY IF EXISTS "lessons_update" ON public.lessons;
DROP POLICY IF EXISTS "lessons_delete" ON public.lessons;

CREATE POLICY "lessons_select" ON public.lessons FOR SELECT 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);
CREATE POLICY "lessons_insert" ON public.lessons FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "lessons_update" ON public.lessons FOR UPDATE 
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "lessons_delete" ON public.lessons FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 5. OPTIMIZE RLS POLICIES - lesson_links table
-- ============================================================
DROP POLICY IF EXISTS "Lesson links are viewable by everyone" ON public.lesson_links;
DROP POLICY IF EXISTS "Lesson links are editable by authenticated users" ON public.lesson_links;
DROP POLICY IF EXISTS "lesson_links_select" ON public.lesson_links;
DROP POLICY IF EXISTS "lesson_links_all" ON public.lesson_links;

CREATE POLICY "lesson_links_select" ON public.lesson_links FOR SELECT USING (true);
CREATE POLICY "lesson_links_all" ON public.lesson_links FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 6. OPTIMIZE RLS POLICIES - lesson_attachments table
-- ============================================================
DROP POLICY IF EXISTS "Lesson attachments are viewable by everyone" ON public.lesson_attachments;
DROP POLICY IF EXISTS "Lesson attachments are editable by authenticated users" ON public.lesson_attachments;
DROP POLICY IF EXISTS "lesson_attachments_select" ON public.lesson_attachments;
DROP POLICY IF EXISTS "lesson_attachments_all" ON public.lesson_attachments;

CREATE POLICY "lesson_attachments_select" ON public.lesson_attachments FOR SELECT USING (true);
CREATE POLICY "lesson_attachments_all" ON public.lesson_attachments FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 7. OPTIMIZE RLS POLICIES - assignment_items table
-- ============================================================
DROP POLICY IF EXISTS "Assignments are viewable by everyone" ON public.assignment_items;
DROP POLICY IF EXISTS "Assignments are editable by authenticated users" ON public.assignment_items;
DROP POLICY IF EXISTS "Allow all for auth users" ON public.assignment_items;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.assignment_items;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON public.assignment_items;
DROP POLICY IF EXISTS "Users can update their own assignments" ON public.assignment_items;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON public.assignment_items;
DROP POLICY IF EXISTS "assignment_items_select" ON public.assignment_items;
DROP POLICY IF EXISTS "assignment_items_insert" ON public.assignment_items;
DROP POLICY IF EXISTS "assignment_items_update" ON public.assignment_items;
DROP POLICY IF EXISTS "assignment_items_delete" ON public.assignment_items;

CREATE POLICY "assignment_items_select" ON public.assignment_items FOR SELECT 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);
CREATE POLICY "assignment_items_insert" ON public.assignment_items FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "assignment_items_update" ON public.assignment_items FOR UPDATE 
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "assignment_items_delete" ON public.assignment_items FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 8. OPTIMIZE RLS POLICIES - resources table
-- ============================================================
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON public.resources;
DROP POLICY IF EXISTS "Resources are editable by authenticated users" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON public.resources;
DROP POLICY IF EXISTS "resources_select" ON public.resources;
DROP POLICY IF EXISTS "resources_insert" ON public.resources;
DROP POLICY IF EXISTS "resources_update" ON public.resources;
DROP POLICY IF EXISTS "resources_delete" ON public.resources;

CREATE POLICY "resources_select" ON public.resources FOR SELECT 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);
CREATE POLICY "resources_insert" ON public.resources FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "resources_update" ON public.resources FOR UPDATE 
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "resources_delete" ON public.resources FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 9. OPTIMIZE RLS POLICIES - schedule_items table
-- ============================================================
DROP POLICY IF EXISTS "Allow all for auth users" ON public.schedule_items;
DROP POLICY IF EXISTS "Users can view their own schedule" ON public.schedule_items;
DROP POLICY IF EXISTS "Users can insert their own schedule" ON public.schedule_items;
DROP POLICY IF EXISTS "Users can update their own schedule" ON public.schedule_items;
DROP POLICY IF EXISTS "Users can delete their own schedule" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_select" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_insert" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_update" ON public.schedule_items;
DROP POLICY IF EXISTS "schedule_items_delete" ON public.schedule_items;

CREATE POLICY "schedule_items_select" ON public.schedule_items FOR SELECT 
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);
CREATE POLICY "schedule_items_insert" ON public.schedule_items FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "schedule_items_update" ON public.schedule_items FOR UPDATE 
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "schedule_items_delete" ON public.schedule_items FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 10. OPTIMIZE RLS POLICIES - day_plans table
-- ============================================================
DROP POLICY IF EXISTS "Allow all for auth users" ON public.day_plans;
DROP POLICY IF EXISTS "day_plans_all" ON public.day_plans;

CREATE POLICY "day_plans_all" ON public.day_plans FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 11. OPTIMIZE RLS POLICIES - profiles table
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT 
  USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT 
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE 
  USING (id = (SELECT auth.uid()));

-- ============================================================
-- 12. OPTIMIZE RLS POLICIES - saved_ideas table
-- ============================================================
DROP POLICY IF EXISTS "Users can view own ideas" ON public.saved_ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON public.saved_ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_select" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_insert" ON public.saved_ideas;
DROP POLICY IF EXISTS "saved_ideas_delete" ON public.saved_ideas;

CREATE POLICY "saved_ideas_select" ON public.saved_ideas FOR SELECT 
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "saved_ideas_insert" ON public.saved_ideas FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "saved_ideas_delete" ON public.saved_ideas FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 13. OPTIMIZE RLS POLICIES - holidays table
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view holidays" ON public.holidays;
DROP POLICY IF EXISTS "Authenticated users can manage holidays" ON public.holidays;
DROP POLICY IF EXISTS "holidays_select" ON public.holidays;
DROP POLICY IF EXISTS "holidays_all" ON public.holidays;

CREATE POLICY "holidays_select" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "holidays_all" ON public.holidays FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 14. OPTIMIZE RLS POLICIES - student_progress table
-- ============================================================
DROP POLICY IF EXISTS "Public read student_progress" ON public.student_progress;
DROP POLICY IF EXISTS "Auth write student_progress" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_select" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_all" ON public.student_progress;

CREATE POLICY "student_progress_select" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "student_progress_all" ON public.student_progress FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 15. OPTIMIZE RLS POLICIES - progress_awards table
-- ============================================================
DROP POLICY IF EXISTS "Public read progress_awards" ON public.progress_awards;
DROP POLICY IF EXISTS "Auth write progress_awards" ON public.progress_awards;
DROP POLICY IF EXISTS "progress_awards_select" ON public.progress_awards;
DROP POLICY IF EXISTS "progress_awards_all" ON public.progress_awards;

CREATE POLICY "progress_awards_select" ON public.progress_awards FOR SELECT USING (true);
CREATE POLICY "progress_awards_all" ON public.progress_awards FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 16. OPTIMIZE RLS POLICIES - student_unlocks table
-- ============================================================
DROP POLICY IF EXISTS "Public read student_unlocks" ON public.student_unlocks;
DROP POLICY IF EXISTS "Auth write student_unlocks" ON public.student_unlocks;
DROP POLICY IF EXISTS "student_unlocks_select" ON public.student_unlocks;
DROP POLICY IF EXISTS "student_unlocks_all" ON public.student_unlocks;

CREATE POLICY "student_unlocks_select" ON public.student_unlocks FOR SELECT USING (true);
CREATE POLICY "student_unlocks_all" ON public.student_unlocks FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- 17. OPTIMIZE RLS POLICIES - kid_rewards table (if exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kid_rewards') THEN
    DROP POLICY IF EXISTS "Public read kid_rewards" ON public.kid_rewards;
    DROP POLICY IF EXISTS "Auth write kid_rewards" ON public.kid_rewards;
    DROP POLICY IF EXISTS "kid_rewards_select" ON public.kid_rewards;
    DROP POLICY IF EXISTS "kid_rewards_all" ON public.kid_rewards;

    CREATE POLICY "kid_rewards_select" ON public.kid_rewards FOR SELECT USING (true);
    CREATE POLICY "kid_rewards_all" ON public.kid_rewards FOR ALL 
      USING ((SELECT auth.role()) = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 18. OPTIMIZE RLS POLICIES - reward_redemptions table (if exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_redemptions') THEN
    DROP POLICY IF EXISTS "Public read reward_redemptions" ON public.reward_redemptions;
    DROP POLICY IF EXISTS "Auth write reward_redemptions" ON public.reward_redemptions;
    DROP POLICY IF EXISTS "Auth update reward_redemptions" ON public.reward_redemptions;
    DROP POLICY IF EXISTS "reward_redemptions_select" ON public.reward_redemptions;
    DROP POLICY IF EXISTS "reward_redemptions_insert" ON public.reward_redemptions;
    DROP POLICY IF EXISTS "reward_redemptions_update" ON public.reward_redemptions;

    CREATE POLICY "reward_redemptions_select" ON public.reward_redemptions FOR SELECT USING (true);
    CREATE POLICY "reward_redemptions_insert" ON public.reward_redemptions FOR INSERT WITH CHECK (true);
    CREATE POLICY "reward_redemptions_update" ON public.reward_redemptions FOR UPDATE 
      USING ((SELECT auth.role()) = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 19. OPTIMIZE RLS POLICIES - journal_entries table (if exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    DROP POLICY IF EXISTS "journal_entries_select" ON public.journal_entries;
    DROP POLICY IF EXISTS "journal_entries_all" ON public.journal_entries;
    
    CREATE POLICY "journal_entries_select" ON public.journal_entries FOR SELECT USING (true);
    CREATE POLICY "journal_entries_all" ON public.journal_entries FOR ALL 
      USING ((SELECT auth.role()) = 'authenticated');
  END IF;
END $$;
