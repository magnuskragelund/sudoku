import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal as RNModal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
          <View style={styles.modal}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            
            {children && <View style={styles.content}>{children}</View>}
            
            <View style={styles.buttons}>
              {primaryButton && (
                <TouchableOpacity
                  style={[styles.primaryButton, primaryButton.disabled && styles.buttonDisabled]}
                  onPress={primaryButton.onPress}
                  disabled={primaryButton.disabled}
                >
                  <Text style={styles.primaryButtonText}>{primaryButton.text}</Text>
                </TouchableOpacity>
              )}
              {secondaryButton && (
                <TouchableOpacity
                  style={[styles.secondaryButton, secondaryButton.disabled && styles.buttonDisabled]}
                  onPress={secondaryButton.onPress}
                  disabled={secondaryButton.disabled}
                >
                  <Text style={styles.secondaryButtonText}>{secondaryButton.text}</Text>
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
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 24,
    minWidth: 280,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2939',
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5565',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  content: {
    width: '100%',
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2B7FFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#1E2939',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

