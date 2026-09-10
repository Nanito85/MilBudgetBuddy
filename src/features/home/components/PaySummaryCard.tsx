import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { EditPayModal } from '@/features/home/components/EditPayModal';
import { LESBreakdown, fmtPay } from '@/features/home/utils/lesCalc';
import { useUserStore } from '@/store/user.store';
import { useThemeColors } from '@/hooks/use-theme';

// ── Row helper ────────────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
  indent?: boolean;
  overridden?: boolean;
}

function Row({ label, value, positive, negative, bold, indent, overridden }: RowProps) {
  const tc = useThemeColors();
  const valueColor = positive ? Brand.tactical : negative ? Brand.danger : tc.textPrimary;
  return (
    <View style={[rowStyles.row, indent && rowStyles.indent]}>
      <ThemedText
        style={[
          rowStyles.label,
          { color: tc.textSecondary },
          bold && [rowStyles.labelBold, { color: tc.textPrimary }],
          indent && rowStyles.labelDim,
        ]}>
        {label}{overridden ? ' ✎' : ''}
      </ThemedText>
      <View style={[rowStyles.dotLine, { backgroundColor: tc.borderColor }]} />
      <ThemedText style={[rowStyles.value, bold && rowStyles.valueBold, { color: valueColor }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 4 },
  indent: { paddingLeft: Spacing.two },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, minWidth: 120 },
  labelBold: { fontWeight: '700', fontSize: 12 },
  labelDim: { opacity: 0.7 },
  dotLine: { flex: 1, height: StyleSheet.hairlineWidth, marginBottom: 1 },
  value: { fontSize: 13, fontWeight: '700', fontFamily: Fonts.data, letterSpacing: 0.5 },
  valueBold: { fontSize: 14 },
});

// ── Main Card ─────────────────────────────────────────────────────────────────

interface Props {
  breakdown: LESBreakdown;
}

