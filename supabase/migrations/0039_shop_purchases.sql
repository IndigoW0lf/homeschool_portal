-- Shop Purchases Table
-- Tracks all shop purchases to prevent cache-clearing exploits
-- Also stores unlocks granted by each purchase

CREATE TABLE IF NOT EXISTS shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT,
  cost INTEGER NOT NULL,
  unlocks_granted TEXT[] DEFAULT '{}',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate purchases
  UNIQUE(kid_id, item_id)
);

-- Enable RLS
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/insert for their family's kids
CREATE POLICY "shop_purchases_select" ON shop_purchases FOR SELECT
  USING (kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids())));

CREATE POLICY "shop_purchases_insert" ON shop_purchases FOR INSERT
  WITH CHECK (kid_id IN (SELECT id FROM kids WHERE family_id IN (SELECT user_family_ids())));

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_shop_purchases_kid_id ON shop_purchases(kid_id);

-- Also ensure kids.moons column exists and is used as source of truth
-- (It was added in earlier migration, just confirming it's used)
