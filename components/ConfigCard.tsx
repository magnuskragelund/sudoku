import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ConfigCardProps {
  label: string;
  value: string;
  subtext?: string;
  isLeft?: boolean;
  isRight?: boolean;
  isLast?: boolean;
}

export default function ConfigCard({ label, value, subtext, isLeft, isRight, isLast }: ConfigCardProps) {
  const { colors, typography, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 400;

  return (
    <View
      style={[
        styles.card,
        isLeft && !isMobile && styles.cardLeft,
        isRight && !isMobile && styles.cardRight,
        isMobile && styles.cardMobile,
        isMobile && !isLast && styles.cardMobileWithMargin,
        isLeft && !isMobile && {
          borderRightColor: colors.borderThin,
          borderRightWidth: 1,
        },
      ]}
    >
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
          styles.value,
          {
            fontFamily: typography.fontSerif,
            fontSize: typography.textXl,
            color: colors.textPrimary,
            marginBottom: 4,
          }
        ]}
      >
        {value}
      </Text>
      {subtext && (
        <Text
          style={[
            styles.subtext,
            {
              fontFamily: typography.fontBody,
              fontSize: typography.textXs,
              letterSpacing: typography.textXs * typography.trackingWide,
              color: colors.textSecondary,
            }
          ]}
        >
          {subtext}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 0,
  },
  cardLeft: {
    paddingRight: 16,
  },
  cardRight: {
    paddingLeft: 16,
  },
  cardMobile: {
    width: '100%',
  },
  cardMobileWithMargin: {
    marginBottom: 16,
  },
  label: {
    textTransform: 'uppercase',
  },
  value: {
    fontWeight: '400',
  },
  subtext: {
    textTransform: 'uppercase',
  },
});
