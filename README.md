# That's Sudoku 🎯

A beautiful, modern Sudoku app with real-time multiplayer support powered by Supabase.

## Features

- 🎮 **Single Player Mode** - Choose your difficulty and number of lives
- 👥 **Real-time Multiplayer** - Play with friends simultaneously
- ⏱️ **Timer & High Scores** - Track your best times
- 📝 **Notes & Hints** - Helper features to guide you
- 🎨 **Clean UI** - Beautiful, modern interface

## Multiplayer Mode

1. **Host a Game**: Create a game with a unique name and share it with friends
2. **Join a Game**: Enter the game name to join an existing game
3. **Synchronized Play**: All players solve the same puzzle together
4. **Shared Controls**: Any player can pause/resume for everyone
5. **Winner**: First to complete wins the game

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure Supabase (required for multiplayer)

   - Create a free Supabase project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key
   - Open `app.json` and add your Supabase credentials:
     ```json
     "extra": {
       "supabaseUrl": "https://your-project.supabase.co",
       "supabaseAnonKey": "your-anon-key"
     }
     ```

3. Set up the database (required for multiplayer)

   - Install Supabase CLI: https://supabase.com/docs/guides/cli
   - Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
   - Run the migration: `supabase db push`
   - Enable Realtime: Go to Dashboard → Database → Replication → Enable for `multiplayer_games`

4. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
