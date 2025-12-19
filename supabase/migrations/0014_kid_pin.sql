-- Migration: Add PIN for kid access protection
-- PIN is stored hashed for security

-- Add pin_hash column to kids table
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS pin_hash text;

-- Add failed_pin_attempts for lockout tracking
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS failed_pin_attempts integer DEFAULT 0;

-- Add lockout timestamp for temporary lockout after too many failures
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS pin_lockout_until timestamptz;

-- Note: PIN will be hashed client-side with bcrypt before storing
-- The actual 4-digit PIN is never stored in plain text
