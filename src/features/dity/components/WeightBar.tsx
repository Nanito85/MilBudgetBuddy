import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

interface Props {
  authorizedWeight: number;
  actualWeight: number;
  effectiveWeight: number;
  overAllowance: boolean;
}

export function WeightBar({ authorizedWeight, actualWeight, effectiveWeight, overAllowance }: Props) {
  const pct = Math.min(1, authorizedWeight > 0 ? effectiveWeight / authorizedWeight : 0);
  const fillColor = overAllowance ? Brand.danger : pct > 0.9 ? Brand.warning : Brand.success;
  const pctLabel = `${Math.round(pct * 100)}%`;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>Weight Utilization</ThemedText>
        <ThemedText style={[styles.pctBadge, { color: fillColor }]}>{pctLabel}</ThemedText>
      </View>

      {/* Bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: fillColor }]} />
      </View>

      {/* Labels */}
      <View style={styles.labelsRow}>
        <View style={styles.labelItem}>
          <ThemedText style={[styles.labelValue, { color: fillColor }]}>
            {effectiveWeight.toLocaleString()}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {overAllowance ? 'Capped at auth.' : 'Shipping (lbs)'}
          </ThemedText>
        </View>
        <View style={[styles.labelItem, styles.labelRight]}>
          <ThemedText style={styles.labelValue}>
            {authorizedWeight.toLocaleString()}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Authorized (lbs)</ThemedText>
        </View>
      </View>

      {overAllowance && (
        <View style={[styles.overBanner, { backgroundColor: `${Brand.danger}12` }]}>
          <ThemedText type="small" style={{ color: Brand.danger, lineHeight: 18 }}>
            Your estimated weight ({actualWeight.toLocaleString()} lbs) exceeds your authorized
            allowance. The incentive is calculated on {authorizedWeight.toLocaleString()} lbs.
            You are responsible for any costs above your entitlement.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600' },
  pctBadge: { fontSize: 20, fontWeight: '800' },
  barTrack: {
    height: 14,
    borderRadius: 99,
    backgroundColor: 'rgba(128,128,128,0.15)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 99 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  labelItem: { gap: 1 },
  labelRight: { alignItems: 'flex-end' },
  labelValue: { fontSize: 17, fontWeight: '700' },
  overBanner: { borderRadius: Spacing.two, padding: Spacing.two },
});
