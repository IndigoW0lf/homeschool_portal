-- Homeschool Portal Database Schema
-- MVP schema for Vercel + Supabase deployment

-- Kids table
CREATE TABLE IF NOT EXISTS kids (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade_band TEXT
);

-- Seed kids
INSERT INTO kids (id, name, grade_band) VALUES
  ('atlas', 'Atlas', '3-5'),
  ('stella', 'Stella', '6-8')
ON CONFLICT (id) DO NOTHING;

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  estimated_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson links table
CREATE TABLE IF NOT EXISTS lesson_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL
);

-- Lesson attachments table
CREATE TABLE IF NOT EXISTS lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL
);

-- Assignments table (calendar entries)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  theme TEXT,
  journal_prompt TEXT,
  project_prompt TEXT,
  parent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment-Kids junction table
CREATE TABLE IF NOT EXISTS assignment_kids (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, kid_id)
);

-- Assignment-Lessons junction table
CREATE TABLE IF NOT EXISTS assignment_lessons (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (assignment_id, lesson_id)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  pinned_today BOOLEAN DEFAULT FALSE
);

-- Seed MiAcademy resource
INSERT INTO resources (category, label, url, pinned_today, sort_order) VALUES
  ('reading', 'MiAcademy (Daily)', 'https://miacademy.co/login#/', TRUE, 0)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, authenticated write

-- Kids policies
CREATE POLICY "Kids are viewable by everyone"
  ON kids FOR SELECT
  USING (true);

CREATE POLICY "Kids are editable by authenticated users"
  ON kids FOR ALL
  USING (auth.role() = 'authenticated');

-- Lessons policies
CREATE POLICY "Lessons are viewable by everyone"
  ON lessons FOR SELECT
  USING (true);

CREATE POLICY "Lessons are editable by authenticated users"
  ON lessons FOR ALL
  USING (auth.role() = 'authenticated');

-- Lesson links policies
CREATE POLICY "Lesson links are viewable by everyone"
  ON lesson_links FOR SELECT
  USING (true);

CREATE POLICY "Lesson links are editable by authenticated users"
  ON lesson_links FOR ALL
  USING (auth.role() = 'authenticated');

-- Lesson attachments policies
CREATE POLICY "Lesson attachments are viewable by everyone"
  ON lesson_attachments FOR SELECT
  USING (true);

CREATE POLICY "Lesson attachments are editable by authenticated users"
  ON lesson_attachments FOR ALL
  USING (auth.role() = 'authenticated');

-- Assignments policies
CREATE POLICY "Assignments are viewable by everyone"
  ON assignments FOR SELECT
  USING (true);

CREATE POLICY "Assignments are editable by authenticated users"
  ON assignments FOR ALL
  USING (auth.role() = 'authenticated');

-- Assignment kids policies
CREATE POLICY "Assignment kids are viewable by everyone"
  ON assignment_kids FOR SELECT
  USING (true);

CREATE POLICY "Assignment kids are editable by authenticated users"
  ON assignment_kids FOR ALL
  USING (auth.role() = 'authenticated');

-- Assignment lessons policies
CREATE POLICY "Assignment lessons are viewable by everyone"
  ON assignment_lessons FOR SELECT
  USING (true);

CREATE POLICY "Assignment lessons are editable by authenticated users"
  ON assignment_lessons FOR ALL
  USING (auth.role() = 'authenticated');

-- Resources policies
CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  USING (true);

CREATE POLICY "Resources are editable by authenticated users"
  ON resources FOR ALL
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_links_lesson_id ON lesson_links(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson_id ON lesson_attachments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignment_kids_kid_id ON assignment_kids(kid_id);
CREATE INDEX IF NOT EXISTS idx_assignment_kids_assignment_id ON assignment_kids(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_lessons_assignment_id ON assignment_lessons(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_lessons_lesson_id ON assignment_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_pinned_today ON resources(pinned_today) WHERE pinned_today = TRUE;

