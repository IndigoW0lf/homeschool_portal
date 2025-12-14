-- Migration: Update Holiday Icons to Phosphor IDs
-- Changes old emoji format to new icon IDs for icon picker compatibility

-- Map old emojis to new Phosphor icon IDs:
-- 🎄 -> tree
-- 🎁 -> gift
-- ☀️ -> sun
-- ❄️ -> snowflake
-- ❤️ -> heart
-- 🎈 -> balloon
-- 🍰 -> cake
-- 📅 -> star (default fallback)

BEGIN;

-- Update existing holidays to use new icon IDs
UPDATE holidays SET emoji = 'tree' WHERE emoji = '🎄';
UPDATE holidays SET emoji = 'gift' WHERE emoji = '🎁';
UPDATE holidays SET emoji = 'sun' WHERE emoji = '☀️';
UPDATE holidays SET emoji = 'snowflake' WHERE emoji = '❄️';
UPDATE holidays SET emoji = 'heart' WHERE emoji = '❤️';
UPDATE holidays SET emoji = 'balloon' WHERE emoji = '🎈';
UPDATE holidays SET emoji = 'cake' WHERE emoji = '🍰';
UPDATE holidays SET emoji = 'confetti' WHERE emoji = '🎊';
UPDATE holidays SET emoji = 'sparkle' WHERE emoji = '✨';
UPDATE holidays SET emoji = 'flower' WHERE emoji = '🌸';
UPDATE holidays SET emoji = 'moon' WHERE emoji = '🌙';
UPDATE holidays SET emoji = 'airplane' WHERE emoji = '✈️';
UPDATE holidays SET emoji = 'coffee' WHERE emoji = '☕';

-- Any remaining old-style emojis get a default star icon
UPDATE holidays SET emoji = 'star' WHERE emoji NOT IN (
  'sun', 'snowflake', 'tree', 'gift', 'heart', 'star', 'sparkle', 'confetti',
  'umbrella', 'flower', 'moon', 'campfire', 'airplane', 'house', 'balloon',
  'cake', 'coffee', 'book', 'music', 'game', 'bed', 'alarm'
);

COMMIT;

-- Verify the changes
SELECT id, name, emoji, start_date FROM holidays ORDER BY start_date;
