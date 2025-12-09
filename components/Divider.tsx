import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface DividerProps {
  style?: any;
}

export default function Divider({ style }: DividerProps) {
  const { colors } = useTheme();

  return (
    <View 
      style={[
        styles.divider,
        { backgroundColor: colors.borderThin },
        style
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
