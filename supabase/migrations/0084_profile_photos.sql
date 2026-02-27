-- Add photo_url and profile_pic_type to kids and profiles tables
ALTER TABLE kids ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS profile_pic_type text DEFAULT 'avatar' CHECK (profile_pic_type IN ('avatar', 'photo'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_pic_type text DEFAULT 'avatar' CHECK (profile_pic_type IN ('avatar', 'photo'));
