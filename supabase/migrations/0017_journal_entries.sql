-- Journal Prompt Feature Migration
-- Adds journal settings to kids table and creates journal_entries table

-- Add journal settings columns to kids table
ALTER TABLE kids ADD COLUMN IF NOT EXISTS journal_enabled BOOLEAN DEFAULT true;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS journal_allow_skip BOOLEAN DEFAULT true;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS journal_prompt_types TEXT[] DEFAULT '{feelings,gratitude,imagination,opinions,memories,goals}';

-- Create journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,           -- null if skipped
  mood TEXT,               -- happy, calm, thoughtful, frustrated, sad
  skipped BOOLEAN DEFAULT false,
  prompt_type TEXT,        -- category of the prompt
  tags TEXT[],             -- AI-detected themes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(kid_id, date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_kid_date ON journal_entries(kid_id, date);

-- RLS Policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Public read for kid portal
CREATE POLICY "Public read journal_entries" ON journal_entries FOR SELECT USING (true);

-- Allow insert (WITH CHECK for INSERT)
CREATE POLICY "Allow insert journal_entries" ON journal_entries FOR INSERT WITH CHECK (true);

-- Allow update
CREATE POLICY "Allow update journal_entries" ON journal_entries FOR UPDATE USING (true);

