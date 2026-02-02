-- Migration: World pack unlocks table
-- Tracks which world packs each kid has purchased

CREATE TABLE IF NOT EXISTS public.kid_world_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT kid_world_unlocks_unique UNIQUE (kid_id, pack_id)
);

-- Enable RLS
ALTER TABLE public.kid_world_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Parents can manage their children's unlocks, service role for kids
CREATE POLICY "kid_world_unlocks_access" ON public.kid_world_unlocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kids k 
      WHERE k.id = kid_world_unlocks.kid_id 
      AND k.user_id = (SELECT auth.uid())
    )
    OR (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kids k 
      WHERE k.id = kid_world_unlocks.kid_id 
      AND k.user_id = (SELECT auth.uid())
    )
    OR (SELECT auth.role()) = 'service_role'
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kid_world_unlocks_kid_id ON public.kid_world_unlocks(kid_id);
