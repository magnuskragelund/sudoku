-- Update game_analytics_daily view to include platform distribution
-- Adds columns for web, ios, and android game starts per day

-- Drop the existing view
DROP VIEW IF EXISTS game_analytics_daily;

-- Recreate the view with platform distribution
CREATE VIEW game_analytics_daily
WITH (security_invoker = true) AS
SELECT 
  DATE(created_at) as date,
  -- Game type breakdown
  COUNT(*) FILTER (WHERE game_type = 'single_player') as single_player_count,
  COUNT(*) FILTER (WHERE game_type = 'multiplayer') as multiplayer_count,
  -- Platform distribution
  COUNT(*) FILTER (WHERE platform = 'web') as web_count,
  COUNT(*) FILTER (WHERE platform = 'ios') as ios_count,
  COUNT(*) FILTER (WHERE platform = 'android') as android_count,
  -- Total count
  COUNT(*) as total_count
FROM game_analytics
WHERE event_type = 'start'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Grant select on the view to authenticated users
GRANT SELECT ON game_analytics_daily TO authenticated;

-- Note: This view respects RLS policies on the game_analytics table
-- Only authenticated users who pass the RLS policy can see the data
