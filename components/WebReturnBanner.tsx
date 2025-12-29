import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function WebReturnBanner() {
  const { colors, typography, colorScheme } = useTheme();

  if (Platform.OS !== 'web') {
    return null;
  }

  const handleReturnToWebsite = () => {
    // Open in same tab for web
    if (typeof window !== 'undefined') {
      window.location.href = 'https://sudokufaceoff.com';
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleReturnToWebsite}
      style={[styles.banner, { backgroundColor: colors.primary }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.bannerText, { 
        fontFamily: typography.fontBody, 
        fontSize: typography.textSm, 
        color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF',
        letterSpacing: typography.textSm * typography.trackingNormal,
      }]}>
        ← Return to website
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
