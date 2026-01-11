-- Migration: Add actual_minutes to schedule_items
-- Description: Allows parents to log actual time spent on completed activities
-- for homeschool compliance tracking

-- Add actual_minutes column (nullable - only set when parent logs time)
ALTER TABLE public.schedule_items 
ADD COLUMN IF NOT EXISTS actual_minutes INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.schedule_items.actual_minutes IS 
  'Actual time spent on activity (logged by parent after completion)';
