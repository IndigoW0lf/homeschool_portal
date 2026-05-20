-- Store the timestamp when a parent gave COPPA parental consent at signup
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coppa_consent_at timestamptz;
