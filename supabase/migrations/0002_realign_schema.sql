-- Rename old assignments table to day_plans to match "Day Plan" concept
ALTER TABLE assignments RENAME TO day_plans;

-- Drop old junction tables that were tied to "assignments as days"
-- We will rebuild the schedule structure
DROP TABLE IF EXISTS assignment_kids;
DROP TABLE IF EXISTS assignment_lessons;

-- Update day_plans columns
-- Rename date to plan_date to be explicit (optional, but 'date' is reserved word sometimes)
-- Keep 'date' for now to minimize churn if it works
-- Add any missing fields?
-- day_plans: id, date, theme, journal_prompt, parent_notes...

-- 2. Update lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS parent_notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. Create new assignments table (The "Do" / Output items)
CREATE TABLE IF NOT EXISTS assignment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT DEFAULT 'Practice',
  deliverable TEXT,
  rubric JSONB DEFAULT '[]'::jsonb, -- Array of strings or objects
  steps JSONB DEFAULT '[]'::jsonb, -- Instructions steps
  parent_notes TEXT,
  estimated_minutes INT DEFAULT 15,
  tags TEXT[] DEFAULT '{}',
  links JSONB DEFAULT '[]'::jsonb, -- Store links as JSONB for simplicity or use junction
  is_template BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Create schedule_items (The Playlist)
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  student_id TEXT REFERENCES kids(id),
  
  -- Polymorphic reference
  item_type TEXT NOT NULL CHECK (item_type IN ('lesson', 'assignment', 'resource', 'custom')),
  item_id UUID, -- Can be null for custom items
  
  -- Override/Instance data
  title_override TEXT, -- If they renamed it for the schedule
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  
  sort_order INT DEFAULT 0,
  
  -- Validation: item_id should be present if not custom
  CONSTRAINT fk_lesson FOREIGN KEY (item_id) REFERENCES lessons(id) ON DELETE SET NULL, 
  -- Note: FK constraint is tricky with polymorphic. 
  -- Usually we don't enforce FK strictly or use separate columns: lesson_id, assignment_id.
  -- Let's use separate columns for referential integrity.
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignment_items(id) ON DELETE SET NULL,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL
);

-- Add indexes
CREATE INDEX idx_schedule_date_student ON schedule_items(date, student_id);

-- RLS Updates
ALTER TABLE day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for single-tenant/family use: Authenticated = Admin)
CREATE POLICY "Allow all for auth users" ON day_plans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for auth users" ON assignment_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for auth users" ON schedule_items FOR ALL USING (auth.role() = 'authenticated');
