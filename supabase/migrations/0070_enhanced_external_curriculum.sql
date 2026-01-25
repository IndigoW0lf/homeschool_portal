-- Migration: Enhanced External Curriculum for Practice Generation
-- Adds topic, level, mastery_status columns for targeted worksheet generation

-- Add new columns to external_curriculum
ALTER TABLE external_curriculum ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE external_curriculum ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE external_curriculum ADD COLUMN IF NOT EXISTS mastery_status TEXT;
ALTER TABLE external_curriculum ADD COLUMN IF NOT EXISTS practice_generated BOOLEAN DEFAULT false;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_external_curriculum_topic 
  ON external_curriculum(topic);
CREATE INDEX IF NOT EXISTS idx_external_curriculum_mastery 
  ON external_curriculum(mastery_status);
CREATE INDEX IF NOT EXISTS idx_external_curriculum_practice_gen 
  ON external_curriculum(practice_generated);

-- Backfill existing records: parse topic from task_name
-- Pattern: "Topic Name | Activity Type: Description"
UPDATE external_curriculum
SET topic = CASE 
  WHEN task_name LIKE '%|%' THEN TRIM(SPLIT_PART(task_name, '|', 1))
  ELSE task_name
END
WHERE topic IS NULL;

-- Backfill mastery_status based on score
UPDATE external_curriculum
SET mastery_status = CASE
  WHEN score IS NULL THEN 'in_progress'
  WHEN score >= 90 THEN 'mastered'
  WHEN score >= 80 THEN 'developing'
  ELSE 'weak'
END
WHERE mastery_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN external_curriculum.topic IS 'Parsed topic name (e.g., "Subtract Decimals 1")';
COMMENT ON COLUMN external_curriculum.level IS 'Practice level if applicable (e.g., "Levels 7-9")';
COMMENT ON COLUMN external_curriculum.mastery_status IS 'weak (<80%), developing (80-90%), mastered (>90%), in_progress (no score)';
COMMENT ON COLUMN external_curriculum.practice_generated IS 'Track if extra practice has been generated for this topic';
