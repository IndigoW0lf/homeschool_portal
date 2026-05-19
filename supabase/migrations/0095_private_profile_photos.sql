-- Make profile-photos bucket private (authenticated read only)
-- Previously public: any URL was readable by anyone who knew the path.

UPDATE storage.buckets
SET public = false
WHERE id = 'profile-photos';

-- Drop the open public-read policy
DROP POLICY IF EXISTS "Profile photos are public" ON storage.objects;

-- Authenticated users (parents) can read any profile photo via signed URLs
-- generated server-side through /api/profile/photo
CREATE POLICY "Authenticated users can read profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');
