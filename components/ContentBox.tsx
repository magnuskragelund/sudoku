import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ContentBoxProps {
  children: React.ReactNode;
  style?: any;
}

export default function ContentBox({ children, style }: ContentBoxProps) {
  const { colors } = useTheme();

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          shadowColor: colors.cardShadow,
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
});
