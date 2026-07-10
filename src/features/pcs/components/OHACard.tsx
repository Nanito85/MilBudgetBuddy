import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import {
  DTMO_OHA_URL,
  OHA_DATA_QUARTER,
  OhaLocationRate,
  getOhaRate,
  isOhaDataStale,
} from '@/data/oha-rates';
import { PayGrade } from '@/data/bah-rates';
import { Installation } from '@/data/installations';

interface Props {
  installation: Installation;
  area: OhaLocationRate;
  grade: PayGrade;
  withDep: boolean;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

const GRADE_ORDER: PayGrade[] = [
  'E1','E2','E3','E4','E5','E6','E7','E8','E9',
  'W1','W2','W3','W4','W5',
  'O1','O2','O3','O4','O5','O6','O7','O8','O9','O10',
];

export function OHACard({ installation, area, grade, withDep }: Props) {
  const tc = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const rates = area.rates.length === 0 ? null : getOhaRate(area.locationLabel, grade, withDep);
  const stale  = isOhaDataStale();

  const rent    = rates?.rentCeilingUSD    ?? 0;
  const utility = rates?.utilityAllowanceUSD ?? 0;
  const monthly = rent + utility;

  const openDTMO = () => Linking.openURL(DTMO_OHA_URL);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            OHA — {area.country.toUpperCase()}
          </ThemedText>
          <ThemedText style={styles.locationName} numberOfLines={2}>
            {installation.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.areaLabel}>
            {area.locationLabel}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: 'rgba(0,200,168,0.12)' }]}>
          <ThemedText style={styles.badgeText}>OHA</ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      {area.rates.length === 0 ? (
        /* No rate data — direct to DTMO */
        <View style={styles.noDataSection}>
          <ThemedText style={styles.noDataTitle}>No off-base housing market</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.noDataBody}>
            {area.notes ?? 'Contact your gaining unit\'s finance office for OHA entitlements.'}
          </ThemedText>
        </View>
      ) : (
        <>
          {/* Grade summary row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colLabel}>RENT CEILING</ThemedText>
              <ThemedText style={[styles.colValue, { color: Brand.accent }]}>{fmt(rent)}/mo</ThemedText>
            </View>
            <View style={styles.colDivider} />
            <View style={styles.summaryCol}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colLabel}>UTILITY ALLOW.</ThemedText>
              <ThemedText style={[styles.colValue, { color: Brand.tactical }]}>{fmt(utility)}/mo</ThemedText>
            </View>
            <View style={styles.colDivider} />
            <View style={styles.summaryCol}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colLabel}>MIHA (ONE-TIME)</ThemedText>
              <ThemedText style={[styles.colValue, { color: tc.textPrimary }]}>{area.miha > 0 ? fmt(area.miha) : '—'}</ThemedText>
            </View>
          </View>

          {/* Monthly total */}
          <View style={styles.totalRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Monthly OHA ({grade}, {withDep ? 'w/ dep' : 'no dep'})
            </ThemedText>
            <ThemedText style={styles.totalAmt}>{fmt(monthly)}/mo</ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Expand/collapse all grades */}
          <Pressable
            onPress={() => setExpanded(e => !e)}
            style={({ pressed }) => [styles.expandBtn, pressed && { opacity: 0.6 }]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.expandLabel}>
              {expanded ? '▲ Hide all grades' : '▼ All grade rates'}
            </ThemedText>
          </Pressable>

          {expanded && (
            <View style={styles.gradeTable}>
              <View style={styles.gradeHeaderRow}>
                <ThemedText style={[styles.gradeCell, styles.gradeCellHdr, { color: tc.textSecondary }]}>GRADE</ThemedText>
                <ThemedText style={[styles.gradeCell, styles.gradeRentCell, styles.gradeCellHdr, { color: tc.textSecondary }]}>RENT</ThemedText>
                <ThemedText style={[styles.gradeCell, styles.gradeRentCell, styles.gradeCellHdr, { color: tc.textSecondary }]}>UTILITY</ThemedText>
                <ThemedText style={[styles.gradeCell, styles.gradeRentCell, styles.gradeCellHdr, { color: tc.textSecondary }]}>TOTAL</ThemedText>
              </View>
              {GRADE_ORDER.map(g => {
                const r = getOhaRate(area.locationLabel, g, withDep);
                if (!r) return null;
                const isActive = g === grade;
                return (
                  <View key={g} style={[styles.gradeRow, isActive && styles.gradeRowActive]}>
                    <ThemedText style={[styles.gradeCell, !isActive && { color: tc.textSecondary }, isActive && styles.gradeCellActive]}>{g}</ThemedText>
                    <ThemedText style={[styles.gradeCell, styles.gradeRentCell, !isActive && { color: tc.textSecondary }, isActive && styles.gradeCellActive]}>
                      {fmt(r.rentCeilingUSD)}
                    </ThemedText>
                    <ThemedText style={[styles.gradeCell, styles.gradeRentCell, !isActive && { color: tc.textSecondary }, isActive && styles.gradeCellActive]}>
                      {fmt(r.utilityAllowanceUSD)}
                    </ThemedText>
                    <ThemedText style={[styles.gradeCell, styles.gradeRentCell, !isActive && { color: tc.textSecondary }, isActive && styles.gradeCellActive]}>
                      {fmt(r.rentCeilingUSD + r.utilityAllowanceUSD)}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          {area.notes && area.rates.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.notes}>
              {area.notes}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            {area.approximate ? '⚠ ' : ''}{OHA_DATA_QUARTER} approx. rates — verify at DTMO.
            {stale ? ' Data may be outdated.' : ''}
          </ThemedText>
        </View>
        <Pressable
          onPress={openDTMO}
          style={({ pressed }) => [styles.dtmoBtn, pressed && { opacity: 0.7 }]}>
          <ThemedText style={styles.dtmoBtnText}>DTMO ↗</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card:     { borderRadius: Spacing.three, overflow: 'hidden' },
  header:   { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.three, gap: Spacing.two },
  eyebrow:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  locationName: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginTop: 2 },
  areaLabel:    { fontSize: 10, marginTop: 2 },
  badge:        { borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: 4 },
  badgeText:    { fontSize: 11, fontWeight: '800', color: Brand.primary, letterSpacing: 0.5 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },

  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2 },
  summaryCol: { flex: 1, alignItems: 'center', gap: 4 },
  colDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginVertical: 2 },
  colLabel:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  colValue:   { fontSize: 15, fontWeight: '800', fontFamily: Fonts.data, textAlign: 'center' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  totalAmt: { fontSize: 18, fontWeight: '800', color: Brand.accent, fontFamily: Fonts.data },

  expandBtn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, alignItems: 'center' },
  expandLabel: { fontSize: 11, fontWeight: '600' },

  gradeTable: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  gradeHeaderRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.3)', paddingBottom: 4, marginBottom: 4 },
  gradeRow:       { flexDirection: 'row', paddingVertical: 3 },
  gradeRowActive: { backgroundColor: 'rgba(0,200,168,0.08)', borderRadius: 4, marginHorizontal: -4, paddingHorizontal: 4 },
  gradeCell:      { fontSize: 12, width: 42 },
  gradeRentCell:  { flex: 1, textAlign: 'right', fontFamily: Fonts.data },
  gradeCellHdr:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  gradeCellActive:{ color: Brand.accent, fontWeight: '700' },

  noDataSection: { padding: Spacing.three, gap: Spacing.one },
  noDataTitle:   { fontSize: 14, fontWeight: '600' },
  noDataBody:    { lineHeight: 18 },

  footer: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two },
  notes:  { fontSize: 10, lineHeight: 14, marginBottom: 2, color: Brand.warning },
  disclaimer: { fontSize: 10, lineHeight: 14 },
  dtmoBtn:    { backgroundColor: 'rgba(0,200,168,0.15)', borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,200,168,0.3)' },
  dtmoBtnText:{ fontSize: 11, fontWeight: '800', color: Brand.primary },
});
