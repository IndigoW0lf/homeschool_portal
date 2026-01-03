-- Helper function to get subject counts for a kid
-- Joins schedule_items -> resources/lessons to finding subject categories/tags
CREATE OR REPLACE FUNCTION get_kid_subject_counts(p_kid_id TEXT)
RETURNS TABLE (subject TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH completed_items AS (
    SELECT 
      si.item_type,
      si.resource_id,
      si.lesson_id,
      si.assignment_id,
      si.completed_at
    FROM schedule_items si
    WHERE si.student_id = p_kid_id
      AND si.status = 'completed'
  ),
  item_subjects AS (
    -- Resource categories
    SELECT 
      r.category as subject
    FROM completed_items ci
    JOIN resources r ON ci.resource_id = r.id
    WHERE ci.item_type = 'resource'
    
    UNION ALL
    
    -- Lesson tags (approximate subject from tags)
    -- We assume tags might contain 'math', 'science', 'reading', 'writing'
    SELECT 
      unnest(l.tags) as subject
    FROM completed_items ci
    JOIN lessons l ON ci.lesson_id = l.id
    WHERE ci.item_type = 'lesson'
    
    UNION ALL
    
    -- Assignment tags
    SELECT 
      unnest(ai.tags) as subject
    FROM completed_items ci
    JOIN assignment_items ai ON ci.assignment_id = ai.id
    WHERE ci.item_type = 'assignment'
  )
  SELECT 
    lower(s.subject) as subject,
    count(*) as count
  FROM item_subjects s
  WHERE lower(s.subject) IN ('math', 'reading', 'writing', 'science', 'logic') 
     OR lower(s.subject) LIKE '%math%'
     OR lower(s.subject) LIKE '%read%'
     OR lower(s.subject) LIKE '%write%'
     OR lower(s.subject) LIKE '%sci%'
  GROUP BY lower(s.subject);
END;
$$ LANGUAGE plpgsql;

-- Helper function to get weekly activity (last 7 days completed count)
CREATE OR REPLACE FUNCTION get_weekly_activity(p_kid_id TEXT)
RETURNS TABLE (date TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(
      current_date - interval '6 days',
      current_date,
      '1 day'::interval
    )::date AS date
  ),
  completions AS (
    SELECT 
      si.completed_at::date as completed_date
    FROM schedule_items si
    WHERE si.student_id = p_kid_id
      AND si.status = 'completed'
      AND si.completed_at >= current_date - interval '7 days'
  )
  SELECT 
    to_char(d.date, 'YYYY-MM-DD') as date,
    count(c.completed_date) as count
  FROM dates d
  LEFT JOIN completions c ON d.date = c.completed_date
  GROUP BY d.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql;
