import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal as RNModal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  primaryButton?: {
    text: string;
    onPress: () => void;
    disabled?: boolean;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
    disabled?: boolean;
  };
  onClose?: () => void;
}

export default function Modal({
  visible,
  title,
  subtitle,
  children,
  primaryButton,
  secondaryButton,
  onClose,
}: ModalProps) {
  const { colors, typography, spacing, colorScheme } = useTheme();
  
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint={colors.overlayTint} style={styles.blurBackground}>
          <View style={[styles.modal, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder, shadowColor: colors.cardShadow }]}>
            {title && (
              <Text 
                style={[
                  styles.title, 
                  { 
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text3xl,
                    color: colors.textPrimary,
                    marginBottom: spacing.sm,
                  }
                ]}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text 
                style={[
                  styles.subtitle, 
                  { 
                    fontFamily: typography.fontBody,
                    fontSize: typography.textBase,
                    color: colors.textSecondary,
                    marginBottom: spacing.xl,
                  }
                ]}
              >
                {subtitle}
              </Text>
            )}
            
            {children && <View style={[styles.content, { marginBottom: spacing.xl }]}>{children}</View>}
            
            <View style={[styles.buttons, { gap: spacing.sm }]}>
              {primaryButton && (
                <TouchableOpacity
                  style={[
                    styles.primaryButton, 
                    { 
                      backgroundColor: colors.primary,
                      paddingVertical: spacing.lg,
                      paddingHorizontal: spacing.xl,
                    }, 
                    primaryButton.disabled && styles.buttonDisabled
                  ]}
                  onPress={primaryButton.onPress}
                  disabled={primaryButton.disabled}
                >
                  <Text 
                    style={[
                      styles.primaryButtonText,
                      { 
                        fontFamily: typography.fontBody,
                        fontSize: typography.textSm,
                        letterSpacing: typography.textSm * typography.trackingNormal,
                        color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF',
                      }
                    ]}
                  >
                    {primaryButton.text.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
              {secondaryButton && (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton, 
                    { 
                      backgroundColor: colors.buttonBackground,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.xl,
                    }, 
                    secondaryButton.disabled && styles.buttonDisabled
                  ]}
                  onPress={secondaryButton.onPress}
                  disabled={secondaryButton.disabled}
                >
                  <Text 
                    style={[
                      styles.secondaryButtonText, 
                      { 
                        fontFamily: typography.fontBody,
                        fontSize: typography.textSm,
                        letterSpacing: typography.textSm * typography.trackingNormal,
                        color: colors.textSecondary,
                      }
                    ]}
                  >
                    {secondaryButton.text.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 24,
    minWidth: 280,
    width: '90%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
  },
  title: {
    textAlign: 'center',
    fontWeight: '400',
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  content: {
    width: '100%',
  },
  buttons: {
    width: '100%',
  },
  primaryButton: {
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

