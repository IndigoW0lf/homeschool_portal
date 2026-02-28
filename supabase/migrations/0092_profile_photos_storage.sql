-- Create storage bucket for parent profile photos (used by POST /api/profile/photo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can manage their own profile photos (path: user_id/filename)
DROP POLICY IF EXISTS "Users can upload own profile photo" ON storage.objects;
CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own profile photo" ON storage.objects;
CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own profile photo" ON storage.objects;
CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for profile photos
DROP POLICY IF EXISTS "Profile photos are public" ON storage.objects;
CREATE POLICY "Profile photos are public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
