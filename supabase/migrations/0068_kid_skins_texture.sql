-- Migration: Add texture_url to kid_designs and setup storage

-- Add texture_url column
ALTER TABLE public.kid_designs 
ADD COLUMN IF NOT EXISTS texture_url TEXT;

-- Create storage bucket for kid skins
INSERT INTO storage.buckets (id, name, public)
VALUES ('kid-skins', 'kid-skins', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for kid-skins

-- 1. Allow public read access (for Unity and Web Preview)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'kid-skins' );

-- 2. Allow authenticated inserts (Service Role via API will handle the actual upload usually, but good to have)
-- Ideally, we only want the API (Service Role) to write to this bucket to ensure validation.
-- But if we use client-side upload later, we might need policy.
-- For now, we will rely on Service Role in the Next.js API route to upload, so we don't strictly need an INSERT policy for authenticated users if we use service role key.
-- However, adding one for 'authenticated' role just in case we switch to client upload.

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'kid-skins' );

-- 3. Allow update/delete by owner (or service role)
-- Since files are named by design ID, and managed via API, we typically use service role.
