-- Fix security issue with game_analytics_summary view
-- The view was created with SECURITY DEFINER behavior, which bypasses RLS
-- This migration recreates it to respect RLS policies

-- Drop the existing view
DROP VIEW IF EXISTS game_analytics_summary;

-- Recreate the view with SECURITY INVOKER to ensure it respects RLS
-- This ensures the view executes with the privileges of the querying user
-- and adheres to RLS policies on the underlying table
CREATE VIEW game_analytics_summary
WITH (security_invoker = true) AS
SELECT 
  game_type,
  difficulty,
  event_type,
  outcome,
  COUNT(*) as event_count,
  AVG(completion_time) as avg_completion_time,
  MIN(completion_time) as min_completion_time,
  MAX(completion_time) as max_completion_time,
  AVG(mistakes_made) as avg_mistakes,
  COUNT(*) FILTER (WHERE hint_used = true) as hint_usage_count,
  DATE(created_at) as date
FROM game_analytics
WHERE event_type = 'complete'
GROUP BY game_type, difficulty, event_type, outcome, DATE(created_at);

-- Grant select on the view to authenticated users
-- This ensures only authenticated users can query the view
GRANT SELECT ON game_analytics_summary TO authenticated;

-- Note: The view will now respect RLS policies on the game_analytics table
-- Only authenticated users who pass the RLS policy can see the data

