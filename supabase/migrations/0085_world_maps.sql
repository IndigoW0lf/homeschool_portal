-- Migration: world_maps table for 2D World Game
-- Stores kid's world map terrain and placed items

-- Create world_maps table
CREATE TABLE IF NOT EXISTS public.world_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id TEXT NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  width INTEGER NOT NULL DEFAULT 10,
  height INTEGER NOT NULL DEFAULT 10,
  terrain JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT world_maps_kid_id_unique UNIQUE(kid_id)
);

-- Index for fast lookups by kid
CREATE INDEX IF NOT EXISTS idx_world_maps_kid_id ON public.world_maps(kid_id);

-- Enable RLS
ALTER TABLE public.world_maps ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies 
             WHERE tablename = 'world_maps' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.world_maps', pol.policyname);
  END LOOP;
END $$;

-- RLS Policy: Parents can manage their kids' worlds
-- Kids access via API (service_role) since they use cookie-based auth
CREATE POLICY "world_maps_access" ON public.world_maps FOR ALL
  USING (
    -- Parents can view worlds for kids they own
    EXISTS (
      SELECT 1 FROM public.kids k 
      WHERE k.id = world_maps.kid_id 
      AND k.user_id = (SELECT auth.uid())
    )
    -- Or service role for API access (kid sessions)
    OR (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    -- Parents can create/modify worlds for kids they own
    EXISTS (
      SELECT 1 FROM public.kids k 
      WHERE k.id = world_maps.kid_id 
      AND k.user_id = (SELECT auth.uid())
    )
    -- Or service role for API access
    OR (SELECT auth.role()) = 'service_role'
  );

-- Trigger to update updated_at on modification
DROP FUNCTION IF EXISTS update_world_maps_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_world_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS world_maps_updated_at ON public.world_maps;
CREATE TRIGGER world_maps_updated_at
  BEFORE UPDATE ON public.world_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_world_maps_updated_at();

-- Add comment
COMMENT ON TABLE public.world_maps IS 'Stores 2D world game maps with terrain grid and placed items for each kid';
