-- Add grades column (array of text) for multi-select support
ALTER TABLE kids ADD COLUMN IF NOT EXISTS grades TEXT[] DEFAULT '{}';

-- Migrate existing grade_band data to grades array
UPDATE kids 
SET grades = CASE 
  WHEN grade_band = 'K-2' THEN ARRAY['K', '1', '2']
  WHEN grade_band = '3-5' THEN ARRAY['3', '4', '5']
  WHEN grade_band = '6-8' THEN ARRAY['6', '7', '8']
  WHEN grade_band = '9-12' THEN ARRAY['9', '10', '11', '12']
  ELSE '{}'::TEXT[]
END
WHERE grades = '{}'::TEXT[] AND grade_band IS NOT NULL;

-- Optional: Drop column later, but for now just keep as legacy or nullable
-- ALTER TABLE kids ALTER COLUMN grade_band DROP NOT NULL;
