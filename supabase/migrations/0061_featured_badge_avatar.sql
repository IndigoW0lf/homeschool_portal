-- Migration: Add featured_badge_id and avatar_url to kids table
-- These support the new "bragging rights" featured badge and custom avatar upload features

-- Add featured_badge_id column (stores the badge ID the kid wants to show off)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kids' 
    AND column_name = 'featured_badge_id'
  ) THEN
    ALTER TABLE public.kids ADD COLUMN featured_badge_id TEXT;
  END IF;
END $$;

-- Add avatar_url column (stores custom uploaded avatar URL)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kids' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.kids ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Create storage bucket for kid avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kid-avatars', 'kid-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for kid-avatars bucket
-- Allow authenticated users to upload/update their family's kid avatars
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Family members can upload kid avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view kid avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Family members can delete kid avatars" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow family members to upload avatars for their kids
CREATE POLICY "Family members can upload kid avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kid-avatars' AND
  EXISTS (
    SELECT 1 FROM public.kids k
    JOIN public.family_members fm ON k.family_id = fm.family_id
    WHERE fm.user_id = auth.uid()
    AND (storage.foldername(name))[1] = k.id::text
  )
);

-- Allow anyone to view kid avatars (they're public)
CREATE POLICY "Anyone can view kid avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kid-avatars');

-- Allow family members to delete their kids' avatars
CREATE POLICY "Family members can delete kid avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kid-avatars' AND
  EXISTS (
    SELECT 1 FROM public.kids k
    JOIN public.family_members fm ON k.family_id = fm.family_id
    WHERE fm.user_id = auth.uid()
    AND (storage.foldername(name))[1] = k.id::text
  )
);
