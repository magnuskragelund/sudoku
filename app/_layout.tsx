import { Stack } from "expo-router";
import 'react-native-get-random-values';
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-url-polyfill/auto';
import { GameProvider } from "../context/GameContext";

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
