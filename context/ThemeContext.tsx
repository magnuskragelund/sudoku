import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface Colors {
  // Backgrounds
  background: string;
  backgroundElevated: string;
  backgroundSecondary: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Borders
  borderThin: string;
  borderThick: string;
  border: string;
  
  // Cell colors
  cellSelected: string;
  cellHighlight: string;
  cellSameValue: string;
  
  // Accents
  primary: string;
  error: string;
  success: string;
  warning: string;
  
  // UI Elements
  buttonBackground: string;
  buttonBackgroundSecondary: string;
  inputBackground: string;
  cardBackground: string;
  
  // Modal
  modalBackground: string;
  overlayTint: 'light' | 'dark';
}

interface ThemeContextType {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  colors: Colors;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@sudoku_theme_preference';

const lightColors: Colors = {
  background: '#F9FAFB',
  backgroundElevated: '#FFFFFF',
  backgroundSecondary: '#F3F4F6',
  
  textPrimary: '#1E2939',
  textSecondary: '#4A5565',
  textTertiary: '#6B7280',
  
  borderThin: '#D1D5DC',
  borderThick: '#6B7280',
  border: '#E5E7EB',
  
  cellSelected: '#BEDBFF',
  cellHighlight: '#F3F4F6',
  cellSameValue: '#BEDBFF',
  
  primary: '#2B7FFF',
  error: '#FB2C36',
  success: '#22C55E',
  warning: '#FF8C00',
  
  buttonBackground: '#F3F4F6',
  buttonBackgroundSecondary: '#F0F5FF',
  inputBackground: '#FFFFFF',
  cardBackground: '#FFFFFF',
  
  modalBackground: '#FFFFFF',
  overlayTint: 'dark',
};

const darkColors: Colors = {
  background: '#1E1E1E',
  backgroundElevated: '#2D2D2D',
  backgroundSecondary: '#2A2A2A',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  borderThin: '#404040',
  borderThick: '#606060',
  border: '#404040',
  
  cellSelected: '#3A4A5A',
  cellHighlight: '#2A2A2A',
  cellSameValue: '#3A4A5A',
  
  primary: '#2B7FFF',
  error: '#FB2C36',
  success: '#22C55E',
  warning: '#FF8C00',
  
  buttonBackground: '#3A3A3A',
  buttonBackgroundSecondary: '#2A3A4A',
  inputBackground: '#2D2D2D',
  cardBackground: '#2D2D2D',
  
  modalBackground: '#2D2D2D',
  overlayTint: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine actual color scheme to use
  const colorScheme: ColorScheme = 
    theme === 'system' 
      ? (systemColorScheme || 'light')
      : theme;

  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  // Don't render until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

