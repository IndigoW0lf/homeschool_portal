-- Migration: Fix kid-avatars storage RLS policy
-- The previous policy using storage.foldername() was not working correctly.
-- This simplified policy allows any authenticated family member to upload to kid folders.

-- Drop the broken policies
DROP POLICY IF EXISTS "Family members can upload kid avatars" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete kid avatars" ON storage.objects;

-- Recreate with simpler, working logic
-- Allow authenticated users to upload to kid-avatars if the kid belongs to one of their families
CREATE POLICY "Family members can upload kid avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kid-avatars' AND
  EXISTS (
    SELECT 1 FROM public.kids k
    JOIN public.family_members fm ON k.family_id = fm.family_id
    WHERE fm.user_id = auth.uid()
    -- Extract the kid ID from the path: 'kid-id/filename.jpg' -> kid-id
    AND split_part(name, '/', 1) = k.id
  )
);

-- Allow authenticated users to update (upsert) avatars
CREATE POLICY "Family members can update kid avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kid-avatars' AND
  EXISTS (
    SELECT 1 FROM public.kids k
    JOIN public.family_members fm ON k.family_id = fm.family_id
    WHERE fm.user_id = auth.uid()
    AND split_part(name, '/', 1) = k.id
  )
);

-- Allow authenticated users to delete avatars for their family's kids
CREATE POLICY "Family members can delete kid avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kid-avatars' AND
  EXISTS (
    SELECT 1 FROM public.kids k
    JOIN public.family_members fm ON k.family_id = fm.family_id
    WHERE fm.user_id = auth.uid()
    AND split_part(name, '/', 1) = k.id
  )
);
