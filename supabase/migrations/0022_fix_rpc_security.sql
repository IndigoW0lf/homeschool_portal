-- Security fix for RPC functions
-- Fixes "mutable search_path" security warnings by explicitly setting search_path

-- Fix handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Recreate trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Recreate trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fix get_kid_subject_counts
DROP FUNCTION IF EXISTS public.get_kid_subject_counts(TEXT);
CREATE FUNCTION public.get_kid_subject_counts(p_kid_id TEXT)
RETURNS TABLE(subject TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      r.category,
      CASE 
        WHEN 'reading' = ANY(l.tags) OR 'reading' = ANY(a.tags) THEN 'reading'
        WHEN 'writing' = ANY(l.tags) OR 'writing' = ANY(a.tags) THEN 'writing'
        WHEN 'math' = ANY(l.tags) OR 'math' = ANY(a.tags) THEN 'math'
        WHEN 'science' = ANY(l.tags) OR 'science' = ANY(a.tags) THEN 'science'
        ELSE 'other'
      END
    ) AS subject,
    COUNT(*) AS count
  FROM public.progress_awards pa
  JOIN public.schedule_items si ON pa.item_id = si.id
  LEFT JOIN public.resources r ON si.resource_id = r.id
  LEFT JOIN public.lessons l ON si.lesson_id = l.id
  LEFT JOIN public.assignment_items a ON si.assignment_id = a.id
  WHERE pa.kid_id = p_kid_id
  GROUP BY 1;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Fix get_weekly_activity
DROP FUNCTION IF EXISTS public.get_weekly_activity(TEXT);
CREATE FUNCTION public.get_weekly_activity(p_kid_id TEXT)
RETURNS TABLE(activity_date DATE, item_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.date::DATE AS activity_date,
    COUNT(*) AS item_count
  FROM public.progress_awards pa
  WHERE pa.kid_id = p_kid_id
    AND pa.date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY pa.date::DATE
  ORDER BY pa.date::DATE;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Fix increment_total_stars
DROP FUNCTION IF EXISTS public.increment_total_stars(TEXT, INT);
CREATE FUNCTION public.increment_total_stars(kid_id_param TEXT, amount_param INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.student_progress (kid_id, total_stars)
  VALUES (kid_id_param, amount_param)
  ON CONFLICT (kid_id)
  DO UPDATE SET 
    total_stars = public.student_progress.total_stars + amount_param,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_ai_chat_session_timestamp (if it exists)
DROP FUNCTION IF EXISTS public.update_ai_chat_session_timestamp() CASCADE;
CREATE FUNCTION public.update_ai_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Recreate trigger for ai_chat_sessions if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_chat_sessions') THEN
    DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at ON public.ai_chat_sessions;
    CREATE TRIGGER update_ai_chat_sessions_updated_at
      BEFORE UPDATE ON public.ai_chat_sessions
      FOR EACH ROW EXECUTE FUNCTION public.update_ai_chat_session_timestamp();
  END IF;
END $$;
