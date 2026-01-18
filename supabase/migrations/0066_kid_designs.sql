-- Migration: kid_designs table for Avatar Creator Studio
-- Stores kid-created clothing designs with colors and strokes

-- Create kid_designs table
CREATE TABLE IF NOT EXISTS public.kid_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kid_id text NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  design_data JSONB NOT NULL DEFAULT '{"regions": {}}'::jsonb,
  is_equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by kid
CREATE INDEX IF NOT EXISTS idx_kid_designs_kid_id ON public.kid_designs(kid_id);

-- Index for finding equipped designs
CREATE INDEX IF NOT EXISTS idx_kid_designs_equipped ON public.kid_designs(kid_id, is_equipped) WHERE is_equipped = true;

-- Enable RLS
ALTER TABLE public.kid_designs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies 
             WHERE tablename = 'kid_designs' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.kid_designs', pol.policyname);
  END LOOP;
END $$;

-- RLS Policy: Kids access their own designs (via API using service role)
-- Parents can view/manage all family kids' designs
CREATE POLICY "kid_designs_access" ON public.kid_designs FOR ALL
  USING (
    -- Parents can view designs for kids they own
    EXISTS (
      SELECT 1 FROM public.kids k 
      WHERE k.id = kid_designs.kid_id 
      AND k.user_id = (SELECT auth.uid())
    )
    -- Or service role for API access
    OR (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    -- Parents can create/modify designs for kids they own
    EXISTS (
      SELECT 1 FROM public.kids k 
      WHERE k.id = kid_designs.kid_id 
      AND k.user_id = (SELECT auth.uid())
    )
    -- Or service role for API access
    OR (SELECT auth.role()) = 'service_role'
  );

-- Trigger to update updated_at on modification
DROP FUNCTION IF EXISTS update_kid_designs_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_kid_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS kid_designs_updated_at ON public.kid_designs;
CREATE TRIGGER kid_designs_updated_at
  BEFORE UPDATE ON public.kid_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_kid_designs_updated_at();

-- Add comment
COMMENT ON TABLE public.kid_designs IS 'Stores custom clothing designs created by kids in the Avatar Creator Studio';
