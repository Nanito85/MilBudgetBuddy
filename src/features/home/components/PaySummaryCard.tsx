import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { LESBreakdown, fmtPay } from '@/features/home/utils/lesCalc';
import { useUserStore } from '@/store/user.store';

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
  const [spouseOpen, setSpouseOpen] = useState(false);

  const spouseMonthlyIncome = useUserStore((s) => s.spouseMonthlyIncome);
  const setSpouseMonthlyIncome = useUserStore((s) => s.setSpouseMonthlyIncome);

  const [spouseInput, setSpouseInput] = useState(
    spouseMonthlyIncome > 0 ? String(spouseMonthlyIncome) : '',
  );

  const perPaycheck = breakdown.netPay / 2;
  const spousePerPaycheck = spouseMonthlyIncome / 2;
  const householdMonthly = breakdown.netPay + spouseMonthlyIncome;
  const householdPerCheck = householdMonthly / 2;
  const hasSpouseIncome = spouseMonthlyIncome > 0;

  function commitSpouseIncome() {
    const parsed = parseFloat(spouseInput.replace(/[^0-9.]/g, ''));
    setSpouseMonthlyIncome(isNaN(parsed) ? 0 : Math.round(parsed));
  }

  return (
    <TacticalCard accentColor={Brand.accent} cornerSize={14} style={styles.card}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <ThemedText type="label" style={styles.headerLabel}>PAY STATEMENT // EST.</ThemedText>
        </View>
        <ThemedText type="label" style={styles.headerLabel}>FY2026</ThemedText>
      </View>

      {/* Net pay hero — per paycheck */}
      <View style={styles.hero}>
        <View>
          <ThemedText type="label" style={styles.netLabel}>EST. NET / PAYCHECK</ThemedText>
          <ThemedText style={styles.netAmount}>{fmtPay(perPaycheck)}</ThemedText>
          <ThemedText style={styles.netMonthly}>
            {fmtPay(breakdown.netPay)}<ThemedText style={styles.netMonthlyUnit}> / month</ThemedText>
          </ThemedText>
        </View>
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.expandBtn} hitSlop={12}>
          <ThemedText style={styles.expandIcon}>{expanded ? '▲' : '▼'}</ThemedText>
          <ThemedText type="label" style={styles.expandLabel}>{expanded ? 'HIDE' : 'DETAIL'}</ThemedText>
        </Pressable>
      </View>

      {/* Spouse income — household combined */}
      {hasSpouseIncome && !expanded && (
        <View style={styles.householdBar}>
          <View style={styles.householdItem}>
            <ThemedText style={styles.householdLabel}>YOUR CHECK</ThemedText>
            <ThemedText style={[styles.householdValue, { color: Brand.accent }]}>{fmtPay(perPaycheck)}</ThemedText>
          </View>
          <ThemedText style={styles.householdPlus}>+</ThemedText>
          <View style={styles.householdItem}>
            <ThemedText style={styles.householdLabel}>SPOUSE CHECK</ThemedText>
            <ThemedText style={[styles.householdValue, { color: '#208AEF' }]}>{fmtPay(spousePerPaycheck)}</ThemedText>
          </View>
          <ThemedText style={styles.householdPlus}>=</ThemedText>
          <View style={styles.householdItem}>
            <ThemedText style={styles.householdLabel}>HOUSEHOLD</ThemedText>
            <ThemedText style={[styles.householdValue, { color: Brand.success }]}>{fmtPay(householdPerCheck)}</ThemedText>
          </View>
        </View>
      )}

      {/* Quick bar */}
      {!expanded && (
        <View style={styles.quickBar}>
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>GROSS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.tactical }]}>{fmtPay(breakdown.grossPay / 2)}</ThemedText>
          </View>
          <View style={styles.quickSep} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>DEDUCTIONS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.danger }]}>-{fmtPay(breakdown.totalDeductions / 2)}</ThemedText>
          </View>
          <View style={styles.quickSep} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>TSP</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.accent }]}>{fmtPay(breakdown.tsp / 2)}</ThemedText>
          </View>
          <View style={styles.quickSep} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={styles.quickLabel}>SAVINGS 10%</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.success }]}>{fmtPay(breakdown.netPay * 0.10 / 2)}</ThemedText>
          </View>
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <View style={styles.detailDivider} />

          <ThemedText type="label" style={styles.sectionHead}>// ENTITLEMENTS (MONTHLY)</ThemedText>
          <Row label="BASE PAY" value={fmtPay(breakdown.basePay)} indent positive />
          <Row label="BAH" value={fmtPay(breakdown.bah)} indent positive />
          <Row label="BAS" value={fmtPay(breakdown.bas)} indent positive />
          {breakdown.specialPays > 0 && (
            <Row label="SPECIAL PAYS" value={fmtPay(breakdown.specialPays)} indent positive />
          )}
          <Row label="GROSS PAY" value={fmtPay(breakdown.grossPay)} bold positive />

          <View style={styles.detailDivider} />

          <ThemedText type="label" style={styles.sectionHead}>// DEDUCTIONS (MONTHLY)</ThemedText>
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

          <Row label="MONTHLY NET" value={fmtPay(breakdown.netPay)} bold />
          <Row label="PER PAYCHECK (÷2)" value={fmtPay(perPaycheck)} bold />

          {hasSpouseIncome && (
            <>
              <View style={styles.detailDivider} />
              <ThemedText type="label" style={styles.sectionHead}>// HOUSEHOLD COMBINED</ThemedText>
              <Row label="YOUR NET/MO" value={fmtPay(breakdown.netPay)} indent positive />
              <Row label="SPOUSE INCOME/MO" value={fmtPay(spouseMonthlyIncome)} indent positive />
              <Row label="HOUSEHOLD MONTHLY" value={fmtPay(householdMonthly)} bold positive />
              <Row label="HOUSEHOLD / PAYCHECK" value={fmtPay(householdPerCheck)} bold />
            </>
          )}

          <ThemedText type="label" style={styles.disclaimer}>
            * ESTIMATE ONLY — VERIFY AT MYPAY.DFAS.MIL{'\n'}SET HOME STATE IN PROFILE FOR STATE TAX ESTIMATE
          </ThemedText>
        </View>
      )}

      {/* Spouse income entry */}
      <Pressable
        onPress={() => setSpouseOpen((v) => !v)}
        style={styles.spouseToggle}>
        <ThemedText style={styles.spouseToggleIcon}>{hasSpouseIncome ? '👫' : '+'}</ThemedText>
        <ThemedText style={styles.spouseToggleLabel}>
          {hasSpouseIncome
            ? `SPOUSE INCOME: ${fmtPay(spouseMonthlyIncome)}/mo`
            : 'ADD SPOUSE INCOME'}
        </ThemedText>
        <ThemedText style={styles.spouseToggleChevron}>{spouseOpen ? '▲' : '▼'}</ThemedText>
      </Pressable>

      {spouseOpen && (
        <View style={styles.spousePanel}>
          <ThemedText style={styles.spousePanelLabel}>SPOUSE MONTHLY TAKE-HOME</ThemedText>
          <View style={styles.spouseInputRow}>
            <ThemedText style={styles.spouseDollar}>$</ThemedText>
            <TextInput
              style={styles.spouseInput}
              value={spouseInput}
              onChangeText={setSpouseInput}
              onBlur={commitSpouseIncome}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#3D6080"
              returnKeyType="done"
              onSubmitEditing={commitSpouseIncome}
            />
            <Pressable
              style={styles.spouseSaveBtn}
              onPress={() => { commitSpouseIncome(); setSpouseOpen(false); }}>
              <ThemedText style={styles.spouseSaveBtnText}>SAVE</ThemedText>
            </Pressable>
            {hasSpouseIncome && (
              <Pressable
                style={styles.spouseClearBtn}
                onPress={() => {
                  setSpouseMonthlyIncome(0);
                  setSpouseInput('');
                  setSpouseOpen(false);
                }}>
                <ThemedText style={styles.spouseClearBtnText}>CLEAR</ThemedText>
              </Pressable>
            )}
          </View>
          <ThemedText style={styles.spousePanelNote}>
            Enter after-tax monthly income. Used only for household take-home display.
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
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  netLabel: { color: '#4D7A9A', marginBottom: 4 },
  netAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: Brand.accent,
    fontFamily: Fonts.data,
  },
  netMonthly: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4D7A9A',
    fontFamily: Fonts.data,
    marginTop: 2,
  },
  netMonthlyUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#3D6080',
  },
  expandBtn: { alignItems: 'center', gap: 2 },
  expandIcon: { fontSize: 14, color: '#3D6080' },
  expandLabel: { color: '#3D6080', fontSize: 8 },

  householdBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,178,122,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.success + '30',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 4,
  },
  householdItem: { flex: 1, alignItems: 'center', gap: 2 },
  householdLabel: { fontSize: 7, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8 },
  householdValue: { fontSize: 13, fontWeight: '900', fontFamily: Fonts.data },
  householdPlus: { fontSize: 16, color: '#3D6080', fontWeight: '300' },

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

  spouseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  spouseToggleIcon: { fontSize: 14 },
  spouseToggleLabel: { flex: 1, fontSize: 10, fontWeight: '700', color: '#4D7A9A', letterSpacing: 0.5 },
  spouseToggleChevron: { fontSize: 10, color: '#3D6080' },

  spousePanel: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    backgroundColor: 'rgba(32,138,239,0.04)',
  },
  spousePanelLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#208AEF',
    marginTop: Spacing.two,
  },
  spouseInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#04080F',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  spouseDollar: { fontSize: 16, color: '#208AEF', fontWeight: '700' },
  spouseInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#C8D8E8',
    fontFamily: Fonts.data,
    padding: 0,
  },
  spouseSaveBtn: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  spouseSaveBtnText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  spouseClearBtn: {
    borderWidth: 1,
    borderColor: Brand.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
  },
  spouseClearBtnText: { fontSize: 10, fontWeight: '800', color: Brand.danger, letterSpacing: 0.5 },
  spousePanelNote: { fontSize: 9, color: '#3D6080', lineHeight: 13 },
});
