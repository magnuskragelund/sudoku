import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ScreenHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export default function ScreenHeader({ label, title, subtitle }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const Divider = () => (
    <View style={styles.dividerContainer}>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
    </View>
  );

  return (
    <>
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={[styles.backButton, { marginBottom: spacing.xl2 }]}
      >
        <ChevronLeft size={16} color={colors.textPrimary} strokeWidth={1.5} />
        <Text 
          style={[
            styles.backButtonText,
            {
              fontFamily: typography.fontBody,
              fontSize: typography.textSm,
              letterSpacing: typography.textSm * typography.trackingNormal,
              color: colors.textPrimary,
              marginLeft: spacing.xs,
            }
          ]}
        >
          RETURN TO MENU
        </Text>
      </TouchableOpacity>

      {/* Masthead */}
      <View style={[styles.masthead, { marginBottom: spacing.xl3 }]}>
        <Text 
          style={[
            styles.label,
            {
              fontFamily: typography.fontBody,
              fontSize: typography.textXs,
              letterSpacing: typography.textXs * typography.trackingWide,
              color: colors.textLabel,
              marginBottom: spacing.sm,
            }
          ]}
        >
          {label}
        </Text>
        
        <Text 
          style={[
            styles.title,
            {
              fontFamily: typography.fontSerif,
              fontSize: typography.text5xl * 1.5, // 57px (slightly larger for this screen)
              letterSpacing: (typography.text5xl * 1.5) * typography.trackingTight,
              lineHeight: (typography.text5xl * 1.5) * typography.leadingTight,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }
          ]}
        >
          {title}
        </Text>
        
        <Divider />
        
        {subtitle && (
          <Text 
            style={[
              styles.subtitle,
              {
                fontFamily: typography.fontBody,
                fontSize: typography.textSm,
                letterSpacing: typography.textSm * typography.trackingNormal,
                color: colors.textSubtitle,
                marginTop: spacing.md,
              }
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    textTransform: 'uppercase',
  },
  masthead: {
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    textAlign: 'center',
    fontWeight: '400',
  },
  dividerContainer: {
    width: 96,
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
  },
  subtitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
