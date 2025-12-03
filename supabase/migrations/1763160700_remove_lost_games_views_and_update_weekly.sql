-- Remove the games_lost_all_lives views
DROP VIEW IF EXISTS games_lost_all_lives;
DROP VIEW IF EXISTS games_lost_all_lives_detailed;

-- Update the weekly view to include games lost count
DROP VIEW IF EXISTS game_analytics_weekly;

CREATE VIEW game_analytics_weekly
WITH (security_invoker = true) AS
WITH weekly_base AS (
  SELECT 
    DATE_TRUNC('week', created_at) as week_start,
    event_type,
    difficulty,
    lives,
    completion_time,
    outcome
  FROM game_analytics
),
weekly_aggregates AS (
  SELECT 
    week_start,
    -- Count started games
    COUNT(*) FILTER (WHERE event_type = 'start') as started_games,
    -- Count completed games
    COUNT(*) FILTER (WHERE event_type = 'complete') as completed_games,
    -- Count games lost (ran out of lives)
    COUNT(*) FILTER (WHERE event_type = 'complete' AND outcome = 'lost') as games_lost,
    -- Average completion time for completed games (in seconds)
    AVG(completion_time) FILTER (WHERE event_type = 'complete' AND completion_time IS NOT NULL) as avg_completion_time_seconds,
    -- Mean number of lives (across all events)
    AVG(lives) as mean_lives
  FROM weekly_base
  GROUP BY week_start
),
weekly_difficulty_counts AS (
  SELECT 
    week_start,
    difficulty,
    COUNT(*) as difficulty_count,
    ROW_NUMBER() OVER (PARTITION BY week_start ORDER BY COUNT(*) DESC, difficulty ASC) as rn
  FROM weekly_base
  GROUP BY week_start, difficulty
),
most_common_difficulties AS (
  SELECT 
    week_start,
    difficulty as most_common_difficulty
  FROM weekly_difficulty_counts
  WHERE rn = 1
)
SELECT 
  wa.week_start,
  wa.started_games,
  wa.completed_games,
  wa.games_lost,
  ROUND(wa.avg_completion_time_seconds, 2) as avg_completion_time_seconds,
  ROUND(wa.mean_lives, 2) as mean_lives,
  mcd.most_common_difficulty
FROM weekly_aggregates wa
LEFT JOIN most_common_difficulties mcd ON wa.week_start = mcd.week_start
ORDER BY wa.week_start DESC;

-- Grant select on the view to authenticated users
GRANT SELECT ON game_analytics_weekly TO authenticated;

-- Note: This view respects RLS policies on the game_analytics table
-- Only authenticated users who pass the RLS policy can see the data
