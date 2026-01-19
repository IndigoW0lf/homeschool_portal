-- Fix schema drift for saved_ideas table
-- The user_message column was likely missing from the actual DB table despite being in previous migration files

DO $$ 
BEGIN 
  -- Add user_message if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_ideas' AND column_name = 'user_message') THEN
    ALTER TABLE public.saved_ideas ADD COLUMN user_message TEXT;
  END IF;

  -- Add suggestion_data if it doesn't exist (just in case)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_ideas' AND column_name = 'suggestion_data') THEN
    ALTER TABLE public.saved_ideas ADD COLUMN suggestion_data JSONB;
  END IF;

  -- Ensure source_type exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_ideas' AND column_name = 'source_type') THEN
    ALTER TABLE public.saved_ideas ADD COLUMN source_type TEXT DEFAULT 'luna';
  END IF;
END $$;

-- Force schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
