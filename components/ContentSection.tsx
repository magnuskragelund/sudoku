import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

interface ContentSectionProps {
  children: React.ReactNode;
  isDark?: boolean;
  style?: any;
}

export default function ContentSection({ children, isDark, style }: ContentSectionProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 400;

  return (
    <View 
      style={[
        styles.section,
        isDark && styles.darkSection,
        isMobile && styles.sectionMobile,
        isDark && isMobile && styles.darkSectionMobile,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 32,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionMobile: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  darkSection: {
    padding: 32,
  },
  darkSectionMobile: {
    padding: 20,
  },
});
