-- Student Progress Migration
-- Migrates progress tracking from localStorage to Supabase

-- 1. Student Progress - cumulative stats per kid
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  
  -- Cumulative stats
  total_stars INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  last_completed_date DATE,
  
  -- Configurable school days (stored as array of day numbers: 0=Sun, 2=Tue, etc)
  school_days INT[] DEFAULT '{2,3,4}', -- Tue, Wed, Thu by default
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(kid_id)
);

-- 2. Progress Awards - ledger of each star award (prevents double-awarding)
CREATE TABLE IF NOT EXISTS progress_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  item_id TEXT NOT NULL, -- schedule_item id or 'dailyBonus'
  stars_earned INT DEFAULT 1,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(kid_id, date, item_id)
);

-- 3. Student Unlocks - badges/unlocks earned
CREATE TABLE IF NOT EXISTS student_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  unlock_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(kid_id, unlock_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_awards_kid_date ON progress_awards(kid_id, date);
CREATE INDEX IF NOT EXISTS idx_student_unlocks_kid ON student_unlocks(kid_id);

-- RLS Policies
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_unlocks ENABLE ROW LEVEL SECURITY;

-- Public read access (kid portal doesn't require auth)
CREATE POLICY "Public read student_progress" ON student_progress FOR SELECT USING (true);
CREATE POLICY "Auth write student_progress" ON student_progress FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read progress_awards" ON progress_awards FOR SELECT USING (true);
CREATE POLICY "Auth write progress_awards" ON progress_awards FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read student_unlocks" ON student_unlocks FOR SELECT USING (true);
CREATE POLICY "Auth write student_unlocks" ON student_unlocks FOR ALL USING (auth.role() = 'authenticated');

-- Seed initial progress for existing kids
INSERT INTO student_progress (kid_id) VALUES ('atlas'), ('stella')
ON CONFLICT (kid_id) DO NOTHING;
