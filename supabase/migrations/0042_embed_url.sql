-- Add embed_url column to lessons and assignments for embedded content
-- Supports YouTube, Wizer, Google Forms, and any other embeddable URL

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS embed_url TEXT;
ALTER TABLE assignment_items ADD COLUMN IF NOT EXISTS embed_url TEXT;

COMMENT ON COLUMN lessons.embed_url IS 'Optional URL for embedded content (YouTube, Wizer, etc.)';
COMMENT ON COLUMN assignment_items.embed_url IS 'Optional URL for embedded content (YouTube, Wizer, etc.)';

-- Table to store kid responses to interactive worksheets
CREATE TABLE IF NOT EXISTS worksheet_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignment_items(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kid_id, assignment_id)
);

-- RLS for worksheet_responses
ALTER TABLE worksheet_responses ENABLE ROW LEVEL SECURITY;

-- Kids can insert/update their own responses
CREATE POLICY "worksheet_responses_kid_write" ON worksheet_responses
  FOR ALL USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN family_members fm ON k.family_id = fm.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Parents can read responses for kids in their family
CREATE POLICY "worksheet_responses_family_read" ON worksheet_responses
  FOR SELECT USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN family_members fm ON k.family_id = fm.family_id
      WHERE fm.user_id = auth.uid()
    )
  );
