-- Add streak_enabled column for per-kid gamification settings
ALTER TABLE kids ADD COLUMN IF NOT EXISTS streak_enabled BOOLEAN NOT NULL DEFAULT true;
