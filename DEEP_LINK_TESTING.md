# Deep Link Testing Guide

## Testing the `sudokufaceoff://` URL Scheme

The deep linking feature has been implemented. Follow these steps to test it:

## Prerequisites

1. Start your development environment:
   ```bash
   npx expo start
   ```

2. Open the app in either:
   - iOS Simulator (press `i`)
   - Android Emulator (press `a`)
   - Physical device with Expo Go

## Testing Scenarios

### 1. Test Deep Link on iOS Simulator

While the app is running in the simulator:

```bash
xcrun simctl openurl booted sudokufaceoff://test-game-123
```

**Expected behavior:**
- App opens/focuses
- Navigates to the multiplayer screen
- Switches to "Join" tab
- Pre-fills game name with "test-game-123"
- If you have a saved player name, it should auto-join the game

### 2. Test Deep Link on Android Emulator

While the app is running in the emulator:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "sudokufaceoff://test-game-123" com.sudokufaceoff.sudoku
```

**Expected behavior:** Same as iOS

### 3. Test Share Functionality

1. Create a game as the host
2. In the lobby, you should see:
   - A share button (share icon) in the top right of the header
   - A "Share this link with players" section showing the deep link
3. Click the share button:
   - **On mobile**: Native share sheet opens
   - **On web**: Link is copied to clipboard

### 4. Test End-to-End Flow

1. **Device A (Host):**
   - Create a game (e.g., "cool-game-123")
   - Share the link via the share button
   
2. **Device B (Joiner):**
   - Click the shared link `sudokufaceoff://cool-game-123`
   - App opens and either:
     - Auto-joins if player name is saved
     - Shows join form with game name pre-filled
   - After joining, both players should see each other in the lobby
   
3. **Device A (Host):**
   - Start the game
   - Both players should enter the game screen

## Testing with Expo Go

If using Expo Go during development, you can test deep links using:

```bash
# iOS
npx uri-scheme open sudokufaceoff://test-game-123 --ios

# Android  
npx uri-scheme open sudokufaceoff://test-game-123 --android
```

## Testing on Physical Device

1. Send yourself a text message or email with the link:
   ```
   sudokufaceoff://cool-game-123
   ```
2. Click the link on your device
3. The app should open and handle the deep link

## Troubleshooting

### Link doesn't open the app
- Make sure the app is installed
- On iOS, you may need to rebuild the app after changing the URL scheme
- Check that the scheme is registered in `app.json`

### App crashes when opening link
- Check the logs in your terminal
- Verify the game name format (lowercase letters and hyphens only)

### Auto-join not working
- Check if you have a player name saved (enter it once on the multiplayer screen)
- Player name is stored in AsyncStorage/localStorage
- Clear storage if needed: Device Settings > Apps > Sudoku Face Off > Clear Data

## What Was Implemented

1. **URL Scheme Change**: Changed from `sudoku://` to `sudokufaceoff://` for uniqueness
2. **Deep Link Handler**: Added listener in `_layout.tsx` to handle incoming links
3. **Auto-Join Logic**: Multiplayer screen auto-joins if player name exists
4. **Share Feature**: Host can share lobby link via native share or clipboard
5. **UI Updates**: Share button and link display in lobby for hosts

## Future Enhancements

Consider implementing universal links (HTTPS) for production:
- Better iOS experience (no confirmation dialog)
- Works even if app not installed (fallback to website)
- More reliable across different contexts

Example: `https://sudokufaceoff.app/join/game-name`

