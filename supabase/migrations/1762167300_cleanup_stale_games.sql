-- Migration to add automated cleanup for stale multiplayer games
-- Cleans up games in 'waiting' status older than 1 hour to free up channel names

-- Create function to cleanup stale games
CREATE OR REPLACE FUNCTION cleanup_stale_multiplayer_games()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete games in 'waiting' status that are older than 1 hour
  DELETE FROM public.multiplayer_games
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '1 hour';
  
  -- Optionally, also clean up very old finished games (older than 7 days)
  -- to keep database size manageable
  DELETE FROM public.multiplayer_games
  WHERE status = 'finished'
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION cleanup_stale_multiplayer_games() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_multiplayer_games() TO anon;

-- Note: To set up automatic cleanup via pg_cron, run this on your Supabase dashboard SQL editor:
-- 
-- -- Enable pg_cron extension (only needs to be done once)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- -- Schedule the cleanup function to run every hour
-- SELECT cron.schedule(
--   'cleanup-stale-games',
--   '0 * * * *', -- Every hour at minute 0
--   $$SELECT cleanup_stale_multiplayer_games();$$
-- );
--
-- Note: pg_cron may not be available on all Supabase plans.
-- For Supabase projects without pg_cron, you can:
-- 1. Use Supabase Edge Functions with a cron trigger
-- 2. Call cleanup_stale_multiplayer_games() periodically from your application
-- 3. Use an external cron service to call a Supabase Edge Function


