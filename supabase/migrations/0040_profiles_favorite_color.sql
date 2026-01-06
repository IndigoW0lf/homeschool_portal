-- Add favorite_color column to profiles table for parent personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_color TEXT;

-- Ensure profiles have proper RLS for updates (in case 0037 wasn't applied)
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
