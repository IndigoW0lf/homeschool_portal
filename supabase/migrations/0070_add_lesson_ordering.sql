-- Add pinning and ordering to lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS display_order SERIAL; -- Use SERIAL to auto-increment for new items roughly, though we'll manage it manually mostly
