import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

// Newspaper Design System Typography
interface Typography {
  // Font Families
  fontSerif: string; // Playfair Display
  fontBody: string;  // EB Garamond
  
  // Size Scale
  text8xl: number;  // 96px - Main title
  text5xl: number;  // 48px - Feature headings
  text3xl: number;  // 30px - Card headings
  text2xl: number;  // 24px - Section headings
  textXl: number;   // 20px
  textLg: number;   // 18px - Body large
  textBase: number; // 16px - Body
  textSm: number;   // 14px - Labels
  textXs: number;   // 12px - Small labels
  
  // Letter Spacing (tracking)
  trackingWide: number;      // 0.3em - EST. 2025
  trackingNormal: number;    // 0.2em - Labels
  trackingMedium: number;    // 0.15em - Medium tracking
  trackingTight: number;     // -0.025em - Large titles
  
  // Line Heights
  leadingTight: number;
  leadingNormal: number;
  leadingRelaxed: number;
  
  // Font Weights
  weightLight: string;
  weightRegular: string;
  weightMedium: string;
  weightSemiBold: string;
  weightBold: string;
}

interface Spacing {
  xs: number;    // 4
  sm: number;    // 8
  md: number;    // 12
  lg: number;    // 16
  xl: number;    // 24
  xl2: number;   // 32
  xl3: number;   // 48
  xl4: number;   // 64
}

interface Colors {
  // Backgrounds
  background: string;           // Page background
  backgroundElevated: string;   // Cards, elevated surfaces
  backgroundSecondary: string;  // Secondary areas
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  
  // Newspaper Grays (from Figma)
  grayLight: string;    // #99a1af - Light labels
  grayMedium: string;   // #6a7282 - Subtitles
  grayDark: string;     // #4a5565 - Body text
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textLabel: string;        // For uppercase labels
  textSubtitle: string;     // For subtitles
  
  // Borders
  borderThin: string;
  borderThick: string;
  border: string;
  divider: string;          // Thin decorative lines
  
  // Cell colors
  cellSelected: string;
  cellHighlight: string;
  cellSameValue: string;
  cellInitial: string;      // For initial numbers
  cellCorrect: string;      // For correctly filled
  
  // Accents
  primary: string;
  error: string;
  success: string;
  warning: string;
  
  // UI Elements
  buttonBackground: string;
  buttonBackgroundSecondary: string;
  buttonBackgroundDisabled: string;  // For disabled buttons
  buttonBackgroundDark: string;     // For premium dark buttons
  buttonBackgroundDarkFrom: string; // Gradient start
  buttonBackgroundDarkTo: string;   // Gradient end
  inputBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  
  // Modal
  modalBackground: string;
  overlayTint: 'light' | 'dark';
}

interface ThemeContextType {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@sudoku_theme_preference';

// Typography System - Newspaper Style
const typography: Typography = {
  // Font Families
  fontSerif: 'PlayfairDisplay-Regular',
  fontBody: 'EBGaramond-Regular',
  
  // Size Scale (headers reduced by 20%)
  text8xl: 77,
  text5xl: 38,
  text3xl: 24,
  text2xl: 19,
  textXl: 16,
  textLg: 18,
  textBase: 16,
  textSm: 14,
  textXs: 12,
  
  // Letter Spacing (tracking)
  trackingWide: 0.3,      // 0.3em
  trackingNormal: 0.2,    // 0.2em
  trackingMedium: 0.15,   // 0.15em
  trackingTight: -0.025,  // -0.025em
  
  // Line Heights
  leadingTight: 1.1,
  leadingNormal: 1.5,
  leadingRelaxed: 1.625,
  
  // Font Weights
  weightLight: '300',
  weightRegular: '400',
  weightMedium: '500',
  weightSemiBold: '600',
  weightBold: '700',
};

// Spacing System
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xl2: 32,
  xl3: 48,
  xl4: 64,
};

// Base color definitions for light mode
const lightBaseColors = {
  primary: '#2D3748', // Dark gray instead of pure black for more subtle appearance
  primaryDark: '#1A202C', // Darker variant for gradients
  error: '#FB2C36',
  success: '#22C55E',
  warning: '#FF8C00',
};

