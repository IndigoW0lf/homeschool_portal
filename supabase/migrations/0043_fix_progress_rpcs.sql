-- Fix progress tracking to include schedule_items completions
-- Previously only counted progress_awards (star rewards)
-- Now also counts completed schedule_items (MiAcademy, external links, etc.)

-- Update get_weekly_activity to use schedule_items completions
DROP FUNCTION IF EXISTS public.get_weekly_activity(TEXT);
CREATE FUNCTION public.get_weekly_activity(p_kid_id TEXT)
RETURNS TABLE(activity_date DATE, item_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.date::DATE AS activity_date,
    COUNT(*) AS item_count
  FROM public.schedule_items si
  WHERE si.student_id = p_kid_id
    AND si.status = 'completed'
    AND si.date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY si.date::DATE
  ORDER BY si.date::DATE;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Update get_kid_subject_counts to use schedule_items completions
DROP FUNCTION IF EXISTS public.get_kid_subject_counts(TEXT);
CREATE FUNCTION public.get_kid_subject_counts(p_kid_id TEXT)
RETURNS TABLE(subject TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      r.category,
      CASE 
        -- Check lesson type first, then tags
        WHEN l.type ILIKE '%read%' THEN 'reading'
        WHEN l.type ILIKE '%writing%' OR l.type ILIKE '%language%' THEN 'writing'
        WHEN l.type ILIKE '%math%' OR l.type ILIKE '%logic%' THEN 'math'
        WHEN l.type ILIKE '%sci%' THEN 'science'
        -- Check assignment type
        WHEN a.type ILIKE '%read%' THEN 'reading'
        WHEN a.type ILIKE '%writing%' OR a.type ILIKE '%language%' THEN 'writing'
        WHEN a.type ILIKE '%math%' OR a.type ILIKE '%logic%' THEN 'math'
        WHEN a.type ILIKE '%sci%' THEN 'science'
        -- Check tags
        WHEN 'reading' = ANY(l.tags) OR 'reading' = ANY(a.tags) THEN 'reading'
        WHEN 'writing' = ANY(l.tags) OR 'writing' = ANY(a.tags) THEN 'writing'
        WHEN 'math' = ANY(l.tags) OR 'math' = ANY(a.tags) THEN 'math'
        WHEN 'science' = ANY(l.tags) OR 'science' = ANY(a.tags) THEN 'science'
        ELSE 'other'
      END
    ) AS subject,
    COUNT(*) AS count
  FROM public.schedule_items si
  LEFT JOIN public.resources r ON si.resource_id = r.id
  LEFT JOIN public.lessons l ON si.lesson_id = l.id
  LEFT JOIN public.assignment_items a ON si.assignment_id = a.id
  WHERE si.student_id = p_kid_id
    AND si.status = 'completed'
  GROUP BY 1;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';
