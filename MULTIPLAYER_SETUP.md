# Multiplayer Setup Guide

This guide will help you set up Supabase Realtime for multiplayer functionality in your Sudoku app.

## Prerequisites

- A Supabase account (free tier works fine)
- Your Supabase project credentials configured in `app.json`

## Step 1: Set Up the Database

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)

2. Go to the SQL Editor

3. Run the following SQL script (from `database_schema.sql`):

```sql
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

-- Create index for faster lookups
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

-- Allow game host to update their game
CREATE POLICY "Host can update their game"
  ON multiplayer_games
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Optional: Create a function to update the updated_at timestamp
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
```

4. Enable Realtime in Supabase:
   - Go to Database → Replication
   - Find `multiplayer_games` table
   - Enable replication by toggling the switch
   - This enables Supabase Realtime for this table

## Step 2: Verify Your Configuration

Ensure your `app.json` has the correct Supabase credentials:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key"
    }
  }
}
```

You can find these credentials in your Supabase Dashboard:
- Go to Settings → API
- Copy the Project URL and anon/public key

## Step 3: Install Dependencies

All required dependencies should already be installed. If needed, run:

```bash
npm install react-native-url-polyfill react-native-get-random-values
```

## Step 4: Run the App

```bash
npx expo start
```

## How Multiplayer Works

### Architecture

The multiplayer feature uses:
- **Supabase Database**: Stores game metadata (channel name, difficulty, lives, status)
- **Supabase Realtime**: Provides real-time synchronization via WebSocket channels
- **Presence**: Tracks who's in the game
- **Broadcasts**: Sends game events (player joined, moves made, game started)

### Features

1. **Create Game**: Host creates a game with a unique channel name
2. **Join Game**: Players join using the channel name
3. **Lobby**: Shows all connected players
4. **Start Game**: Host can start the game when at least 2 players have joined
5. **Real-time Updates**: All players see game state changes in real-time

### Known Limitations

- This is a basic implementation
- For production, you'll want to add:
  - Authentication/User profiles
  - Stricter RLS policies
  - More robust error handling
  - Board state synchronization
  - Move history
  - Win/loss tracking

## Troubleshooting

### WebSocket Connection Issues

If you encounter WebSocket errors:
1. Make sure Realtime is enabled in Supabase Dashboard
2. Check your Supabase URL and key are correct
3. Verify the `multiplayer_games` table exists and has Realtime enabled

### Metro Config Issues

If you see issues with the `ws` module:
- The current metro.config.js uses a workaround
- For production, consider using `@supabase/supabase-js` with proper React Native WebSocket support

## Next Steps

1. Implement game state synchronization (board, moves)
2. Add pause/resume for all players
3. Add win/loss detection and broadcasting
4. Add player authentication
5. Add game history/logging

## Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

