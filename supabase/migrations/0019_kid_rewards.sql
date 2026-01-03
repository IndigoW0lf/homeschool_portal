-- Kid Rewards Schema
-- Stores parent-configured rewards per kid

CREATE TABLE IF NOT EXISTS kid_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  
  -- Reward details
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🎁',
  category TEXT DEFAULT 'custom',
  moon_cost INT NOT NULL DEFAULT 10,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Redemptions (pending approval)
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES kid_rewards(id) ON DELETE CASCADE,
  
  -- Status: pending, approved, denied
  status TEXT DEFAULT 'pending',
  
  -- Audit
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_note TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kid_rewards_kid ON kid_rewards(kid_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_kid ON reward_redemptions(kid_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- RLS
ALTER TABLE kid_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Public read (kid portal)
CREATE POLICY "Public read kid_rewards" ON kid_rewards FOR SELECT USING (true);
CREATE POLICY "Auth write kid_rewards" ON kid_rewards FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read reward_redemptions" ON reward_redemptions FOR SELECT USING (true);
CREATE POLICY "Auth write reward_redemptions" ON reward_redemptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update reward_redemptions" ON reward_redemptions FOR UPDATE USING (auth.role() = 'authenticated');