export function PaySummaryCard({ breakdown }: Props) {
  const tc = useThemeColors();
  const [expanded,   setExpanded]   = useState(false);
  const [spouseOpen, setSpouseOpen] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);

  const lesOverrides        = useUserStore((s) => s.lesOverrides);
  const spouseMonthlyIncome = useUserStore((s) => s.spouseMonthlyIncome);
  const setSpouseMonthlyIncome = useUserStore((s) => s.setSpouseMonthlyIncome);
  const housingStatus       = useUserStore((s) => s.housingStatus);

  const bahLabel = breakdown.bahOverridden
    ? (breakdown.isOha ? 'OHA' : 'BAH')
    : breakdown.isOha
      ? `OHA${breakdown.ohaApproximate ? ' (APPROX.)' : ''}`
      : housingStatus === 'barracks'
        ? 'BAH (PARTIAL — BARRACKS)'
        : housingStatus === 'on_base_family_housing'
          ? 'BAH (ON-BASE HOUSING)'
          : 'BAH';

  const [spouseInput, setSpouseInput] = useState(
    spouseMonthlyIncome > 0 ? String(spouseMonthlyIncome) : '',
  );

  const perPaycheck       = breakdown.netPay / 2;
  const spousePerPaycheck = spouseMonthlyIncome / 2;
  const householdMonthly  = breakdown.netPay + spouseMonthlyIncome;
  const householdPerCheck = householdMonthly / 2;
  const hasSpouseIncome   = spouseMonthlyIncome > 0;

  const hasOverrides = !!(
    lesOverrides.bahOverride != null ||
    lesOverrides.basOverride != null ||
    lesOverrides.basePayOverride != null ||
    lesOverrides.extraIncome.length > 0 ||
    lesOverrides.extraDeductions.length > 0
  );

  function commitSpouseIncome() {
    const parsed = parseFloat(spouseInput.replace(/[^0-9.]/g, ''));
    setSpouseMonthlyIncome(isNaN(parsed) ? 0 : Math.round(parsed));
  }

  return (
    <TacticalCard accentColor={Brand.accent} cornerSize={14} style={styles.card}>
      {/* Header bar */}
      <View style={[styles.headerBar, { backgroundColor: tc.surface, borderBottomColor: tc.borderColor }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <ThemedText type="label" style={[styles.headerLabel, { color: tc.textHint }]}>PAY STATEMENT // EST.</ThemedText>
          {hasOverrides && (
            <View style={styles.overrideBadge}>
              <ThemedText style={[styles.overrideBadgeTxt, { color: tc.accent }]}>ADJUSTED</ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="label" style={[styles.headerLabel, { color: tc.textHint }]}>FY2026</ThemedText>
      </View>

      {/* Net pay hero */}
      <View style={styles.hero}>
        <View>
          <ThemedText type="label" style={[styles.netLabel, { color: tc.textHint }]}>EST. NET / PAYCHECK</ThemedText>
          <ThemedText style={[styles.netAmount, { color: tc.accent }]}>{fmtPay(perPaycheck)}</ThemedText>
          <ThemedText style={[styles.netMonthly, { color: tc.textHint }]}>
            {fmtPay(breakdown.netPay)}<ThemedText style={[styles.netMonthlyUnit, { color: tc.textMuted }]}> / month</ThemedText>
          </ThemedText>
        </View>
        <View style={styles.heroRight}>
          <Pressable onPress={() => setExpanded((v) => !v)} style={styles.expandBtn} hitSlop={12}>
            <ThemedText style={[styles.expandIcon, { color: tc.textMuted }]}>{expanded ? '▲' : '▼'}</ThemedText>
            <ThemedText type="label" style={[styles.expandLabel, { color: tc.textMuted }]}>{expanded ? 'HIDE' : 'DETAIL'}</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setShowEdit(true)}
            style={[styles.editLesBtn, { borderColor: tc.borderColor }, hasOverrides && styles.editLesBtnActive]}>
            <ThemedText style={[styles.editLesTxt, { color: tc.textHint }, hasOverrides && { color: tc.accent }]}>
              ✎ EDIT
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Household combined bar */}
      {hasSpouseIncome && !expanded && (
        <View style={styles.householdBar}>
          <View style={styles.householdItem}>
            <ThemedText style={[styles.householdLabel, { color: tc.textMuted }]}>YOUR CHECK</ThemedText>
            <ThemedText style={[styles.householdValue, { color: tc.accent }]}>{fmtPay(perPaycheck)}</ThemedText>
          </View>
          <ThemedText style={[styles.householdPlus, { color: tc.textMuted }]}>+</ThemedText>
          <View style={styles.householdItem}>
            <ThemedText style={[styles.householdLabel, { color: tc.textMuted }]}>SPOUSE CHECK</ThemedText>
            <ThemedText style={[styles.householdValue, { color: '#208AEF' }]}>{fmtPay(spousePerPaycheck)}</ThemedText>
          </View>
          <ThemedText style={[styles.householdPlus, { color: tc.textMuted }]}>=</ThemedText>
          <View style={styles.householdItem}>
            <ThemedText style={[styles.householdLabel, { color: tc.textMuted }]}>HOUSEHOLD</ThemedText>
            <ThemedText style={[styles.householdValue, { color: tc.success }]}>{fmtPay(householdPerCheck)}</ThemedText>
          </View>
        </View>
      )}

      {/* Quick bar */}
      {!expanded && (
        <View style={[styles.quickBar, { borderTopColor: tc.borderColor }]}>
          <View style={styles.quickItem}>
            <ThemedText type="label" style={[styles.quickLabel, { color: tc.textMuted }]}>GROSS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: tc.tactical }]}>{fmtPay(breakdown.grossPay / 2)}</ThemedText>
          </View>
          <View style={[styles.quickSep, { backgroundColor: tc.borderColor }]} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={[styles.quickLabel, { color: tc.textMuted }]}>DEDUCTIONS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.danger }]}>-{fmtPay(breakdown.totalDeductions / 2)}</ThemedText>
          </View>
          <View style={[styles.quickSep, { backgroundColor: tc.borderColor }]} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={[styles.quickLabel, { color: tc.textMuted }]}>TSP</ThemedText>
            <ThemedText style={[styles.quickValue, { color: tc.accent }]}>{fmtPay(breakdown.tsp / 2)}</ThemedText>
          </View>
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />

          <ThemedText type="label" style={[styles.sectionHead, { color: tc.tactical }]}>// ENTITLEMENTS (MONTHLY)</ThemedText>
          <Row
            label={breakdown.isRetiredPay ? `RETIRED PAY (${breakdown.retiredPayPct}% OF HIGH-3)` : 'BASE PAY'}
            value={fmtPay(breakdown.basePay)} indent positive overridden={breakdown.basePayOverridden}
          />
          {/* A retiree draws no BAH/BAS (no active-duty housing/subsistence
              allowance) — hide these rows entirely unless manually overridden,
              rather than showing a confusing "$0" for something that
              structurally doesn't apply anymore. */}
          {(!breakdown.isRetiredPay || breakdown.bahOverridden) && (
            <Row label={bahLabel} value={fmtPay(breakdown.bah)} indent positive overridden={breakdown.bahOverridden} />
          )}
          {(!breakdown.isRetiredPay || breakdown.basOverridden) && (
            <Row label="BAS" value={fmtPay(breakdown.bas)} indent positive overridden={breakdown.basOverridden} />
          )}
          {breakdown.colaTracked && (
            <Row label="COLA" value={fmtPay(breakdown.cola)} indent positive />
          )}
          {breakdown.isDeployed && (
            <Row label="IMMINENT DANGER PAY (IDP)" value={fmtPay(breakdown.idp)} indent positive />
          )}
          {breakdown.familySeparated && (
            <>
              <Row label="FAMILY BAH" value={fmtPay(breakdown.familyBah)} indent positive />
              <Row label="FAMILY SEP. ALLOWANCE (FSA)" value={fmtPay(breakdown.fsa)} indent positive />
            </>
          )}
          {breakdown.alsoGsCivilian && (
            <Row label="GS CIVILIAN PAY" value={fmtPay(breakdown.gsGrossMonthly)} indent positive />
          )}
          {breakdown.specialPays > 0 && (
            <Row label="SPECIAL PAYS" value={fmtPay(breakdown.specialPays)} indent positive />
          )}
          {breakdown.extraIncomeItems.map(item => (
            <Row key={item.id} label={item.label.toUpperCase()} value={fmtPay(item.amount)} indent positive />
          ))}
          <Row label="GROSS PAY"    value={fmtPay(breakdown.grossPay)}   bold positive />

          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />

          <ThemedText type="label" style={[styles.sectionHead, { color: tc.tactical }]}>// DEDUCTIONS (MONTHLY)</ThemedText>
          <Row label="FICA (SS + MED)"  value={`-${fmtPay(breakdown.fica)}`}     indent negative />
          <Row label="FED TAX (EST.)"   value={`-${fmtPay(breakdown.fedTax)}`}   indent negative />
          {breakdown.isCzte && breakdown.czteExcluded > 0 && (
            <ThemedText type="label" style={[styles.disclaimer, { color: tc.tactical, marginTop: -Spacing.one }]}>
              ✓ COMBAT ZONE — {fmtPay(breakdown.czteExcluded)} of base pay excluded from fed/state income tax this month (FICA still applies)
            </ThemedText>
          )}
          {breakdown.stateTax > 0 && (
            <Row label="STATE TAX (EST.)" value={`-${fmtPay(breakdown.stateTax)}`} indent negative />
          )}
          {breakdown.traditionalTsp > 0 && <Row label="TSP (TRADITIONAL)" value={`-${fmtPay(breakdown.traditionalTsp)}`} indent negative />}
          {breakdown.rothTsp > 0       && <Row label="TSP (ROTH)"        value={`-${fmtPay(breakdown.rothTsp)}`}        indent negative />}
          {breakdown.tsp === 0         && <Row label="TSP CONTRIB"       value="$0"                                      indent negative />}
          {breakdown.sgli > 0  && <Row label="SGLI"          value={`-${fmtPay(breakdown.sgli)}`}   indent negative />}
          {breakdown.dental > 0 && <Row label="DENTAL (TDP)" value={`-${fmtPay(breakdown.dental)}`} indent negative />}
          {breakdown.extraDeductionItems.map(item => (
            <Row key={item.id} label={item.label.toUpperCase()} value={`-${fmtPay(item.amount)}`} indent negative />
          ))}
          <Row label="TOTAL DEDUCTIONS" value={`-${fmtPay(breakdown.totalDeductions)}`} bold negative />

          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />

          <Row label="MONTHLY NET"      value={fmtPay(breakdown.netPay)}   bold />
          <Row label="PER PAYCHECK (÷2)" value={fmtPay(perPaycheck)}        bold />

          {hasSpouseIncome && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
              <ThemedText type="label" style={[styles.sectionHead, { color: tc.tactical }]}>// HOUSEHOLD COMBINED</ThemedText>
              <Row label="YOUR NET/MO"        value={fmtPay(breakdown.netPay)}   indent positive />
              <Row label="SPOUSE INCOME/MO"   value={fmtPay(spouseMonthlyIncome)} indent positive />
              <Row label="HOUSEHOLD MONTHLY"  value={fmtPay(householdMonthly)}   bold positive />
              <Row label="HOUSEHOLD / CHECK"  value={fmtPay(householdPerCheck)}  bold />
            </>
          )}

          {breakdown.familySeparated && !breakdown.familyBahResolved && (
            <ThemedText type="label" style={[styles.disclaimer, { color: Brand.danger, marginTop: Spacing.one }]}>
              ⚠ FAMILY LOCATION NOT SET — SET IT IN PROFILE TO SEE THEIR ACTUAL BAH HERE
            </ThemedText>
          )}

          <ThemedText type="label" style={[styles.disclaimer, { color: tc.textMuted }]}>
            * ESTIMATE ONLY — VERIFY AT MYPAY.DFAS.MIL{'\n'}
            {breakdown.isRetiredPay
              ? 'RETIRED PAY EXCLUDES BAH/BAS (NOT PAID TO RETIREES). SEE VA DISABILITY BELOW FOR COMPENSATION.'
              : hasOverrides ? '✎ SOME VALUES MANUALLY ADJUSTED FROM LES' : 'SET HOME STATE IN PROFILE FOR STATE TAX ESTIMATE'}
          </ThemedText>
        </View>
      )}

      {/* Spouse income entry */}
      <Pressable onPress={() => setSpouseOpen((v) => !v)} style={[styles.spouseToggle, { borderTopColor: tc.borderColor }]}>
        <ThemedText style={styles.spouseToggleIcon}>{hasSpouseIncome ? '👫' : '+'}</ThemedText>
        <ThemedText style={[styles.spouseToggleLabel, { color: tc.textHint }]}>
          {hasSpouseIncome ? `SPOUSE INCOME: ${fmtPay(spouseMonthlyIncome)}/mo` : 'ADD SPOUSE INCOME'}
        </ThemedText>
        <ThemedText style={[styles.spouseToggleChevron, { color: tc.textMuted }]}>{spouseOpen ? '▲' : '▼'}</ThemedText>
      </Pressable>

      {spouseOpen && (
        <View style={[styles.spousePanel, { borderTopColor: tc.borderColor }]}>
          <ThemedText style={styles.spousePanelLabel}>SPOUSE MONTHLY TAKE-HOME</ThemedText>
          <View style={[styles.spouseInputRow, { backgroundColor: tc.background, borderColor: tc.borderColor }]}>
            <ThemedText style={styles.spouseDollar}>$</ThemedText>
            <TextInput
              style={[styles.spouseInput, { color: tc.textPrimary }]}
              value={spouseInput}
              onChangeText={setSpouseInput}
              onBlur={commitSpouseIncome}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={tc.textMuted}
              returnKeyType="done"
              onSubmitEditing={commitSpouseIncome}
            />
            <Pressable style={styles.spouseSaveBtn} onPress={() => { commitSpouseIncome(); setSpouseOpen(false); }}>
              <ThemedText style={styles.spouseSaveBtnText}>SAVE</ThemedText>
            </Pressable>
            {hasSpouseIncome && (
              <Pressable style={styles.spouseClearBtn} onPress={() => { setSpouseMonthlyIncome(0); setSpouseInput(''); setSpouseOpen(false); }}>
                <ThemedText style={styles.spouseClearBtnText}>CLEAR</ThemedText>
              </Pressable>
            )}
          </View>
          <ThemedText style={[styles.spousePanelNote, { color: tc.textMuted }]}>
            Enter after-tax monthly income. Used for household take-home display only.
          </ThemedText>
        </View>
      )}

      <EditPayModal visible={showEdit} onClose={() => setShowEdit(false)} />
    </TacticalCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 4 },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDot: { width: 6, height: 6, backgroundColor: Brand.accent, borderRadius: 1 },
  headerLabel: {},
  overrideBadge: {
    backgroundColor: Brand.accent + '20', borderRadius: 2,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  overrideBadgeTxt: { fontSize: 7, fontWeight: '800', letterSpacing: 1 },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two,
  },
  netLabel: { marginBottom: 4 },
  netAmount: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, fontFamily: Fonts.data },
  netMonthly: { fontSize: 12, fontWeight: '600', fontFamily: Fonts.data, marginTop: 2 },
  netMonthlyUnit: { fontSize: 10, fontWeight: '400' },

  heroRight: { alignItems: 'flex-end', gap: Spacing.one + 2 },
  expandBtn: { alignItems: 'center', gap: 2 },
  expandIcon: { fontSize: 14, lineHeight: 18 },
  expandLabel: { fontSize: 8 },
  editLesBtn: {
    borderWidth: 1, borderRadius: 3,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  editLesBtnActive: { borderColor: Brand.accent + '60' },
  editLesTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  householdBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,178,122,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.success + '30',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: 4,
  },
  householdItem: { flex: 1, alignItems: 'center', gap: 2 },
  householdLabel: { fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  householdValue: { fontSize: 13, fontWeight: '900', fontFamily: Fonts.data },
  householdPlus: { fontSize: 16, fontWeight: '300' },

  quickBar: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 3 },
  quickSep: { width: StyleSheet.hairlineWidth },
  quickLabel: { fontSize: 8 },
  quickValue: { fontSize: 14, fontWeight: '700', fontFamily: Fonts.data },

  detail: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.two },
  sectionHead: { marginBottom: Spacing.one, fontSize: 9 },
  disclaimer: { fontSize: 8, lineHeight: 12, marginTop: Spacing.two, letterSpacing: 0.8 },

  spouseToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  spouseToggleIcon: { fontSize: 14, lineHeight: 18 },
  spouseToggleLabel: { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  spouseToggleChevron: { fontSize: 10 },

  spousePanel: {
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(32,138,239,0.04)',
  },
  spousePanelLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2, color: '#208AEF', marginTop: Spacing.two },
  spouseInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 3, paddingHorizontal: Spacing.two, paddingVertical: 6,
  },
  spouseDollar: { fontSize: 16, color: '#208AEF', fontWeight: '700' },
  spouseInput: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: Fonts.data, padding: 0 },
  spouseSaveBtn: { backgroundColor: '#208AEF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3 },
  spouseSaveBtnText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  spouseClearBtn: { borderWidth: 1, borderColor: Brand.danger, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 3 },
  spouseClearBtnText: { fontSize: 10, fontWeight: '800', color: Brand.danger, letterSpacing: 0.5 },
  spousePanelNote: { fontSize: 9, lineHeight: 13 },
});
