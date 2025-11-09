import * as Linking from 'expo-linking';
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-url-polyfill/auto';
import ErrorBoundary from "../components/ErrorBoundary";
import { GameProvider } from "../context/GameContext";
import { ThemeProvider } from "../context/ThemeContext";

function DeepLinkHandler() {
  const router = useRouter();
  const hasHandledInitialUrl = useRef(false);

  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url && !hasHandledInitialUrl.current) {
        hasHandledInitialUrl.current = true;
        handleDeepLink(url);
      }
    });

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

    // Parse URL - handles sudokufaceoff://game-name
    const { hostname, path } = Linking.parse(url);
    
    // Extract game name from either format
    let gameName = hostname || path?.replace(/^\//, '');
    
    // Only navigate if we have a valid game name
    if (gameName && gameName.trim().length > 0) {
      // Navigate to multiplayer screen with game name as param
      router.push({
        pathname: '/multiplayer',
        params: { joinGame: gameName }
      });
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
