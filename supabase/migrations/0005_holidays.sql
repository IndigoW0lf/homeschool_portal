-- Holiday/Off Days Management
-- Allows parents to schedule holidays and off days

CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📅',
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means single day, otherwise it's a range
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read holidays
CREATE POLICY "Anyone can view holidays" ON holidays
  FOR SELECT USING (true);

-- Allow authenticated users to manage holidays  
CREATE POLICY "Authenticated users can manage holidays" ON holidays
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed some default holidays
INSERT INTO holidays (name, emoji, start_date, end_date) VALUES
  ('Winter Break', '🎄', '2025-12-20', '2026-01-05'),
  ('Christmas Day', '🎁', '2025-12-25', NULL),
  ('New Year''s Eve', '🎊', '2025-12-31', NULL),
  ('New Year''s Day', '🎊', '2026-01-01', NULL),
  ('Mom''s 41st Birthday', '🎁', '2026-01-24', NULL),
  ('Atlas''s 10th Birthday', '🎁', '2026-01-29', NULL),
  ('Martin Luther King Jr. Day', '✊', '2026-01-20', NULL),
  ('Spring Break', '🌸', '2026-03-16', '2026-03-20'),
  ('Memorial Day', '🇺🇸', '2026-05-25', NULL),
  ('Stella''s 13th Birthday', '🎁', '2026-06-06', NULL),
  ('Summer Break', '☀️', '2026-06-01', '2026-08-15')
ON CONFLICT DO NOTHING;
