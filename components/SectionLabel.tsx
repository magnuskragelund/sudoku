import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SectionLabelProps {
  children: React.ReactNode;
  style?: any;
}

export default function SectionLabel({ children, style }: SectionLabelProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Text 
      style={[
        styles.label,
        {
          fontFamily: typography.fontBody,
          fontSize: typography.textXs,
          letterSpacing: typography.textXs * typography.trackingWide,
          color: colors.textLabel,
          marginBottom: spacing.lg,
        },
        style
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    textTransform: 'uppercase',
  },
});
