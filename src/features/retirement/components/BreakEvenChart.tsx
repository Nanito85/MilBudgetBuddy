import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

interface Props {
  retirementAge: number;
  breakEvenAge: number | null;
  breakEvenYears: number | null;
}

const CHART_END_AGE = 90;

export function BreakEvenChart({ retirementAge, breakEvenAge, breakEvenYears }: Props) {
  if (breakEvenAge == null || breakEvenYears == null) return null;

  const span = CHART_END_AGE - retirementAge;
  const years = breakEvenAge - retirementAge;

  // Clamp position to 5%-95% so labels don't overflow
  const rawPct = span > 0 ? years / span : 0;
  const pct = Math.min(0.95, Math.max(0.05, rawPct));
  const neverBreaksEven = breakEvenAge > CHART_END_AGE;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText style={styles.title}>Break-Even Analysis</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        At what age does BRS total wealth (pension + TSP) surpass High-3 total pension?
      </ThemedText>

      {neverBreaksEven ? (
        <View style={[styles.neverBox, { backgroundColor: `${Brand.danger}12` }]}>
          <ThemedText style={{ color: Brand.danger, fontWeight: '600' }}>
            With your current TSP settings, High-3 remains ahead past age {CHART_END_AGE}.
          </ThemedText>
          <ThemedText type="small" style={{ color: Brand.danger, lineHeight: 18 }}>
            Increase your TSP contribution rate to improve the BRS outcome.
          </ThemedText>
        </View>
      ) : (
        <>
          {/* Timeline bar */}
          <View style={styles.chartWrap}>
            {/* High-3 wins zone */}
            <View style={[styles.zoneH3, { width: `${pct * 100}%` }]} />
            {/* BRS wins zone */}
            <View style={[styles.zoneBRS, { width: `${(1 - pct) * 100}%` }]} />
            {/* Break-even tick */}
            <View style={[styles.tick, { left: `${pct * 100}%` as any }]} />
          </View>

          {/* Age labels below bar */}
          <View style={styles.axisRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.axisLeft}>
              Age {retirementAge}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.axisRight}>
              Age {CHART_END_AGE}
            </ThemedText>
          </View>

          {/* Zone labels */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: `${Brand.primaryLight}80` }]} />
              <ThemedText type="small" themeColor="textSecondary">High-3 ahead</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: `${Brand.accent}80` }]} />
              <ThemedText type="small" themeColor="textSecondary">BRS ahead</ThemedText>
            </View>
          </View>

          {/* Break-even callout */}
          <View style={[styles.callout, { borderColor: Brand.accent }]}>
            <ThemedText style={[styles.calloutAge, { color: Brand.accent }]}>
              Age {breakEvenAge}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.calloutBody}>
              BRS total wealth surpasses High-3 — {breakEvenYears} years after retirement.
              After this point, TSP savings make BRS the better deal.
            </ThemedText>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { lineHeight: 18 },
  chartWrap: {
    height: 28,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: Spacing.one,
    position: 'relative',
  },
  zoneH3: { backgroundColor: `${Brand.primaryLight}55`, height: '100%' },
  zoneBRS: { backgroundColor: `${Brand.accent}55`, height: '100%' },
  tick: {
    position: 'absolute',
    width: 3,
    height: '100%',
    backgroundColor: Brand.accent,
    top: 0,
    marginLeft: -1.5,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.one,
  },
  axisLeft: { fontSize: 11 },
  axisRight: { fontSize: 11 },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  callout: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  calloutAge: { fontSize: 22, fontWeight: '800' },
  calloutBody: { lineHeight: 18 },
  neverBox: { borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.one },
});
