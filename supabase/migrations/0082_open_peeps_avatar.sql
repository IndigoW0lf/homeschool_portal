-- Migration: Add Open Peeps 2D Avatar System
-- This adds support for the new DiceBear-based Open Peeps avatar customization

-- Add open_peeps_avatar_state column to kids table
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS open_peeps_avatar_state JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN kids.open_peeps_avatar_state IS 
'Stores the Open Peeps avatar customization state including face, head, accessories, facialHair, skinColor, clothingColor, backgroundColor';

-- Create kid_avatar_items table to track purchased/unlocked premium avatar items
CREATE TABLE IF NOT EXISTS kid_avatar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  item_category TEXT NOT NULL CHECK (item_category IN ('face', 'head', 'accessories', 'facialHair')),
  item_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kid_id, item_category, item_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kid_avatar_items_kid_id ON kid_avatar_items(kid_id);

-- Enable RLS
ALTER TABLE kid_avatar_items ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all items
CREATE POLICY "Service role can manage kid_avatar_items"
ON kid_avatar_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy: Parents can view their kids' items
CREATE POLICY "Parents can view kid avatar items"
ON kid_avatar_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM kids k
    WHERE k.id = kid_avatar_items.kid_id
    AND k.user_id = auth.uid()
  )
);

-- Policy: Parents can insert items for their kids (for purchases)
CREATE POLICY "Parents can insert kid avatar items"
ON kid_avatar_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM kids k
    WHERE k.id = kid_avatar_items.kid_id
    AND k.user_id = auth.uid()
  )
);
