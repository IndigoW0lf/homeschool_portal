CREATE OR REPLACE FUNCTION generate_miacademy_schedule(
  p_start_date DATE,
  p_end_date DATE
) RETURNS void AS $$
DECLARE
  curr_date DATE := p_start_date;
  day_of_week INT;
  v_resource_id UUID;
  student_record RECORD;
  is_holiday BOOLEAN;
BEGIN
  -- Get MiAcademy resource ID
  SELECT id INTO v_resource_id FROM resources 
  WHERE label ILIKE '%MiAcademy%' OR pinned_today = true
  LIMIT 1;
  
  IF v_resource_id IS NULL THEN
    RAISE NOTICE 'MiAcademy resource not found, skipping';
    RETURN;
  END IF;

  -- Loop through each date
  WHILE curr_date <= p_end_date LOOP
    day_of_week := EXTRACT(DOW FROM curr_date)::INT;
    
    -- Only Tuesday (2), Wednesday (3), Thursday (4)
    IF day_of_week IN (2, 3, 4) THEN
      -- Check if this date is a holiday
      SELECT EXISTS (
        SELECT 1 FROM holidays h
        WHERE curr_date >= h.start_date 
          AND (
            (h.end_date IS NULL AND curr_date = h.start_date)
            OR (h.end_date IS NOT NULL AND curr_date <= h.end_date)
          )
      ) INTO is_holiday;
      
      IF NOT is_holiday THEN
        -- Create schedule item for each student
        FOR student_record IN SELECT id FROM kids LOOP
          -- Only insert if not already exists
          INSERT INTO schedule_items (date, student_id, item_type, resource_id, title_override, status, sort_order)
          SELECT curr_date, student_record.id, 'resource', v_resource_id, 'MiAcademy', 'pending', 0
          WHERE NOT EXISTS (
            SELECT 1 FROM schedule_items si
            WHERE si.date = curr_date 
              AND si.student_id = student_record.id 
              AND si.resource_id = v_resource_id
          );
        END LOOP;
      END IF;
    END IF;
    
    curr_date := curr_date + 1;  -- add one day (works for DATE)
  END LOOP;
END;
$$ LANGUAGE plpgsql;