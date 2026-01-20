-- Migration: Add featured_badges field to kids table
-- Allows kids to select up to 3 badges to showcase on their portal

ALTER TABLE kids ADD COLUMN IF NOT EXISTS featured_badges TEXT[] DEFAULT '{}';

COMMENT ON COLUMN kids.featured_badges IS 'Array of up to 3 badge IDs to feature on the kid portal progress card';
