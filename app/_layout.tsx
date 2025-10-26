import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
