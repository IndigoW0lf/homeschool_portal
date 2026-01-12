-- Kid Login Feature: Add fields for kid-specific authentication
-- Kids can login with first name + last initial + password

-- Add last_name column (for login lookup by initial)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kids' 
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.kids ADD COLUMN last_name TEXT;
  END IF;
END $$;

-- Add password_hash column (bcrypt hashed password for kid login)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kids' 
    AND column_name = 'password_hash'
  ) THEN  
    ALTER TABLE public.kids ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- Add last_login_at column (track kid login activity)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kids' 
    AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.kids ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for faster login lookups
-- Index on lowercase name and first letter of last_name
DROP INDEX IF EXISTS idx_kids_login_lookup;
CREATE INDEX idx_kids_login_lookup ON public.kids (
  LOWER(name), 
  LOWER(SUBSTRING(COALESCE(last_name, ''), 1, 1))
) WHERE password_hash IS NOT NULL;

-- Note: We enforce uniqueness at the application layer rather than DB constraint
-- because we need to check password_hash match, not just existence
-- The app validates: if name+initial exists, password must be unique

COMMENT ON COLUMN public.kids.last_name IS 'Kid last name, used for login with first initial';
COMMENT ON COLUMN public.kids.password_hash IS 'Bcrypt hashed password for kid direct login';
COMMENT ON COLUMN public.kids.last_login_at IS 'Timestamp of last kid login via /student';