const lightColors: Colors = {
  // Backgrounds
  background: '#F9FAFB',
  backgroundElevated: '#FFFFFF',
  backgroundSecondary: '#F3F4F6',
  backgroundGradientFrom: '#F9FAFB',
  backgroundGradientTo: '#FFFFFF',
  
  // Newspaper Grays
  grayLight: '#99a1af',
  grayMedium: '#6a7282',
  grayDark: '#4a5565',
  
  // Text
  textPrimary: '#000000',
  textSecondary: '#4a5565',
  textTertiary: '#6B7280',
  textLabel: '#99a1af',
  textSubtitle: '#6a7282',
  
  // Borders
  borderThin: '#E5E7EB',
  borderThick: '#6B7280',
  border: '#D1D5DC',
  divider: '#000000',
  
  // Cell colors
  cellSelected: '#BEDBFF',
  cellHighlight: '#F0F2F5',
  cellSameValue: '#BEDBFF',
  cellInitial: '#E0E7F1',
  cellCorrect: '#E8F5E9',
  
  // Accents (derived from base colors)
  primary: lightBaseColors.primary,
  error: lightBaseColors.error,
  success: lightBaseColors.success,
  warning: lightBaseColors.warning,
  
  // UI Elements
    buttonBackground: '#F9FAFB',
    buttonBackgroundSecondary: '#F3F4F6',
    buttonBackgroundDisabled: '#F0F0F0',
  buttonBackgroundDark: lightBaseColors.primary, // Same as primary
  buttonBackgroundDarkFrom: lightBaseColors.primary, // Same as primary
  buttonBackgroundDarkTo: lightBaseColors.primaryDark, // Darker variant for gradient
  inputBackground: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E7EB',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Modal
  modalBackground: '#FFFFFF',
  overlayTint: 'dark',
};

// Base color definitions for dark mode
const darkBaseColors = {
  primary: '#C4C9D1', // Light gray instead of pure white for more subtle appearance
  primaryDark: '#9CA3AF', // Darker variant for gradients
  error: '#FB2C36',
  success: '#22C55E',
  warning: '#FF8C00',
};

const darkColors: Colors = {
  // Backgrounds
  background: '#0A0A0A',
  backgroundElevated: '#1A1A1A',
  backgroundSecondary: '#2A2A2A',
  backgroundGradientFrom: '#0A0A0A',
  backgroundGradientTo: '#1A1A1A',
  
  // Newspaper Grays (adjusted for dark mode)
  grayLight: '#808896',
  grayMedium: '#9CA3AF',
  grayDark: '#C4C9D1',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#C4C9D1',
  textTertiary: '#9CA3AF',
  textLabel: '#808896',
  textSubtitle: '#9CA3AF',
  
  // Borders
  borderThin: '#2A2A2A',
  borderThick: '#404040',
  border: '#404040',
  divider: '#404040',
  
  // Cell colors
  cellSelected: '#2A3A4A',
  cellHighlight: '#252525',
  cellSameValue: '#2A3A4A',
  cellInitial: '#2D3748',
  cellCorrect: '#1F4529',
  
  // Accents (derived from base colors)
  primary: darkBaseColors.primary,
  error: darkBaseColors.error,
  success: darkBaseColors.success,
  warning: darkBaseColors.warning,
  
  // UI Elements
    buttonBackground: '#2A2A2A',
    buttonBackgroundSecondary: '#3A3A3A',
    buttonBackgroundDisabled: '#222222',
  buttonBackgroundDark: darkBaseColors.primary, // Same as primary
  buttonBackgroundDarkFrom: darkBaseColors.primary, // Same as primary
  buttonBackgroundDarkTo: darkBaseColors.primaryDark, // Darker variant for gradient
  inputBackground: '#1A1A1A',
  cardBackground: '#1A1A1A',
  cardBorder: '#2A2A2A',
  cardShadow: 'rgba(255, 255, 255, 0.05)',
  
  // Modal
  modalBackground: '#1A1A1A',
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
        const savedTheme = await storage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        logger.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setTheme = async (newTheme: ThemeMode) => {
    try {
      await storage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      logger.error('Failed to save theme preference:', error);
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
    <ThemeContext.Provider value={{ theme, colorScheme, colors, typography, spacing, setTheme }}>
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

