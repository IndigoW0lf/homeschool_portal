-- Migration: Add profile fields to kids table for personalization
-- These fields let kids or parents fill out fun profile details (MiAcademy-style)

-- Basic profile fields
ALTER TABLE kids ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS favorite_color TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS bio TEXT;

-- Fun "favorites" fields (like MiAcademy)
ALTER TABLE kids ADD COLUMN IF NOT EXISTS favorite_shows TEXT; -- Comma-separated or free text
ALTER TABLE kids ADD COLUMN IF NOT EXISTS favorite_music TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS favorite_foods TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS favorite_subjects TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS hobbies TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Avatar state for the avatar builder (outfit, accessories, colors)
ALTER TABLE kids ADD COLUMN IF NOT EXISTS avatar_state JSONB;

-- Comments:
-- avatar_url: URL to their DiceBear avatar or saved canvas export
-- avatar_state: Full state from AvatarBuilder {base, outfit, accessory, colors}
-- favorite_*: Free text fields the kid/parent can fill in
-- nickname: What they like to be called (shown around the app)
