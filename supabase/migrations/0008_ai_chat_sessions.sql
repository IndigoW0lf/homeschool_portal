-- AI Chat Sessions Table
-- Stores Luna conversation history per user

CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context for this session
  context_type TEXT NOT NULL CHECK (context_type IN ('WEEK_THINK', 'LESSON_STUCK', 'INTEREST_SPARK', 'REFLECTION', 'GENERAL')),
  context_data JSONB DEFAULT '{}', -- childProfileId, lessonId, weekStartDate
  
  -- Conversation messages (array of {role, content, response?, timestamp})
  messages JSONB NOT NULL DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can manage own chat sessions"
  ON ai_chat_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_updated ON ai_chat_sessions(updated_at DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_session_timestamp();

-- Add comment
COMMENT ON TABLE ai_chat_sessions IS 'Stores Luna AI conversation history. Max 10 per user, auto-cleanup after 30 days.';
