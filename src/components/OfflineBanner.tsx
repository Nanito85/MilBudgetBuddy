import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useNetwork } from '@/hooks/use-network';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <ThemedText style={styles.text}>NO CONNECTION — OFFLINE MODE</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#5C2A00',
    borderBottomWidth: 1,
    borderBottomColor: '#FF6B00',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#FF9940',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
