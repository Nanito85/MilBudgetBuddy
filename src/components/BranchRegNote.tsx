import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';

export function BranchRegNote() {
  const tc = useThemeColors();

  return (
    <View style={styles.card}>
      <ThemedText style={styles.label}>⚠ BRANCH REGULATIONS APPLY</ThemedText>
      <ThemedText style={[styles.body, { color: tc.textSecondary }]}>
        The JTR establishes baseline DoD policy, but each branch of service maintains its own
        regulations that may differ. Army (AR), Navy (MILPERSMAN/OPNAVINST), Marine Corps (MCO),
        Air Force (DAFI), Space Force (DAFSPMAN), and Coast Guard (COMDTINST) may set additional
        requirements or restrictions. Consult your unit S1, finance office, or JAG before making
        decisions based on these estimates.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Brand.warning + '60',
    backgroundColor: Brand.warning + '0C',
    borderRadius: 4,
    padding: Spacing.three,
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Brand.warning,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
});
