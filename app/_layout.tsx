import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-url-polyfill/auto';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
  EBGaramond_800ExtraBold,
} from '@expo-google-fonts/eb-garamond';
import ErrorBoundary from "../components/ErrorBoundary";
import { GameProvider } from "../context/GameContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

function StatusBarHandler() {
  const { colorScheme } = useTheme();
  return (
    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Medium': PlayfairDisplay_500Medium,
    'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'EBGaramond-Regular': EBGaramond_400Regular,
    'EBGaramond-Medium': EBGaramond_500Medium,
    'EBGaramond-SemiBold': EBGaramond_600SemiBold,
    'EBGaramond-Bold': EBGaramond_700Bold,
    'EBGaramond-ExtraBold': EBGaramond_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBarHandler />
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
