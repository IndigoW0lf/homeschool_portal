-- Migration: Activity Log
-- Manual logging of homeschool activities for compliance documentation
-- Tracks subject, time, dates, and descriptions

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  
  -- Core fields
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT,
  
  -- Source tracking (manual vs auto-imported)
  source TEXT DEFAULT 'manual',
  source_item_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_log_kid_id ON activity_log(kid_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(date);
CREATE INDEX IF NOT EXISTS idx_activity_log_subject ON activity_log(subject);
CREATE INDEX IF NOT EXISTS idx_activity_log_kid_date ON activity_log(kid_id, date);

-- RLS Policies: Use family-based access like kids table
-- Single policy with public read, authenticated write
DROP POLICY IF EXISTS "activity_log_access" ON activity_log;
CREATE POLICY "activity_log_access" ON activity_log FOR ALL
  USING (
    kid_id IN (
      SELECT k.id FROM kids k 
      WHERE k.family_id IN (SELECT user_family_ids())
      OR k.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
    AND kid_id IN (
      SELECT k.id FROM kids k 
      WHERE k.family_id IN (SELECT user_family_ids())
      OR k.user_id = (SELECT auth.uid())
    )
  );
