import { Stack } from "expo-router";
import 'react-native-get-random-values';
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-url-polyfill/auto';
import ErrorBoundary from "../components/ErrorBoundary";
import { GameProvider } from "../context/GameContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <GameProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </GameProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
