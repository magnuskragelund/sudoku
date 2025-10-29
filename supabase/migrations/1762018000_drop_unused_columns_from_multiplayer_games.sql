-- migrate:up
-- Drop unused columns from multiplayer_games
ALTER TABLE public.multiplayer_games
  DROP COLUMN IF EXISTS board_state,
  DROP COLUMN IF EXISTS solution_state;

-- migrate:down
-- Recreate columns if we need to rollback
ALTER TABLE public.multiplayer_games
  ADD COLUMN IF NOT EXISTS board_state jsonb,
  ADD COLUMN IF NOT EXISTS solution_state jsonb;


