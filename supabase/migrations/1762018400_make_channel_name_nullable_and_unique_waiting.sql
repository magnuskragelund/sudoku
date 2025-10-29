-- migrate:up
-- Allow freeing channel names after game start by making channel_name nullable
-- and enforcing uniqueness only while status = 'waiting'.

-- Drop the existing UNIQUE constraint on channel_name (auto-named by Postgres)
ALTER TABLE public.multiplayer_games
  DROP CONSTRAINT IF EXISTS multiplayer_games_channel_name_key;

-- Make channel_name nullable
ALTER TABLE public.multiplayer_games
  ALTER COLUMN channel_name DROP NOT NULL;

-- Ensure there is no conflicting unique index from earlier
DROP INDEX IF EXISTS public.idx_multiplayer_games_channel;

-- Recreate a plain index for lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_channel
  ON public.multiplayer_games(channel_name);

-- Create a partial unique index that applies only to waiting games
CREATE UNIQUE INDEX IF NOT EXISTS ux_multiplayer_games_channel_name_waiting
  ON public.multiplayer_games(channel_name)
  WHERE status = 'waiting';

-- migrate:down
-- Revert to NOT NULL + UNIQUE on channel_name; drop partial unique index.

-- To avoid NOT NULL violations, fill null channel names with their id
UPDATE public.multiplayer_games
SET channel_name = COALESCE(channel_name, id);

-- Drop partial unique index
DROP INDEX IF EXISTS public.ux_multiplayer_games_channel_name_waiting;

-- Ensure channel_name is NOT NULL again
ALTER TABLE public.multiplayer_games
  ALTER COLUMN channel_name SET NOT NULL;

-- Restore column-level unique constraint
ALTER TABLE public.multiplayer_games
  ADD CONSTRAINT multiplayer_games_channel_name_key UNIQUE (channel_name);


