-- Migration: Saved Ideas Table
-- Stores Luna suggestions that parents want to keep

CREATE TABLE saved_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- From auth.users
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_message TEXT,  -- The parent's original question/message for context
  source_type TEXT DEFAULT 'luna',
  suggestion_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own ideas
CREATE POLICY "Users can view own ideas"
  ON saved_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON saved_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON saved_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster user lookups
CREATE INDEX idx_saved_ideas_user_id ON saved_ideas(user_id);
CREATE INDEX idx_saved_ideas_created_at ON saved_ideas(created_at DESC);
