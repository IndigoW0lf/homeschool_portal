-- Migration: School Year Hours Tracking
-- Description: Add tables and functions for tracking Missouri homeschool compliance hours
-- (1000 hours: 600 core + 400 non-core)

-- ============================================
-- 1. School Year Settings Table
-- ============================================
-- Allows families to configure their school year dates and hour goals

CREATE TABLE IF NOT EXISTS public.school_year_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  
  -- School year dates (Missouri typically July 1 - June 30)
  year_start DATE NOT NULL DEFAULT '2025-07-01',
  year_end DATE NOT NULL DEFAULT '2026-06-30',
  
  -- Hour goals (Missouri default: 600 core + 400 non-core = 1000 total)
  core_hours_goal INT NOT NULL DEFAULT 600,
  noncore_hours_goal INT NOT NULL DEFAULT 400,
  
  -- Label for this school year
  year_label TEXT DEFAULT '2025-2026',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One active year per family
  UNIQUE (family_id, year_label)
);

-- Enable RLS
ALTER TABLE public.school_year_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Family members can access their family's settings
DROP POLICY IF EXISTS "school_year_settings_access" ON public.school_year_settings;
CREATE POLICY "school_year_settings_access" ON public.school_year_settings FOR ALL
  USING (
    family_id IN (SELECT user_family_ids())
  )
  WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
    AND family_id IN (SELECT user_family_ids())
  );

-- Index for family lookups
CREATE INDEX IF NOT EXISTS idx_school_year_settings_family ON public.school_year_settings(family_id);

-- ============================================
-- 2. Core Subject Classification Function
-- ============================================
-- Determines if a subject is core or non-core for Missouri requirements

DROP FUNCTION IF EXISTS public.is_core_subject(TEXT);
CREATE FUNCTION public.is_core_subject(p_subject TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Core subjects: Reading, Language Arts, Math, Social Studies/History, Science
  -- Case-insensitive matching
  RETURN LOWER(COALESCE(p_subject, '')) ~* 
    '^(math|mathematics|reading|language arts|english|writing|science|social studies|history|geography|civics|government|us government)';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- ============================================
-- 3. Get Hours Summary RPC
-- ============================================
-- Aggregates hours from activity_log for a kid within a date range

DROP FUNCTION IF EXISTS public.get_hours_summary(TEXT, DATE, DATE);
CREATE FUNCTION public.get_hours_summary(
  p_kid_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  subject TEXT,
  is_core BOOLEAN,
  total_minutes BIGINT,
  total_hours NUMERIC,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.subject,
    public.is_core_subject(al.subject) AS is_core,
    COALESCE(SUM(al.duration_minutes), 0)::BIGINT AS total_minutes,
    ROUND(COALESCE(SUM(al.duration_minutes), 0) / 60.0, 1) AS total_hours,
    COUNT(*)::BIGINT AS entry_count
  FROM public.activity_log al
  WHERE al.kid_id = p_kid_id
    AND al.date >= p_start_date
    AND al.date <= p_end_date
    AND al.duration_minutes IS NOT NULL
    AND al.duration_minutes > 0
  GROUP BY al.subject
  ORDER BY total_minutes DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ============================================
-- 4. Get Hours Totals RPC
-- ============================================
-- Returns core/non-core totals for quick dashboard display

DROP FUNCTION IF EXISTS public.get_hours_totals(TEXT, DATE, DATE);
CREATE FUNCTION public.get_hours_totals(
  p_kid_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  core_minutes BIGINT,
  core_hours NUMERIC,
  noncore_minutes BIGINT,
  noncore_hours NUMERIC,
  total_minutes BIGINT,
  total_hours NUMERIC,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN public.is_core_subject(al.subject) THEN al.duration_minutes ELSE 0 END), 0)::BIGINT AS core_minutes,
    ROUND(COALESCE(SUM(CASE WHEN public.is_core_subject(al.subject) THEN al.duration_minutes ELSE 0 END), 0) / 60.0, 1) AS core_hours,
    COALESCE(SUM(CASE WHEN NOT public.is_core_subject(al.subject) THEN al.duration_minutes ELSE 0 END), 0)::BIGINT AS noncore_minutes,
    ROUND(COALESCE(SUM(CASE WHEN NOT public.is_core_subject(al.subject) THEN al.duration_minutes ELSE 0 END), 0) / 60.0, 1) AS noncore_hours,
    COALESCE(SUM(al.duration_minutes), 0)::BIGINT AS total_minutes,
    ROUND(COALESCE(SUM(al.duration_minutes), 0) / 60.0, 1) AS total_hours,
    COUNT(*)::BIGINT AS entry_count
  FROM public.activity_log al
  WHERE al.kid_id = p_kid_id
    AND al.date >= p_start_date
    AND al.date <= p_end_date
    AND al.duration_minutes IS NOT NULL
    AND al.duration_minutes > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ============================================
-- 5. Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_core_subject(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hours_summary(TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hours_totals(TEXT, DATE, DATE) TO authenticated;
