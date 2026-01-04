-- Migration: External Curriculum Import
-- Stores data from external platforms like Miacademy

CREATE TABLE IF NOT EXISTS external_curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'miacademy',
  task_name TEXT NOT NULL,
  course TEXT,
  subject TEXT,
  date DATE,
  score INTEGER,  -- percentage as integer (83 = 83%)
  item_type TEXT, -- 'assessment', 'practice', 'supplemental', 'lesson'
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE external_curriculum ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX idx_external_curriculum_kid_id ON external_curriculum(kid_id);
CREATE INDEX idx_external_curriculum_date ON external_curriculum(date);
CREATE INDEX idx_external_curriculum_subject ON external_curriculum(subject);
CREATE INDEX idx_external_curriculum_source ON external_curriculum(source);

-- RLS Policies: Use family-based access like kids
CREATE POLICY "Users can view family external curriculum"
  ON external_curriculum FOR SELECT
  USING (
    kid_id IN (
      SELECT k.id FROM kids k 
      WHERE k.family_id IN (SELECT user_family_ids())
      OR k.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert family external curriculum"
  ON external_curriculum FOR INSERT
  WITH CHECK (
    kid_id IN (
      SELECT k.id FROM kids k 
      WHERE k.family_id IN (SELECT user_family_ids())
      OR k.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete family external curriculum"
  ON external_curriculum FOR DELETE
  USING (
    kid_id IN (
      SELECT k.id FROM kids k 
      WHERE k.family_id IN (SELECT user_family_ids())
      OR k.user_id = auth.uid()
    )
  );
