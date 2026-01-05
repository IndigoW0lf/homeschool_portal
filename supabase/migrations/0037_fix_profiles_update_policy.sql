-- Fix profiles UPDATE policy to include WITH CHECK clause
-- This ensures users can update their own profile

-- Drop and recreate the update policy with both USING and WITH CHECK
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE 
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Also ensure INSERT policy exists for new users
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT 
  WITH CHECK (id = (SELECT auth.uid()));
