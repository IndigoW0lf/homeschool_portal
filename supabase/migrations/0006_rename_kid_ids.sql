-- Migration: Rename Kid IDs
-- Changes kid-9 -> atlas and kid-12 -> stella
-- Run this ONCE against your existing Supabase database

-- Strategy: INSERT new → UPDATE references → DELETE old
-- This avoids foreign key constraint issues

BEGIN;

-- 1. INSERT new kid records with new IDs
INSERT INTO kids (id, name, grade_band) VALUES 
  ('atlas', 'Atlas', '3-5'),
  ('stella', 'Stella', '6-8')
ON CONFLICT (id) DO NOTHING;

-- 2. UPDATE all child tables to reference new IDs

-- schedule_items
UPDATE schedule_items SET student_id = 'atlas' WHERE student_id = 'kid-9';
UPDATE schedule_items SET student_id = 'stella' WHERE student_id = 'kid-12';

-- student_progress
UPDATE student_progress SET kid_id = 'atlas' WHERE kid_id = 'kid-9';
UPDATE student_progress SET kid_id = 'stella' WHERE kid_id = 'kid-12';

-- progress_awards
UPDATE progress_awards SET kid_id = 'atlas' WHERE kid_id = 'kid-9';
UPDATE progress_awards SET kid_id = 'stella' WHERE kid_id = 'kid-12';

-- student_unlocks
UPDATE student_unlocks SET kid_id = 'atlas' WHERE kid_id = 'kid-9';
UPDATE student_unlocks SET kid_id = 'stella' WHERE kid_id = 'kid-12';

-- 3. DELETE old kid records (now orphaned)
DELETE FROM kids WHERE id = 'kid-9';
DELETE FROM kids WHERE id = 'kid-12';

COMMIT;

-- Verify the changes
SELECT * FROM kids;

