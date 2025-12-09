import React from 'react';
import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface StatusRowProps {
  icon: LucideIcon;
  text: string;
  style?: any;
}

export default function StatusRow({ icon: Icon, text, style }: StatusRowProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.row, style]}>
      <Icon size={16} color={colors.textLabel} strokeWidth={1.5} />
      <Text 
        style={[
          styles.text,
          {
            fontFamily: typography.fontBody,
            fontSize: typography.textXs,
            letterSpacing: typography.textXs * typography.trackingWide,
            color: colors.textSecondary,
            marginLeft: spacing.sm,
          }
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  text: {
    textTransform: 'uppercase',
  },
});
