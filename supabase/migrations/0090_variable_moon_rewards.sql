-- Add moon_reward column to assignment_items (Default 1)
ALTER TABLE assignment_items 
ADD COLUMN IF NOT EXISTS moon_reward INTEGER DEFAULT 1;

-- Add moon_reward column to lessons (Default 1)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS moon_reward INTEGER DEFAULT 1;

-- Add journal_moon_reward column to kids (Default 1)
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS journal_moon_reward INTEGER DEFAULT 1;
