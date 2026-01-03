-- Fix for Moons API and Profile Enhancements

-- 1. Ensure progress_awards columns exist (idempotent)
ALTER TABLE progress_awards ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'assignment';
ALTER TABLE progress_awards ADD COLUMN IF NOT EXISTS note TEXT;

-- 2. Create increment_total_stars RPC if it doesn't exist
-- This safely increments the total_stars counter for a kid
CREATE OR REPLACE FUNCTION increment_total_stars(kid_id_param TEXT, amount_param INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO student_progress (kid_id, total_stars)
  VALUES (kid_id_param, amount_param)
  ON CONFLICT (kid_id)
  DO UPDATE SET 
    total_stars = student_progress.total_stars + amount_param,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 3. Add teaching_style to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teaching_style TEXT;
