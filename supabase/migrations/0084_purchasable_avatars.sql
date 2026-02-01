-- Purchasable Open Peeps Avatar System
-- Migration: 0084_purchasable_avatars.sql

-- Table for kid-owned avatars (references JSON catalog by ID)
CREATE TABLE IF NOT EXISTS kid_owned_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  avatar_id TEXT NOT NULL,  -- References ID in purchasable-avatars.json
  category TEXT NOT NULL CHECK (category IN ('upper', 'standing', 'sitting', 'special', 'medical')),
  svg_path TEXT NOT NULL,
  name TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kid_id, avatar_id)
);

-- Add design studio unlock flag to kids table
ALTER TABLE kids ADD COLUMN IF NOT EXISTS design_studio_unlocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add active avatar field to kids table (stores avatar_id from catalog)
ALTER TABLE kids ADD COLUMN IF NOT EXISTS active_avatar_id TEXT;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS active_avatar_path TEXT;

-- RLS Policies
ALTER TABLE kid_owned_avatars ENABLE ROW LEVEL SECURITY;

-- Parents can read their kids' owned avatars
CREATE POLICY "Parents can read kid owned avatars"
  ON kid_owned_avatars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kids k
      WHERE k.id = kid_owned_avatars.kid_id
      AND k.parent_id = auth.uid()
    )
  );

-- Service role handles inserts for avatar purchases
CREATE POLICY "Service role can manage kid owned avatars"
  ON kid_owned_avatars FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kid_owned_avatars_kid_id ON kid_owned_avatars(kid_id);
CREATE INDEX IF NOT EXISTS idx_kid_owned_avatars_category ON kid_owned_avatars(category);
