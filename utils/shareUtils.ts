import { Platform } from 'react-native';

/**
 * Get app store links for Sudoku Face Off
 */
const APP_STORE_LINKS = {
  ios: 'https://apps.apple.com/app/sudoku-face-off/id6754818070',
  android: 'https://play.google.com/store/apps/details?id=com.sudokufaceoff.sudoku',
  web: 'https://sudokufaceoff.com', // Update with actual web URL if available
};

/**
 * Generate a share message for multiplayer room invitations
 * Includes instructions for users who don't have the app installed
 */
export function generateRoomShareMessage(roomCode: string): string {
  const deepLink = `sudokufaceoff://${roomCode}`;
  const appName = 'Sudoku Face Off';
  
  let message = `🎮 Join my ${appName} game!\n\n`;
  message += `Room Code: ${roomCode.toUpperCase()}\n\n`;
  message += `📱 To join:\n`;
  message += `• If you have the app: Tap this link → ${deepLink}\n`;
  message += `• If you don't have the app:\n`;
  
  if (Platform.OS === 'ios') {
    message += `  → Download on iOS: ${APP_STORE_LINKS.ios}\n`;
    message += `  → Download on Android: ${APP_STORE_LINKS.android}\n`;
  } else if (Platform.OS === 'android') {
    message += `  → Download on Android: ${APP_STORE_LINKS.android}\n`;
    message += `  → Download on iOS: ${APP_STORE_LINKS.ios}\n`;
  } else {
    message += `  → Download on iOS: ${APP_STORE_LINKS.ios}\n`;
    message += `  → Download on Android: ${APP_STORE_LINKS.android}\n`;
  }
  
  message += `\nThen tap this link to join: ${deepLink}`;
  
  return message;
}

/**
 * Generate a share message with just the room code (simpler version)
 */
export function generateSimpleRoomShareMessage(roomCode: string): string {
  const deepLink = `sudokufaceoff://${roomCode}`;
  const appName = 'Sudoku Face Off';
  
  let message = `Join my ${appName} game!\n\n`;
  message += `Room Code: ${roomCode.toUpperCase()}\n\n`;
  message += `Tap this link to join: ${deepLink}\n\n`;
  message += `Don't have the app? Download it:\n`;
  
  if (Platform.OS === 'ios') {
    message += `iOS: ${APP_STORE_LINKS.ios}\n`;
    message += `Android: ${APP_STORE_LINKS.android}`;
  } else if (Platform.OS === 'android') {
    message += `Android: ${APP_STORE_LINKS.android}\n`;
    message += `iOS: ${APP_STORE_LINKS.ios}`;
  } else {
    message += `iOS: ${APP_STORE_LINKS.ios}\n`;
    message += `Android: ${APP_STORE_LINKS.android}`;
  }
  
  return message;
}
