-- Migration: Activity Range RPC
-- Description: Creates get_activity_by_range RPC that accepts a days parameter
-- to allow viewing activity data over different time periods (7/30/90 days)

-- Drop existing function if exists (all overloads)
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc 
    WHERE proname = 'get_activity_by_range' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.get_activity_by_range(%s)', func_record.args);
  END LOOP;
END $$;

-- Create new RPC with days parameter
CREATE FUNCTION public.get_activity_by_range(p_kid_id TEXT, p_days INT DEFAULT 7)
RETURNS TABLE(date DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH all_activities AS (
    -- In-app completed schedule items
    SELECT si.date::DATE AS activity_date
    FROM public.schedule_items si
    WHERE si.student_id = p_kid_id 
      AND si.status = 'completed'
      AND si.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    
    UNION ALL
    
    -- Imported curriculum (MiAcademy, etc.)
    SELECT ec.date AS activity_date
    FROM public.external_curriculum ec
    WHERE ec.kid_id = p_kid_id
      AND ec.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    
    UNION ALL
    
    -- Manual activity log entries
    SELECT al.date AS activity_date
    FROM public.activity_log al
    WHERE al.kid_id = p_kid_id
      AND al.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  )
  SELECT activity_date AS date, COUNT(*) AS count
  FROM all_activities
  GROUP BY activity_date
  ORDER BY activity_date;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';
