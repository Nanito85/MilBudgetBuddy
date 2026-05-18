import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelAlt]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Brand.primary,
  },
  secondary: {
    backgroundColor: Brand.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelPrimary: { color: '#FFFFFF' },
  labelAlt: { color: Brand.primary },
});
