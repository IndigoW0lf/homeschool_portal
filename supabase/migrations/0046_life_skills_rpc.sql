-- Create function to get life skills completion counts for a kid
-- Returns count of completed schedule_items grouped by lesson/assignment type

CREATE OR REPLACE FUNCTION get_life_skills_counts(p_kid_id TEXT)
RETURNS TABLE(category TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(l.type, a.type, 'Other') AS category,
    COUNT(*) AS count
  FROM public.schedule_items si
  LEFT JOIN public.lessons l ON si.lesson_id = l.id
  LEFT JOIN public.assignment_items a ON si.assignment_id = a.id
  WHERE si.student_id = p_kid_id
    AND si.status = 'completed'
    -- Only count life skills categories
    AND (
      l.type IN ('Self & Mind', 'Thinking & Truth', 'Agency & Responsibility', 
                'Relationships & Community', 'Body & Nervous System', 'Systems & Society')
      OR a.type IN ('Self & Mind', 'Thinking & Truth', 'Agency & Responsibility', 
                    'Relationships & Community', 'Body & Nervous System', 'Systems & Society')
    )
  GROUP BY COALESCE(l.type, a.type, 'Other');
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';
