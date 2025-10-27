import { Stack } from "expo-router";
import { Platform } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GameProvider } from "../context/GameContext";

// Only import these polyfills on native platforms
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
  require('react-native-url-polyfill/auto');
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </GameProvider>
    </SafeAreaProvider>
  );
}
