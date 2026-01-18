-- Create a view summarizing game starts by hour of day, grouped in 3-hour intervals
-- Groups: 0-2, 3-5, 6-8, 9-11, 12-14, 15-17, 18-20, 21-23

CREATE VIEW game_starts_by_hour_group
WITH (security_invoker = true) AS
SELECT 
  -- Calculate the 3-hour group (0-7, where 0 = 0-2, 1 = 3-5, etc.)
  FLOOR(EXTRACT(HOUR FROM created_at) / 3) as hour_group,
  -- Display the hour range as a readable string
  LPAD((FLOOR(EXTRACT(HOUR FROM created_at) / 3) * 3)::TEXT, 2, '0') || ':00-' ||
  LPAD((FLOOR(EXTRACT(HOUR FROM created_at) / 3) * 3 + 2)::TEXT, 2, '0') || ':59' as hour_range,
  -- Count game starts
  COUNT(*) as game_starts_count,
  -- Breakdown by game type
  COUNT(*) FILTER (WHERE game_type = 'single_player') as single_player_starts,
  COUNT(*) FILTER (WHERE game_type = 'multiplayer') as multiplayer_starts,
  -- Breakdown by platform
  COUNT(*) FILTER (WHERE platform = 'web') as web_starts,
  COUNT(*) FILTER (WHERE platform = 'ios') as ios_starts,
  COUNT(*) FILTER (WHERE platform = 'android') as android_starts
FROM game_analytics
WHERE event_type = 'start'
GROUP BY FLOOR(EXTRACT(HOUR FROM created_at) / 3)
ORDER BY hour_group;

-- Grant select on the view to authenticated users
GRANT SELECT ON game_starts_by_hour_group TO authenticated;

-- Note: This view respects RLS policies on the game_analytics table
-- Only authenticated users who pass the RLS policy can see the data
