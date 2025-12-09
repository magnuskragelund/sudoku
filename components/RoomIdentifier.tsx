import { Share2 } from 'lucide-react-native';
import React from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface RoomIdentifierProps {
  roomCode: string;
}

export default function RoomIdentifier({ roomCode }: RoomIdentifierProps) {
  const { colors, typography } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 400;

  const handleShare = async () => {
    if (!roomCode) return;
    
    const deepLink = `sudokufaceoff://${roomCode}`;
    
    try {
      if (Platform.OS === 'web') {
        // On web, copy to clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(deepLink);
          alert('Link copied to clipboard!');
        }
      } else {
        // On mobile, use native share
        await Share.share({
          message: `Join my Sudoku game! Use this link to join: ${deepLink}`,
          title: 'Join Sudoku Game',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.roomIdContainer,
        isMobile && styles.roomIdContainerMobile
      ]}>
        <View style={[
          styles.roomIdField,
          { backgroundColor: '#252A35' },
          isMobile && styles.roomIdFieldMobile
        ]}>
          <Text 
            style={[
              styles.roomIdText,
              {
                fontFamily: typography.fontBody,
                fontSize: typography.textLg,
                letterSpacing: typography.textLg * typography.trackingNormal,
                color: '#FFFFFF',
              },
              isMobile && {
                fontSize: typography.textBase,
              }
            ]}
          >
            {roomCode.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.shareButton,
            { backgroundColor: '#252A35' },
            isMobile && styles.shareButtonMobile
          ]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={20} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  roomIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomIdContainerMobile: {
    gap: 8,
  },
  roomIdField: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomIdFieldMobile: {
    padding: 16,
  },
  roomIdText: {
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: '400',
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonMobile: {
    width: 44,
    height: 44,
  },
});
