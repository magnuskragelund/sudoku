-- Create a view showing games lost due to running out of lives
-- Games with outcome = 'lost' are games where the player ran out of all lives

CREATE VIEW games_lost_all_lives
WITH (security_invoker = true) AS
SELECT 
  -- Overall count
  COUNT(*) as total_games_lost,
  
  -- Breakdown by game type
  COUNT(*) FILTER (WHERE game_type = 'single_player') as single_player_lost,
  COUNT(*) FILTER (WHERE game_type = 'multiplayer') as multiplayer_lost,
  
  -- Breakdown by difficulty
  COUNT(*) FILTER (WHERE difficulty = 'easy') as easy_lost,
  COUNT(*) FILTER (WHERE difficulty = 'medium') as medium_lost,
  COUNT(*) FILTER (WHERE difficulty = 'hard') as hard_lost,
  COUNT(*) FILTER (WHERE difficulty = 'master') as master_lost,
  
  -- Breakdown by initial lives
  COUNT(*) FILTER (WHERE lives = 1) as lost_with_1_life,
  COUNT(*) FILTER (WHERE lives = 3) as lost_with_3_lives,
  COUNT(*) FILTER (WHERE lives = 5) as lost_with_5_lives,
  COUNT(*) FILTER (WHERE lives > 5) as lost_with_more_than_5_lives,
  
  -- Average statistics
  ROUND(AVG(completion_time), 2) as avg_time_before_losing_seconds,
  ROUND(AVG(mistakes_made), 2) as avg_mistakes_made,
  ROUND(AVG(lives), 2) as avg_initial_lives,
  
  -- Percentage of all completed games that were lost
  ROUND(
    100.0 * COUNT(*) / NULLIF(
      (SELECT COUNT(*) FROM game_analytics WHERE event_type = 'complete'),
      0
    ),
    2
  ) as percentage_of_completed_games
FROM game_analytics
WHERE event_type = 'complete' 
  AND outcome = 'lost';

-- Create a detailed view showing individual lost games
CREATE VIEW games_lost_all_lives_detailed
WITH (security_invoker = true) AS
SELECT 
  id,
  session_id,
  game_type,
  difficulty,
  lives as initial_lives,
  completion_time as time_before_losing_seconds,
  mistakes_made,
  hint_used,
  player_count,
  is_host,
  created_at
FROM game_analytics
WHERE event_type = 'complete' 
  AND outcome = 'lost'
ORDER BY created_at DESC;

-- Grant select on the views to authenticated users
GRANT SELECT ON games_lost_all_lives TO authenticated;
GRANT SELECT ON games_lost_all_lives_detailed TO authenticated;

-- Note: These views respect RLS policies on the game_analytics table
-- Only authenticated users who pass the RLS policy can see the data
