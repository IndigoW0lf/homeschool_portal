-- Migration: Avatar Design Studio Tier System
-- Adds tier-based progression to design studio with unlock tracking

-- Add design studio tier column to kids table
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS design_studio_tier INT DEFAULT 1 CHECK (design_studio_tier BETWEEN 1 AND 4);

-- Add tier unlock history tracking (JSONB for flexibility)
ALTER TABLE kids
ADD COLUMN IF NOT EXISTS design_studio_tier_unlocks JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN kids.design_studio_tier IS 
'Current design studio tier level (1-4): 1=Starter, 2=Creator, 3=Designer, 4=Fashion Master';

COMMENT ON COLUMN kids.design_studio_tier_unlocks IS 
'History of tier unlocks with timestamps, e.g. {"2": "2026-02-02T12:00:00Z", "3": "2026-02-15T14:30:00Z"}';

-- Create design_tier_unlocks table for detailed unlock history and analytics
CREATE TABLE IF NOT EXISTS public.design_tier_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  from_tier INT NOT NULL CHECK (from_tier BETWEEN 1 AND 4),
  to_tier INT NOT NULL CHECK (to_tier BETWEEN 1 AND 4),
  moon_cost INT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_tier_upgrade CHECK (to_tier > from_tier)
);

-- Index for fast lookups by kid
CREATE INDEX IF NOT EXISTS idx_design_tier_unlocks_kid_id ON public.design_tier_unlocks(kid_id);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_design_tier_unlocks_unlocked_at ON public.design_tier_unlocks(unlocked_at);

-- Enable RLS
ALTER TABLE public.design_tier_unlocks ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all unlock records
CREATE POLICY "Service role can manage design_tier_unlocks"
ON design_tier_unlocks FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy: Parents can view their kids' tier unlock history
CREATE POLICY "Parents can view kid design tier unlocks"
ON design_tier_unlocks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM kids k
    WHERE k.id = design_tier_unlocks.kid_id
    AND k.user_id = auth.uid()
  )
);

-- Add comment
COMMENT ON TABLE public.design_tier_unlocks IS 'Tracks history of design studio tier upgrades for analytics and audit trail';
