import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface RoomIdentifierProps {
  roomCode: string;
}

export default function RoomIdentifier({ roomCode }: RoomIdentifierProps) {
  const { colors, typography } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 400;

  const handleCopy = async () => {
    const roomId = roomCode.toUpperCase();
    
    try {
      await Clipboard.setStringAsync(roomId);
      if (Platform.OS === 'web') {
        alert('Room ID copied to clipboard!');
      } else {
        Alert.alert('Copied', 'Room ID copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying room ID:', error);
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
            styles.copyButton,
            { backgroundColor: '#252A35' },
            isMobile && styles.copyButtonMobile
          ]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Copy size={20} color="#FFFFFF" strokeWidth={1.5} />
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
  copyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonMobile: {
    width: 44,
    height: 44,
  },
});
