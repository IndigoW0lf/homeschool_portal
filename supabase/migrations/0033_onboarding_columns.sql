-- 0033: Add has_seen_tutorial columns for onboarding

-- Add to profiles table for parents
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_tutorial BOOLEAN DEFAULT false;

-- Add to kids table
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS has_seen_tutorial BOOLEAN DEFAULT false;
