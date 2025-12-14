-- Data Model Cleanup Migration
-- Adds explicit columns to lessons table for structured data
-- Removes reliance on parsing JSON from instructions field

-- 1. Add explicit JSONB columns to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS key_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS materials TEXT,
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate existing links from lesson_links junction table to JSONB
UPDATE lessons l
SET links = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('label', ll.label, 'url', ll.url)), '[]'::jsonb)
  FROM lesson_links ll WHERE ll.lesson_id = l.id
)
WHERE links IS NULL OR links = '[]'::jsonb;

-- 3. Create index for common queries
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);

-- Note: We keep lesson_links table for now in case rollback is needed.
-- It can be dropped in a future migration after verifying data integrity.
-- DROP TABLE IF EXISTS lesson_links; -- Uncomment after verification
