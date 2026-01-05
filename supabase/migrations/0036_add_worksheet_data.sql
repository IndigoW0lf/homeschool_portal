-- Migration to add worksheet_data to assignment_items

ALTER TABLE public.assignment_items 
ADD COLUMN IF NOT EXISTS worksheet_data JSONB;

-- Comment on column
COMMENT ON COLUMN public.assignment_items.worksheet_data IS 'Structured data for AI-generated worksheets (sections, questions, etc.)';
