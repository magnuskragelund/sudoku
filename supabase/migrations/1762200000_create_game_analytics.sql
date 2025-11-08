-- Create the game_analytics table
CREATE TABLE IF NOT EXISTS game_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('single_player', 'multiplayer')),
  event_type TEXT NOT NULL CHECK (event_type IN ('start', 'complete', 'abandon')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'master')),
  lives INTEGER NOT NULL,
  completion_time INTEGER, -- seconds, null for start/abandon events
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'abandoned')),
  hint_used BOOLEAN DEFAULT false,
  mistakes_made INTEGER DEFAULT 0,
  -- Multiplayer specific fields
  player_count INTEGER, -- null for single-player
  is_host BOOLEAN, -- null for single-player
  -- Technical metadata
  app_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_game_analytics_session_id ON game_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_game_analytics_event_type ON game_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_game_analytics_game_type ON game_analytics(game_type);
CREATE INDEX IF NOT EXISTS idx_game_analytics_difficulty ON game_analytics(difficulty);
CREATE INDEX IF NOT EXISTS idx_game_analytics_created_at ON game_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_game_analytics_outcome ON game_analytics(outcome);

-- Enable RLS (Row Level Security)
ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert analytics (anonymous tracking)
CREATE POLICY "Anyone can insert analytics"
  ON game_analytics
  FOR INSERT
  WITH CHECK (true);

-- Only allow reading analytics for authenticated users (for admin purposes)
CREATE POLICY "Only authenticated users can read analytics"
  ON game_analytics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create a view for easier analytics queries
CREATE OR REPLACE VIEW game_analytics_summary AS
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
GRANT SELECT ON game_analytics_summary TO authenticated;

