-- Migration to add player count tracking and limits for multiplayer games

-- Add player_count column to track the number of players in a game
ALTER TABLE public.multiplayer_games
  ADD COLUMN IF NOT EXISTS player_count INTEGER DEFAULT 1 CHECK (player_count >= 1 AND player_count <= 10);

-- Set default value for existing rows (assuming 1 player for waiting games)
UPDATE public.multiplayer_games
SET player_count = 1
WHERE player_count IS NULL;

-- Make player_count NOT NULL after setting defaults
ALTER TABLE public.multiplayer_games
  ALTER COLUMN player_count SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.multiplayer_games.player_count IS 'Number of players currently in the game (max 10)';


