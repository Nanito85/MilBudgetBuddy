import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { Installation } from '@/data/installations';
import { formatDiff, PCSResult } from '@/features/pcs/utils/pcsCalc';

interface Props {
  result: PCSResult;
  current: Installation;
  gaining: Installation;
}

function RateCol({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.col}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.colLabel} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.colValue, highlight && styles.colValueHighlight]}>
        {value}
      </ThemedText>
    </View>
  );
}

export function ComparisonTable({ result, current, gaining }: Props) {
  const { monthlyDiff, annualDiff } = result;
  const isIncrease = (monthlyDiff ?? 0) >= 0;
  const diffColor = isIncrease ? Brand.success : Brand.danger;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Station headers */}
      <View style={styles.headerRow}>
        <View style={styles.headerCol}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.stationLabel}>
            CURRENT
          </ThemedText>
          <ThemedText style={styles.stationName} numberOfLines={2}>{current.name}</ThemedText>
        </View>
        <ThemedText style={styles.vsText}>vs</ThemedText>
        <View style={[styles.headerCol, styles.headerColRight]}>
          <ThemedText type="small" themeColor="textSecondary" style={[styles.stationLabel, styles.textRight]}>
            GAINING
          </ThemedText>
          <ThemedText style={[styles.stationName, styles.textRight]} numberOfLines={2}>
            {gaining.name}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* BAH row */}
      <View style={styles.rateRow}>
        <RateCol
          label="BAH"
          value={result.current.bah != null ? `$${result.current.bah.toLocaleString()}` : result.current.label}
        />
        <View style={styles.rowMiddle} />
        <View style={[styles.col, styles.colRight]}>
          <ThemedText type="small" themeColor="textSecondary" style={[styles.colLabel, styles.textRight]}>
            BAH
          </ThemedText>
          <ThemedText style={[styles.colValue, styles.textRight]}>
            {result.gaining.bah != null ? `$${result.gaining.bah.toLocaleString()}` : result.gaining.label}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Monthly diff */}
      <View style={styles.diffSection}>
        <View style={styles.diffRow}>
          <ThemedText themeColor="textSecondary" style={styles.diffLabel}>
            Monthly BAH difference
          </ThemedText>
          <ThemedText style={[styles.diffValue, { color: diffColor }]}>
            {formatDiff(monthlyDiff)}/mo
          </ThemedText>
        </View>
        <View style={styles.diffRow}>
          <ThemedText themeColor="textSecondary" style={styles.diffLabel}>
            Annual difference
          </ThemedText>
          <ThemedText style={[styles.diffValue, { color: diffColor }]}>
            {formatDiff(annualDiff)}/yr
          </ThemedText>
        </View>
      </View>

      {/* OCONUS notice */}
      {(current.oconus || gaining.oconus) && (
        <View style={styles.oconusNotice}>
          <ThemedText type="small" style={styles.oconusText}>
            OCONUS stations use Overseas Housing Allowance (OHA) instead of BAH.
            Contact your gaining unit's finance office for OHA rates.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerCol: { flex: 1, gap: 2 },
  headerColRight: { alignItems: 'flex-end' },
  stationLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  stationName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  vsText: { fontSize: 13, fontWeight: '500', opacity: 0.4, marginTop: Spacing.three },
  textRight: { textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  col: { flex: 1, gap: 2 },
  colRight: { alignItems: 'flex-end' },
  colLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  colValue: { fontSize: 17, fontWeight: '700' },
  colValueHighlight: { color: Brand.primary },
  rowMiddle: { width: Spacing.three },
  diffSection: { padding: Spacing.three, gap: Spacing.two },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffLabel: { fontSize: 14 },
  diffValue: { fontSize: 17, fontWeight: '800' },
  oconusNotice: {
    margin: Spacing.three,
    marginTop: 0,
    padding: Spacing.two,
    backgroundColor: 'rgba(230,126,34,0.1)',
    borderRadius: Spacing.two,
  },
  oconusText: { color: Brand.warning, lineHeight: 18 },
});
