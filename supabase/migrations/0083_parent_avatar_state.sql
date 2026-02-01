-- Migration: Add Open Peeps avatar state for parent profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS open_peeps_avatar_state JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.open_peeps_avatar_state IS 
'Stores the Open Peeps avatar customization state for parents';
