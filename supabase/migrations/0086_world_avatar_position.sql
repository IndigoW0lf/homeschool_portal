-- Migration: Add avatar position to world_maps
-- Stores the kid's avatar position in their world

ALTER TABLE public.world_maps 
ADD COLUMN IF NOT EXISTS avatar_x INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS avatar_y INTEGER DEFAULT 5;

-- Update comment
COMMENT ON COLUMN public.world_maps.avatar_x IS 'Avatar X position (0-indexed)';
COMMENT ON COLUMN public.world_maps.avatar_y IS 'Avatar Y position (0-indexed)';
