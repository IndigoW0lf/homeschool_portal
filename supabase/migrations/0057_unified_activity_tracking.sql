-- Migration: Unified Activity Tracking
-- Description: Updates RPC functions to combine data from all three activity sources:
-- 1. schedule_items (completed in-app work)
-- 2. external_curriculum (imported CSV data)
-- 3. activity_log (manual parent entries)

-- ============================================================================
-- Update get_weekly_activity to combine all sources
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_weekly_activity(TEXT);
CREATE FUNCTION public.get_weekly_activity(p_kid_id TEXT)
RETURNS TABLE(date DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_activities AS (
    -- In-app completed schedule items
    SELECT si.date::DATE AS activity_date
    FROM public.schedule_items si
    WHERE si.student_id = p_kid_id 
      AND si.status = 'completed'
      AND si.date >= CURRENT_DATE - INTERVAL '7 days'
    
    UNION ALL
    
    -- Imported curriculum (MiAcademy, etc.)
    SELECT ec.date AS activity_date
    FROM public.external_curriculum ec
    WHERE ec.kid_id = p_kid_id
      AND ec.date >= CURRENT_DATE - INTERVAL '7 days'
    
    UNION ALL
    
    -- Manual activity log entries
    SELECT al.date AS activity_date
    FROM public.activity_log al
    WHERE al.kid_id = p_kid_id
      AND al.date >= CURRENT_DATE - INTERVAL '7 days'
  )
  SELECT activity_date AS date, COUNT(*) AS count
  FROM all_activities
  GROUP BY activity_date
  ORDER BY activity_date;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- ============================================================================
-- Update get_kid_subject_counts to combine all sources
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_kid_subject_counts(TEXT);
CREATE FUNCTION public.get_kid_subject_counts(p_kid_id TEXT)
RETURNS TABLE(subject TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_subjects AS (
    -- In-app completed schedule items (existing logic)
    SELECT 
      COALESCE(
        r.category,
        CASE 
          WHEN l.type ILIKE '%read%' THEN 'reading'
          WHEN l.type ILIKE '%writing%' OR l.type ILIKE '%language%' THEN 'writing'
          WHEN l.type ILIKE '%math%' OR l.type ILIKE '%logic%' THEN 'math'
          WHEN l.type ILIKE '%sci%' THEN 'science'
          WHEN a.type ILIKE '%read%' THEN 'reading'
          WHEN a.type ILIKE '%writing%' OR a.type ILIKE '%language%' THEN 'writing'
          WHEN a.type ILIKE '%math%' OR a.type ILIKE '%logic%' THEN 'math'
          WHEN a.type ILIKE '%sci%' THEN 'science'
          WHEN 'reading' = ANY(l.tags) OR 'reading' = ANY(a.tags) THEN 'reading'
          WHEN 'writing' = ANY(l.tags) OR 'writing' = ANY(a.tags) THEN 'writing'
          WHEN 'math' = ANY(l.tags) OR 'math' = ANY(a.tags) THEN 'math'
          WHEN 'science' = ANY(l.tags) OR 'science' = ANY(a.tags) THEN 'science'
          ELSE 'other'
        END
      ) AS subject_name
    FROM public.schedule_items si
    LEFT JOIN public.resources r ON si.resource_id = r.id
    LEFT JOIN public.lessons l ON si.lesson_id = l.id
    LEFT JOIN public.assignment_items a ON si.assignment_id = a.id
    WHERE si.student_id = p_kid_id AND si.status = 'completed'
    
    UNION ALL
    
    -- Imported curriculum subjects (normalize to standard keys)
    SELECT 
      CASE 
        WHEN LOWER(ec.subject) LIKE '%read%' THEN 'reading'
        WHEN LOWER(ec.subject) LIKE '%writ%' THEN 'writing'
        WHEN LOWER(ec.subject) LIKE '%math%' OR LOWER(ec.subject) LIKE '%logic%' THEN 'math'
        WHEN LOWER(ec.subject) LIKE '%sci%' THEN 'science'
        WHEN LOWER(ec.subject) LIKE '%life%' OR LOWER(ec.subject) LIKE '%skill%' THEN 'life_skills'
        ELSE LOWER(COALESCE(ec.subject, 'other'))
      END AS subject_name
    FROM public.external_curriculum ec
    WHERE ec.kid_id = p_kid_id
    
    UNION ALL
    
    -- Manual activity log subjects (normalize to standard keys)
    SELECT 
      CASE 
        WHEN LOWER(al.subject) LIKE '%read%' OR LOWER(al.subject) = 'language arts' THEN 'reading'
        WHEN LOWER(al.subject) LIKE '%writ%' THEN 'writing'
        WHEN LOWER(al.subject) LIKE '%math%' OR LOWER(al.subject) LIKE '%logic%' THEN 'math'
        WHEN LOWER(al.subject) LIKE '%sci%' THEN 'science'
        WHEN LOWER(al.subject) LIKE '%life%' OR LOWER(al.subject) LIKE '%skill%' OR LOWER(al.subject) = 'pe' THEN 'life_skills'
        ELSE LOWER(COALESCE(al.subject, 'other'))
      END AS subject_name
    FROM public.activity_log al
    WHERE al.kid_id = p_kid_id
  )
  SELECT subject_name AS subject, COUNT(*) AS count
  FROM all_subjects
  GROUP BY subject_name;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';
