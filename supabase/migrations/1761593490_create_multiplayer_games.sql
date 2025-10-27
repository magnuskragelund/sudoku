-- Create the multiplayer_games table
CREATE TABLE IF NOT EXISTS multiplayer_games (
  id TEXT PRIMARY KEY,
  channel_name TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'master')),
  lives INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  board_state JSONB,
  solution_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_channel ON multiplayer_games(channel_name);
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_status ON multiplayer_games(status);

-- Enable RLS (Row Level Security)
ALTER TABLE multiplayer_games ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read public game information
CREATE POLICY "Anyone can view public games"
  ON multiplayer_games
  FOR SELECT
  USING (true);

-- Allow anyone to create games
CREATE POLICY "Anyone can create games"
  ON multiplayer_games
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update games
CREATE POLICY "Anyone can update games"
  ON multiplayer_games
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete games
CREATE POLICY "Anyone can delete games"
  ON multiplayer_games
  FOR DELETE
  USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_multiplayer_games_updated_at
  BEFORE UPDATE ON multiplayer_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_games;

