-- Forward-only migration to enforce intended schema
-- NOTE: Supabase CLI executes the entire file; avoid up/down sections here.

-- 1) Drop unused JSONB columns if they still exist
ALTER TABLE public.multiplayer_games
  DROP COLUMN IF EXISTS board_state,
  DROP COLUMN IF EXISTS solution_state;

-- 2) Make channel_name nullable (free up names after start)
ALTER TABLE public.multiplayer_games
  ALTER COLUMN channel_name DROP NOT NULL;

-- 3) Enforce uniqueness only while status = 'waiting'
-- Remove any old unique constraint and conflicting indexes
ALTER TABLE public.multiplayer_games
  DROP CONSTRAINT IF EXISTS multiplayer_games_channel_name_key;

DROP INDEX IF EXISTS public.ux_multiplayer_games_channel_name_waiting;
DROP INDEX IF EXISTS public.idx_multiplayer_games_channel;

-- Recreate plain index for lookups
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_channel
  ON public.multiplayer_games(channel_name);

-- Partial unique index while waiting
CREATE UNIQUE INDEX IF NOT EXISTS ux_multiplayer_games_channel_name_waiting
  ON public.multiplayer_games(channel_name)
  WHERE status = 'waiting';


