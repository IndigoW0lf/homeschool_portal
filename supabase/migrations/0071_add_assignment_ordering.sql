-- Add pinning and ordering to assignment_items
ALTER TABLE assignment_items 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS display_order SERIAL;
