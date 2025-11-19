-- Create a simple view tracking daily game session starts
-- Counts the number of single_player and multiplayer sessions started each day
-- One row per day with separate columns for each game type

CREATE VIEW game_analytics_daily
WITH (security_invoker = true) AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE game_type = 'single_player') as single_player_count,
  COUNT(*) FILTER (WHERE game_type = 'multiplayer') as multiplayer_count
FROM game_analytics
WHERE event_type = 'start'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Grant select on the view to authenticated users
GRANT SELECT ON game_analytics_daily TO authenticated;

-- Note: This view respects RLS policies on the game_analytics table
-- Only authenticated users who pass the RLS policy can see the data

