import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useNetwork } from '@/hooks/use-network';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  if (isOnline) return null;

  // Floats at the top under the status bar. It used to sit in the root
  // layout's normal flow after the navigator, where it could end up behind
  // the tab bar or home indicator instead of being seen.
  return (
    <View style={[styles.banner, { top: insets.top }]} pointerEvents="none" accessibilityRole="alert">
      <ThemedText style={styles.text}>NO CONNECTION — OFFLINE MODE</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#5C2A00',
    borderBottomWidth: 1,
    borderBottomColor: '#FF6B00',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#FF9940',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
