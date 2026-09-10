import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { PayGrade } from '@/data/bah-rates';
import { getConusCola, getConusColaZipInfo } from '@/data/conus-cola';
import { Installation } from '@/data/installations';
import { formatDiff, PCSResult } from '@/features/pcs/utils/pcsCalc';
import { fmtPay } from '@/features/home/utils/lesCalc';
import { useThemeColors } from '@/hooks/use-theme';

interface Props {
  result: PCSResult;
  current: Installation;
  gaining: Installation;
  payGrade: PayGrade;
  yos: number;
  hasSpouse: boolean;
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

export function ComparisonTable({ result, current, gaining, payGrade, yos, hasSpouse }: Props) {
  const tc = useThemeColors();
  const { monthlyDiff, annualDiff } = result;
  const isIncrease = (monthlyDiff ?? 0) >= 0;
  const diffColor = isIncrease ? Brand.success : Brand.danger;

  // Real CONUS COLA (18 eligible high-cost metro areas nationwide, ZIP-keyed
  // — see src/data/conus-cola.ts). Hawaii/Alaska are "non-foreign OCONUS" and
  // not part of this program; this app doesn't yet compute their separate
  // OCONUS-style COLA, so they correctly show no CONUS COLA notice here
  // rather than the stale flat-range estimate this used to show.
  const currentColaInfo = getConusColaZipInfo(current.mhaZip);
  const gainingColaInfo = getConusColaZipInfo(gaining.mhaZip);
  const currentColaAmt = currentColaInfo ? getConusCola(current.mhaZip, payGrade, yos, hasSpouse) : null;
  const gainingColaAmt = gainingColaInfo ? getConusCola(gaining.mhaZip, payGrade, yos, hasSpouse) : null;
  const losingCola = !!currentColaInfo && !gainingColaInfo;
  const gainingColaFlag = !!gainingColaInfo && !currentColaInfo;
  const bothHaveCola = !!currentColaInfo && !!gainingColaInfo;

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

      {/* COLA loss warning */}
      {losingCola && (
        <View style={styles.colaNotice}>
          <ThemedText type="small" style={[styles.colaLossText, { color: tc.warning }]}>
            ⚠️ COLA LOSS — You currently receive CONUS COLA at {current.name} ({fmtPay(currentColaAmt ?? 0)}/mo).
            This allowance does NOT transfer to your gaining station. Factor this into your total pay comparison.
          </ThemedText>
        </View>
      )}

      {/* COLA gain notice */}
      {gainingColaFlag && (
        <View style={[styles.colaNotice, styles.colaGainNotice]}>
          <ThemedText type="small" style={[styles.colaGainText, { color: tc.success }]}>
            💰 COLA GAIN — {gaining.name} is CONUS COLA eligible (~{fmtPay(gainingColaAmt ?? 0)}/mo).
            Verify your rate at militarypay.defense.gov after arrival.
          </ThemedText>
        </View>
      )}

      {/* Both have COLA */}
      {bothHaveCola && (
        <View style={styles.colaNotice}>
          <ThemedText type="small" style={[styles.colaLossText, { color: tc.warning }]}>
            ℹ️ COLA NOTE — Both stations are CONUS COLA eligible. Rates differ:
            {'\n'}• Current ({current.name}): ~{fmtPay(currentColaAmt ?? 0)}/mo
            {'\n'}• Gaining ({gaining.name}): ~{fmtPay(gainingColaAmt ?? 0)}/mo
            {'\n'}Verify your actual rate at militarypay.defense.gov.
          </ThemedText>
        </View>
      )}

      {/* OCONUS notice */}
      {(current.oconus || gaining.oconus) && (
        <View style={styles.oconusNotice}>
          <ThemedText type="small" style={[styles.oconusText, { color: tc.warning }]}>
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
  colaNotice: {
    margin: Spacing.three,
    marginTop: 0,
    padding: Spacing.two,
    backgroundColor: 'rgba(211,47,47,0.08)',
    borderRadius: Spacing.two,
    borderLeftWidth: 3,
    borderLeftColor: Brand.danger,
  },
  colaGainNotice: {
    backgroundColor: 'rgba(0,178,122,0.08)',
    borderLeftColor: Brand.success,
  },
  colaLossText: { lineHeight: 18 },
  colaGainText: { lineHeight: 18 },
  oconusNotice: {
    margin: Spacing.three,
    marginTop: 0,
    padding: Spacing.two,
    backgroundColor: 'rgba(230,126,34,0.1)',
    borderRadius: Spacing.two,
  },
  oconusText: { lineHeight: 18 },
});
