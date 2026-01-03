-- Moon History Enhancement Migration
-- Adds source and note columns to progress_awards for better transaction tracking

-- Add source column for transaction type
ALTER TABLE progress_awards ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'assignment';
-- Possible values: 'assignment', 'journal', 'bonus', 'daily_login', 'purchase' (negative)

-- Add note column for parent comments on bonus awards
ALTER TABLE progress_awards ADD COLUMN IF NOT EXISTS note TEXT;

-- Create index for date-based queries (last 30 days history)
CREATE INDEX IF NOT EXISTS idx_progress_awards_awarded_at ON progress_awards(awarded_at DESC);
