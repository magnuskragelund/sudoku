-- Add platform column to game_analytics table
-- Platform can be 'web', 'ios', or 'android'

-- Add the platform column with a default value of 'ios' for new rows
ALTER TABLE game_analytics
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('web', 'ios', 'android')) DEFAULT 'ios';

-- Backfill historical data with 'ios'
UPDATE game_analytics
SET platform = 'ios'
WHERE platform IS NULL;

-- Make the column NOT NULL after backfilling
ALTER TABLE game_analytics
ALTER COLUMN platform SET NOT NULL;

-- Keep the default 'ios' as a safety net for any edge cases where platform might not be detected

-- Create an index for platform queries
CREATE INDEX IF NOT EXISTS idx_game_analytics_platform ON game_analytics(platform);
