import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { LESBreakdown, fmtPay } from '@/features/home/utils/lesCalc';

interface RowProps {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
  indent?: boolean;
}

function Row({ label, value, positive, negative, bold, indent }: RowProps) {
  const valueColor = positive ? Brand.tactical : negative ? Brand.danger : '#C8D8E8';
  return (
    <View style={[styles.row, indent && styles.rowIndent]}>
      <ThemedText style={[styles.rowLabel, bold && styles.rowLabelBold, { opacity: indent ? 0.7 : 1 }]}>
        {label}
      </ThemedText>
      <View style={styles.dotLine} />
      <ThemedText style={[styles.rowValue, bold && styles.rowValueBold, { color: valueColor }]}>
        {value}
      </ThemedText>
    </View>
  );
}

interface Props {
  breakdown: LESBreakdown;
}

export function PaySummaryCard({ breakdown }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TacticalCard accentColor={Brand.accent} cornerSize={14} style={styles.card}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <ThemedText type="label" style={styles.headerLabel}>PAY STATEMENT // MONTHLY EST.</ThemedText>
        </View>
        <ThemedText type="label" style={styles.headerLabel}>FY2025</ThemedText>
      </View>

      {/* Net pay hero */}
      <View style={styles.hero}>
        <View>
          <ThemedText type="label" style={styles.netLabel}>ESTIMATED NET PAY</ThemedText>
          <ThemedText style={styles.netAmount}>{fmtPay(breakdown.netPay)}</ThemedText>
        </View>
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.expandBtn} hitSlop={12}>
          <ThemedText style={styles.expandIcon}>{expanded ? '▲' : '▼'}</ThemedText>
          <ThemedText type="label" style={styles.expandLabel}>{expanded ? 'HIDE' : 'DETAIL'}</ThemedText>
        </Pressable>
      </View>

      {/* Quick bar */}
      {!expanded && (
        <View style={styles.quickBar}>
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>GROSS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.tactical }]}>{fmtPay(breakdown.grossPay)}</ThemedText>
          </View>
          <View style={styles.quickSep} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>DEDUCTIONS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.danger }]}>-{fmtPay(breakdown.totalDeductions)}</ThemedText>
          </View>
          <View style={styles.quickSep} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>TSP</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.accent }]}>{fmtPay(breakdown.tsp)}</ThemedText>
          </View>
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <View style={styles.detailDivider} />

          <ThemedText type="label" style={styles.sectionHead}>// ENTITLEMENTS</ThemedText>
          <Row label="BASE PAY" value={fmtPay(breakdown.basePay)} indent positive />
          <Row label="BAH" value={fmtPay(breakdown.bah)} indent positive />
          <Row label="BAS" value={fmtPay(breakdown.bas)} indent positive />
          {breakdown.specialPays > 0 && (
            <Row label="SPECIAL PAYS" value={fmtPay(breakdown.specialPays)} indent positive />
          )}
          <Row label="GROSS PAY" value={fmtPay(breakdown.grossPay)} bold positive />

          <View style={styles.detailDivider} />

          <ThemedText type="label" style={styles.sectionHead}>// DEDUCTIONS</ThemedText>
          <Row label="FICA (SS + MED)" value={`-${fmtPay(breakdown.fica)}`} indent negative />
          <Row label="FED TAX (EST.)" value={`-${fmtPay(breakdown.fedTax)}`} indent negative />
          {breakdown.stateTax > 0 && (
            <Row label="STATE TAX (EST.)" value={`-${fmtPay(breakdown.stateTax)}`} indent negative />
          )}
          <Row label="TSP CONTRIB" value={`-${fmtPay(breakdown.tsp)}`} indent negative />
          {breakdown.sgli > 0 && <Row label="SGLI" value={`-${fmtPay(breakdown.sgli)}`} indent negative />}
          {breakdown.dental > 0 && <Row label="DENTAL (TDP)" value={`-${fmtPay(breakdown.dental)}`} indent negative />}
          <Row label="TOTAL DEDUCTIONS" value={`-${fmtPay(breakdown.totalDeductions)}`} bold negative />

          <View style={styles.detailDivider} />

          <Row label="ESTIMATED NET PAY" value={fmtPay(breakdown.netPay)} bold />

          <ThemedText type="label" style={styles.disclaimer}>
            * ESTIMATE ONLY — VERIFY AT MYPAY.DFAS.MIL{'\n'}SET HOME STATE IN PROFILE FOR STATE TAX ESTIMATE
          </ThemedText>
        </View>
      )}
    </TacticalCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 4 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(26,58,92,0.4)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDot: { width: 6, height: 6, backgroundColor: Brand.accent, borderRadius: 1 },
  headerLabel: { color: '#4D7A9A' },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  netLabel: { color: '#4D7A9A', marginBottom: 4 },
  netAmount: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: Brand.accent,
    fontFamily: Fonts.data,
  },
  expandBtn: { alignItems: 'center', gap: 2 },
  expandIcon: { fontSize: 14, color: '#3D6080' },
  expandLabel: { color: '#3D6080', fontSize: 8 },
  quickBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    paddingVertical: Spacing.two,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 3 },
  quickSep: { width: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  quickLabel: { color: '#3D6080', fontSize: 8 },
  quickValue: { fontSize: 14, fontWeight: '700', fontFamily: Fonts.data },
  detail: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: 0 },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
    marginVertical: Spacing.two,
  },
  sectionHead: { color: Brand.tactical, marginBottom: Spacing.one, fontSize: 9 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 4,
  },
  rowIndent: { paddingLeft: Spacing.two },
  rowLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#7A9AB5',
    minWidth: 120,
  },
  rowLabelBold: { color: '#C8D8E8', fontWeight: '700', fontSize: 12 },
  dotLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(26,58,92,0.6)', marginBottom: 1 },
  rowValue: { fontSize: 13, fontWeight: '700', fontFamily: Fonts.data, letterSpacing: 0.5 },
  rowValueBold: { fontSize: 14 },
  disclaimer: { color: '#2A4A60', fontSize: 8, lineHeight: 12, marginTop: Spacing.two, letterSpacing: 0.8 },
});
