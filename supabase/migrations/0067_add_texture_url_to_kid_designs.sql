-- Migration: Add texture_url to kid_designs table
-- This column is needed to store the URL of the generated texture image for custom designs
-- and is expected by the application code (ItemDesignRow type and API routes).

ALTER TABLE public.kid_designs
ADD COLUMN IF NOT EXISTS texture_url TEXT;

COMMENT ON COLUMN public.kid_designs.texture_url IS 'URL to the generated texture image for the design';
