-- Add status column to shop_purchases for fulfillment tracking
-- Kid buys instantly (moons deducted), parent marks as fulfilled when given

ALTER TABLE shop_purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unfulfilled';
ALTER TABLE shop_purchases ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;

-- Set existing purchases to fulfilled (they were fulfilled before this feature)
UPDATE shop_purchases SET status = 'fulfilled', fulfilled_at = purchased_at 
  WHERE status IS NULL OR status = 'pending' OR status = 'unfulfilled';

-- Index for quick unfulfilled lookups
CREATE INDEX IF NOT EXISTS idx_shop_purchases_status ON shop_purchases(status);
