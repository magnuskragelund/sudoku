import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-url-polyfill/auto';
import ErrorBoundary from "../components/ErrorBoundary";
import { GameProvider } from "../context/GameContext";
import { ThemeProvider } from "../context/ThemeContext";

function DeepLinkHandler() {
  const router = useRouter();
  const segments = useSegments();
  const hasHandledInitialUrl = useRef(false);

  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url && !hasHandledInitialUrl.current) {
        hasHandledInitialUrl.current = true;
        handleDeepLink(url);
      }
    };
    
    handleInitialUrl();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    // Only handle sudokufaceoff:// deep links
    if (!url.startsWith('sudokufaceoff://')) {
      return;
    }

    // Remove the scheme to get the game name
    const gameName = url.replace('sudokufaceoff://', '').replace(/^\/+/, '').trim();
    
    // Only navigate if we have a valid game name
    if (gameName && gameName.length > 0) {
      // Use replace to avoid creating back stack issues
      setTimeout(() => {
        router.replace({
          pathname: '/multiplayer',
          params: { joinGame: gameName }
        });
      }, 100);
    }
  };

  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <GameProvider>
            <DeepLinkHandler />
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
