# Quick Start: Multiplayer Setup 🎮

Get multiplayer working in your Sudoku app with Supabase Realtime in just 3 steps!

## Step 1: Install Supabase CLI

```bash
# macOS
brew tap supabase/tap
brew install supabase

# Or using npm
npm install -g supabase
```

## Step 2: Link Your Project

Get your project reference ID from your Supabase dashboard (Settings → General → Reference ID)

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

## Step 3: Run the Migration

```bash
supabase db push
```

That's it! ✅

## Enable Realtime (Required)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Database** → **Replication**
3. Find the `multiplayer_games` table
4. Toggle the switch to enable replication

## Verify Installation

Check that the table was created:

```bash
supabase db diff
```

You should see no pending migrations.

## Test It Out

```bash
npx expo start
```

Now you can create and join multiplayer games! 🎉

## Troubleshooting

### Migration fails with "permission denied"

Make sure you've linked to the correct project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Can't find Realtime settings

- Make sure you're on the correct project
- Realtime is available on all Supabase plans (including free tier)

### Still having issues?

Check the full setup guide in `MULTIPLAYER_SETUP.md`

