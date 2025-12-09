import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ParticipantCardProps {
  name: string;
  isReady?: boolean;
  onToggleReady?: () => void;
  isTop?: boolean;
  isMiddle?: boolean;
  isBottom?: boolean;
  isPlaceholder?: boolean;
}

export default function ParticipantCard({ 
  name, 
  isReady, 
  onToggleReady,
  isTop,
  isMiddle,
  isBottom,
  isPlaceholder
}: ParticipantCardProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View 
      style={[
        styles.card,
        isTop && styles.cardTop,
        isMiddle && styles.cardMiddle,
        isBottom && styles.cardBottom,
        {
          borderColor: colors.borderThin,
        }
      ]}
    >
      <Text 
        style={[
          styles.name,
          {
            fontFamily: typography.fontSerif,
            fontSize: typography.textXl,
            color: isPlaceholder ? colors.textSecondary : colors.textPrimary,
            flex: 1,
          }
        ]}
      >
        {name}
      </Text>
      {onToggleReady !== undefined && (
        <TouchableOpacity
          style={[
            styles.readyButton,
            {
              backgroundColor: isReady ? colors.primary : colors.cardBackground,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={onToggleReady}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.readyButtonText,
              {
                fontFamily: typography.fontBody,
                fontSize: typography.textSm,
                letterSpacing: typography.textSm * typography.trackingNormal,
                color: isReady 
                  ? '#FFFFFF'
                  : colors.textSecondary,
              }
            ]}
          >
            READY
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTop: {
    paddingTop: 0,
  },
  cardMiddle: {
    borderTopWidth: 1,
  },
  cardBottom: {
    borderTopWidth: 1,
  },
  name: {
    fontWeight: '400',
  },
  readyButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  readyButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
