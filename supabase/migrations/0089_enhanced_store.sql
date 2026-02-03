-- Enhanced Shop Features
-- Adds support for Phosphor icons, unlimited/one-time items, and custom templates

-- 1. Modify kid_rewards table
ALTER TABLE kid_rewards ADD COLUMN IF NOT EXISTS icon TEXT; -- Phosphor icon name
ALTER TABLE kid_rewards ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT true; -- Unlimited purchases vs one-time

-- 2. Create reward_templates table
CREATE TABLE IF NOT EXISTS reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE, -- Scoped to family
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Phosphor icon name
  emoji TEXT, -- Fallback/Legacy
  category TEXT DEFAULT 'custom',
  moon_cost INT NOT NULL DEFAULT 10,
  is_unlimited BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for reward_templates
ALTER TABLE reward_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view reward templates"
  ON reward_templates FOR SELECT
  USING (family_id IN (SELECT user_family_ids()));

CREATE POLICY "Family admins can manage reward templates"
  ON reward_templates FOR ALL
  USING (user_is_family_admin(family_id));

-- 3. Migration: Map existing emojis to Phosphor icons (Best effort)
UPDATE kid_rewards SET icon = 'DeviceMobile' WHERE emoji = '📱' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'FilmStrip' WHERE emoji = '🎬' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Play' WHERE emoji = '▶️' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'GameController' WHERE emoji = '🎮' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'DeviceTablet' WHERE emoji = '📲' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Television' WHERE emoji = '📺' AND icon IS NULL;

UPDATE kid_rewards SET icon = 'DiceFive' WHERE emoji = '🎲' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Palette' WHERE emoji = '🎨' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Cookie' WHERE emoji = '🧁' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Bicycle' WHERE emoji = '🚴' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Tree' WHERE emoji = '🌳' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Flask' WHERE emoji = '🔬' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'MusicNotes' WHERE emoji = '💃' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'PuzzlePiece' WHERE emoji = '🧩' AND icon IS NULL;

UPDATE kid_rewards SET icon = 'IceCream' WHERE emoji = '🍦' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Candy' WHERE emoji = '🍬' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Popcorn' WHERE emoji = '🍿' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Waffle' WHERE emoji = '🥞' AND icon IS NULL; -- Waffle logic
UPDATE kid_rewards SET icon = 'Pizza' WHERE emoji = '🍕' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Cake' WHERE emoji = '🍰' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Coffee' WHERE emoji = '☕' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Drink' WHERE emoji = '🥤' AND icon IS NULL;

UPDATE kid_rewards SET icon = 'Moon' WHERE emoji = '🌙' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Prohibit' WHERE emoji = '🙅' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'MusicNote' WHERE emoji = '🎵' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Car' WHERE emoji = '🚗' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Carrot' WHERE emoji = '🥦' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Phone' WHERE emoji = '📞' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Bed' WHERE emoji = '🛏️' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Bed' WHERE emoji = '🛌' AND icon IS NULL;

UPDATE kid_rewards SET icon = 'Books' WHERE emoji = '📚' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'ForkKnife' WHERE emoji = '🍽️' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'PawPrint' WHERE emoji = '🦁' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Bank' WHERE emoji = '🏛️' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'BowlingBall' WHERE emoji = '🎳' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'FlagBanner' WHERE emoji = '⛳' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Fish' WHERE emoji = '🐠' AND icon IS NULL;
UPDATE kid_rewards SET icon = 'Alien' WHERE emoji = '👾' AND icon IS NULL;

-- Default fallback
UPDATE kid_rewards SET icon = 'Gift' WHERE icon IS NULL;
