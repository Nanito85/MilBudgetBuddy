import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { LESBreakdown, fmtPay } from '@/features/home/utils/lesCalc';
import { LESLineItem, LESOverrides } from '@/types/user.types';
import { useUserStore } from '@/store/user.store';

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
  const valueColor = positive ? Brand.tactical : negative ? Brand.danger : '#C8D8E8';
  return (
    <View style={[rowStyles.row, indent && rowStyles.indent]}>
      <ThemedText style={[rowStyles.label, bold && rowStyles.labelBold, indent && rowStyles.labelDim]}>
        {label}{overridden ? ' ✎' : ''}
      </ThemedText>
      <View style={rowStyles.dotLine} />
      <ThemedText style={[rowStyles.value, bold && rowStyles.valueBold, { color: valueColor }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 4 },
  indent: { paddingLeft: Spacing.two },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: '#7A9AB5', minWidth: 120 },
  labelBold: { color: '#C8D8E8', fontWeight: '700', fontSize: 12 },
  labelDim: { opacity: 0.7 },
  dotLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(26,58,92,0.6)', marginBottom: 1 },
  value: { fontSize: 13, fontWeight: '700', fontFamily: Fonts.data, letterSpacing: 0.5 },
  valueBold: { fontSize: 14 },
});

// ── LES Override Modal ────────────────────────────────────────────────────────

function OverrideModal({
  visible,
  overrides,
  onSave,
  onClose,
}: {
  visible: boolean;
  overrides: LESOverrides;
  onSave: (o: LESOverrides) => void;
  onClose: () => void;
}) {
  const [bahInput,     setBahInput]     = useState(overrides.bahOverride     != null ? String(overrides.bahOverride)     : '');
  const [basInput,     setBasInput]     = useState(overrides.basOverride     != null ? String(overrides.basOverride)     : '');
  const [bpInput,      setBpInput]      = useState(overrides.basePayOverride != null ? String(overrides.basePayOverride) : '');

  const [extraIncome,      setExtraIncome]      = useState<LESLineItem[]>(overrides.extraIncome);
  const [extraDeductions,  setExtraDeductions]  = useState<LESLineItem[]>(overrides.extraDeductions);

  const [newIncomeLabel,  setNewIncomeLabel]  = useState('');
  const [newIncomeAmt,    setNewIncomeAmt]    = useState('');
  const [newDeductLabel,  setNewDeductLabel]  = useState('');
  const [newDeductAmt,    setNewDeductAmt]    = useState('');

  function save() {
    const bah = parseFloat(bahInput);
    const bas = parseFloat(basInput);
    const bp  = parseFloat(bpInput);
    onSave({
      bahOverride:      !isNaN(bah) && bahInput.trim() ? bah : undefined,
      basOverride:      !isNaN(bas) && basInput.trim() ? bas : undefined,
      basePayOverride:  !isNaN(bp)  && bpInput.trim()  ? bp  : undefined,
      extraIncome,
      extraDeductions,
    });
    onClose();
  }

  function addIncome() {
    const amt = parseFloat(newIncomeAmt);
    if (!newIncomeLabel.trim() || isNaN(amt) || amt <= 0) return;
    setExtraIncome([...extraIncome, { id: `${Date.now()}`, label: newIncomeLabel.trim(), amount: amt }]);
    setNewIncomeLabel(''); setNewIncomeAmt('');
    Keyboard.dismiss();
  }

  function addDeduction() {
    const amt = parseFloat(newDeductAmt);
    if (!newDeductLabel.trim() || isNaN(amt) || amt <= 0) return;
    setExtraDeductions([...extraDeductions, { id: `${Date.now()}`, label: newDeductLabel.trim(), amount: amt }]);
    setNewDeductLabel(''); setNewDeductAmt('');
    Keyboard.dismiss();
  }

  function removeIncome(id: string) {
    setExtraIncome(extraIncome.filter(i => i.id !== id));
  }
  function removeDeduction(id: string) {
    setExtraDeductions(extraDeductions.filter(i => i.id !== id));
  }

  function clearAll() {
    Alert.alert('Clear All Overrides', 'Remove all LES adjustments and return to calculated values?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => {
        setBahInput(''); setBasInput(''); setBpInput('');
        setExtraIncome([]); setExtraDeductions([]);
      }},
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#04080F' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={mStyles.header}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <ThemedText style={mStyles.cancel}>CANCEL</ThemedText>
            </Pressable>
            <ThemedText style={mStyles.title}>// EDIT YOUR LES</ThemedText>
            <Pressable onPress={save}>
              <ThemedText style={mStyles.saveBtn}>SAVE</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={mStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <ThemedText style={mStyles.intro}>
              Override calculated values with your actual LES amounts. Leave blank to use the app's estimate. All amounts are monthly.
            </ThemedText>

            {/* ── Entitlement Overrides ── */}
            <ThemedText style={mStyles.sectionLabel}>ENTITLEMENT OVERRIDES</ThemedText>

            <ThemedText style={mStyles.fieldLabel}>BASE PAY (monthly)</ThemedText>
            <View style={mStyles.inputRow}>
              <ThemedText style={mStyles.dollar}>$</ThemedText>
              <TextInput
                style={mStyles.input}
                value={bpInput}
                onChangeText={setBpInput}
                placeholder="Calculated (leave blank)"
                placeholderTextColor="#2A4A60"
                keyboardType="decimal-pad"
              />
              {bpInput ? <Pressable onPress={() => setBpInput('')}><ThemedText style={mStyles.clearX}>✕</ThemedText></Pressable> : null}
            </View>

            <ThemedText style={mStyles.fieldLabel}>BAH (monthly)</ThemedText>
            <View style={mStyles.inputRow}>
              <ThemedText style={mStyles.dollar}>$</ThemedText>
              <TextInput
                style={mStyles.input}
                value={bahInput}
                onChangeText={setBahInput}
                placeholder="Calculated (leave blank)"
                placeholderTextColor="#2A4A60"
                keyboardType="decimal-pad"
              />
              {bahInput ? <Pressable onPress={() => setBahInput('')}><ThemedText style={mStyles.clearX}>✕</ThemedText></Pressable> : null}
            </View>

            <ThemedText style={mStyles.fieldLabel}>BAS (monthly)</ThemedText>
            <View style={mStyles.inputRow}>
              <ThemedText style={mStyles.dollar}>$</ThemedText>
              <TextInput
                style={mStyles.input}
                value={basInput}
                onChangeText={setBasInput}
                placeholder="Calculated (leave blank)"
                placeholderTextColor="#2A4A60"
                keyboardType="decimal-pad"
              />
              {basInput ? <Pressable onPress={() => setBasInput('')}><ThemedText style={mStyles.clearX}>✕</ThemedText></Pressable> : null}
            </View>

            {/* ── Extra Income ── */}
            <ThemedText style={mStyles.sectionLabel}>ADDITIONAL INCOME</ThemedText>
            <ThemedText style={mStyles.hint}>OHA, Clothing Allowance, COLA, FSA, Hardship Duty Pay, etc.</ThemedText>

            {extraIncome.map(item => (
              <View key={item.id} style={mStyles.lineItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={mStyles.lineItemLabel}>{item.label}</ThemedText>
                  <ThemedText style={[mStyles.lineItemAmt, { color: Brand.tactical }]}>${item.amount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => removeIncome(item.id)} style={mStyles.removeBtn}>
                  <ThemedText style={mStyles.removeTxt}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={mStyles.addBlock}>
              <TextInput
                style={mStyles.addLabelInput}
                value={newIncomeLabel}
                onChangeText={setNewIncomeLabel}
                placeholder="Label (e.g. OHA, COLA)"
                placeholderTextColor="#2A4A60"
                autoCapitalize="words"
              />
              <View style={mStyles.addAmtRow}>
                <ThemedText style={mStyles.dollar}>$</ThemedText>
                <TextInput
                  style={[mStyles.input, { flex: 1 }]}
                  value={newIncomeAmt}
                  onChangeText={setNewIncomeAmt}
                  placeholder="Monthly amount"
                  placeholderTextColor="#2A4A60"
                  keyboardType="decimal-pad"
                />
                <Pressable
                  onPress={addIncome}
                  style={[mStyles.addBtn, { backgroundColor: Brand.tactical }]}>
                  <ThemedText style={mStyles.addBtnTxt}>ADD</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* ── Extra Deductions ── */}
            <ThemedText style={mStyles.sectionLabel}>ADDITIONAL DEDUCTIONS</ThemedText>
            <ThemedText style={mStyles.hint}>BOP, allotments, AAFES debt, vision plan, Servicemembers Group, etc.</ThemedText>

            {extraDeductions.map(item => (
              <View key={item.id} style={mStyles.lineItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={mStyles.lineItemLabel}>{item.label}</ThemedText>
                  <ThemedText style={[mStyles.lineItemAmt, { color: Brand.danger }]}>-${item.amount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => removeDeduction(item.id)} style={mStyles.removeBtn}>
                  <ThemedText style={mStyles.removeTxt}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={mStyles.addBlock}>
              <TextInput
                style={mStyles.addLabelInput}
                value={newDeductLabel}
                onChangeText={setNewDeductLabel}
                placeholder="Label (e.g. BOP, Allotment)"
                placeholderTextColor="#2A4A60"
                autoCapitalize="words"
              />
              <View style={mStyles.addAmtRow}>
                <ThemedText style={mStyles.dollar}>$</ThemedText>
                <TextInput
                  style={[mStyles.input, { flex: 1 }]}
                  value={newDeductAmt}
                  onChangeText={setNewDeductAmt}
                  placeholder="Monthly amount"
                  placeholderTextColor="#2A4A60"
                  keyboardType="decimal-pad"
                />
                <Pressable
                  onPress={addDeduction}
                  style={[mStyles.addBtn, { backgroundColor: Brand.danger }]}>
                  <ThemedText style={mStyles.addBtnTxt}>ADD</ThemedText>
                </Pressable>
              </View>
            </View>

            <Pressable onPress={clearAll} style={mStyles.clearAllBtn}>
              <ThemedText style={mStyles.clearAllTxt}>CLEAR ALL OVERRIDES</ThemedText>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border,
  },
  title: { fontSize: 13, fontWeight: '800', color: '#C8D8E8', letterSpacing: 1 },
  cancel: { fontSize: 12, fontWeight: '700', color: '#3D6080', letterSpacing: 0.5 },
  saveBtn: { fontSize: 13, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },

  scroll: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 60 },
  intro: { fontSize: 12, color: '#4D7A9A', lineHeight: 18 },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: Brand.tactical,
    letterSpacing: 1.5, marginTop: Spacing.two,
  },
  hint: { fontSize: 11, color: '#3D6080', lineHeight: 16, marginTop: -Spacing.one },

  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#4D7A9A', letterSpacing: 0.5 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border,
    borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 6,
  },
  dollar: { fontSize: 16, fontWeight: '700', color: '#4D7A9A' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#C8D8E8', padding: 0 },
  clearX: { fontSize: 14, color: '#3D6080', paddingHorizontal: 4 },

  lineItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#080E1C', borderRadius: 4,
    borderWidth: 1, borderColor: Brand.border,
    padding: Spacing.two,
  },
  lineItemLabel: { fontSize: 13, fontWeight: '600', color: '#C8D8E8' },
  lineItemAmt: { fontSize: 11, fontWeight: '700', fontFamily: Fonts.data, marginTop: 2 },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Brand.classified + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  removeTxt: { color: Brand.classified, fontSize: 13, fontWeight: '700' },

  addBlock: { gap: Spacing.one + 2 },
  addLabelInput: {
    backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border,
    borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 8,
    fontSize: 14, color: '#C8D8E8',
  },
  addAmtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  addBtn: { paddingHorizontal: Spacing.two + 4, paddingVertical: 8, borderRadius: 4 },
  addBtnTxt: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 0.5 },

  clearAllBtn: { marginTop: Spacing.three, alignItems: 'center', padding: Spacing.two },
  clearAllTxt: { fontSize: 11, fontWeight: '700', color: Brand.classified, letterSpacing: 1 },
});

// ── Main Card ─────────────────────────────────────────────────────────────────

interface Props {
  breakdown: LESBreakdown;
}

export function PaySummaryCard({ breakdown }: Props) {
  const [expanded,   setExpanded]   = useState(false);
  const [spouseOpen, setSpouseOpen] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);

  const lesOverrides        = useUserStore((s) => s.lesOverrides);
  const setLesOverrides     = useUserStore((s) => s.setLesOverrides);
  const spouseMonthlyIncome = useUserStore((s) => s.spouseMonthlyIncome);
  const setSpouseMonthlyIncome = useUserStore((s) => s.setSpouseMonthlyIncome);

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
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <ThemedText type="label" style={styles.headerLabel}>PAY STATEMENT // EST.</ThemedText>
          {hasOverrides && (
            <View style={styles.overrideBadge}>
              <ThemedText style={styles.overrideBadgeTxt}>ADJUSTED</ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="label" style={styles.headerLabel}>FY2026</ThemedText>
      </View>

      {/* Net pay hero */}
      <View style={styles.hero}>
        <View>
          <ThemedText type="label" style={styles.netLabel}>EST. NET / PAYCHECK</ThemedText>
          <ThemedText style={styles.netAmount}>{fmtPay(perPaycheck)}</ThemedText>
          <ThemedText style={styles.netMonthly}>
            {fmtPay(breakdown.netPay)}<ThemedText style={styles.netMonthlyUnit}> / month</ThemedText>
          </ThemedText>
        </View>
        <View style={styles.heroRight}>
          <Pressable onPress={() => setExpanded((v) => !v)} style={styles.expandBtn} hitSlop={12}>
            <ThemedText style={styles.expandIcon}>{expanded ? '▲' : '▼'}</ThemedText>
            <ThemedText type="label" style={styles.expandLabel}>{expanded ? 'HIDE' : 'DETAIL'}</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setShowEdit(true)}
            style={[styles.editLesBtn, hasOverrides && styles.editLesBtnActive]}>
            <ThemedText style={[styles.editLesTxt, hasOverrides && { color: Brand.accent }]}>
              ✎ EDIT
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Household combined bar */}
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
            <ThemedText type="label" style={styles.quickLabel}>10% SAVINGS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.success }]}>{fmtPay(breakdown.netPay * 0.10 / 2)}</ThemedText>
          </View>
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <View style={styles.divider} />

          <ThemedText type="label" style={styles.sectionHead}>// ENTITLEMENTS (MONTHLY)</ThemedText>
          <Row label="BASE PAY"     value={fmtPay(breakdown.basePay)}    indent positive overridden={breakdown.basePayOverridden} />
          <Row label="BAH"          value={fmtPay(breakdown.bah)}         indent positive overridden={breakdown.bahOverridden} />
          <Row label="BAS"          value={fmtPay(breakdown.bas)}         indent positive overridden={breakdown.basOverridden} />
          {breakdown.specialPays > 0 && (
            <Row label="SPECIAL PAYS" value={fmtPay(breakdown.specialPays)} indent positive />
          )}
          {breakdown.extraIncomeItems.map(item => (
            <Row key={item.id} label={item.label.toUpperCase()} value={fmtPay(item.amount)} indent positive />
          ))}
          <Row label="GROSS PAY"    value={fmtPay(breakdown.grossPay)}   bold positive />

          <View style={styles.divider} />

          <ThemedText type="label" style={styles.sectionHead}>// DEDUCTIONS (MONTHLY)</ThemedText>
          <Row label="FICA (SS + MED)"  value={`-${fmtPay(breakdown.fica)}`}     indent negative />
          <Row label="FED TAX (EST.)"   value={`-${fmtPay(breakdown.fedTax)}`}   indent negative />
          {breakdown.stateTax > 0 && (
            <Row label="STATE TAX (EST.)" value={`-${fmtPay(breakdown.stateTax)}`} indent negative />
          )}
          <Row label="TSP CONTRIB"      value={`-${fmtPay(breakdown.tsp)}`}      indent negative />
          {breakdown.sgli > 0  && <Row label="SGLI"          value={`-${fmtPay(breakdown.sgli)}`}   indent negative />}
          {breakdown.dental > 0 && <Row label="DENTAL (TDP)" value={`-${fmtPay(breakdown.dental)}`} indent negative />}
          {breakdown.extraDeductionItems.map(item => (
            <Row key={item.id} label={item.label.toUpperCase()} value={`-${fmtPay(item.amount)}`} indent negative />
          ))}
          <Row label="TOTAL DEDUCTIONS" value={`-${fmtPay(breakdown.totalDeductions)}`} bold negative />

          <View style={styles.divider} />

          <Row label="MONTHLY NET"      value={fmtPay(breakdown.netPay)}   bold />
          <Row label="PER PAYCHECK (÷2)" value={fmtPay(perPaycheck)}        bold />

          {hasSpouseIncome && (
            <>
              <View style={styles.divider} />
              <ThemedText type="label" style={styles.sectionHead}>// HOUSEHOLD COMBINED</ThemedText>
              <Row label="YOUR NET/MO"        value={fmtPay(breakdown.netPay)}   indent positive />
              <Row label="SPOUSE INCOME/MO"   value={fmtPay(spouseMonthlyIncome)} indent positive />
              <Row label="HOUSEHOLD MONTHLY"  value={fmtPay(householdMonthly)}   bold positive />
              <Row label="HOUSEHOLD / CHECK"  value={fmtPay(householdPerCheck)}  bold />
            </>
          )}

          <ThemedText type="label" style={styles.disclaimer}>
            * ESTIMATE ONLY — VERIFY AT MYPAY.DFAS.MIL{'\n'}
            {hasOverrides ? '✎ SOME VALUES MANUALLY ADJUSTED FROM LES' : 'SET HOME STATE IN PROFILE FOR STATE TAX ESTIMATE'}
          </ThemedText>
        </View>
      )}

      {/* Spouse income entry */}
      <Pressable onPress={() => setSpouseOpen((v) => !v)} style={styles.spouseToggle}>
        <ThemedText style={styles.spouseToggleIcon}>{hasSpouseIncome ? '👫' : '+'}</ThemedText>
        <ThemedText style={styles.spouseToggleLabel}>
          {hasSpouseIncome ? `SPOUSE INCOME: ${fmtPay(spouseMonthlyIncome)}/mo` : 'ADD SPOUSE INCOME'}
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
            <Pressable style={styles.spouseSaveBtn} onPress={() => { commitSpouseIncome(); setSpouseOpen(false); }}>
              <ThemedText style={styles.spouseSaveBtnText}>SAVE</ThemedText>
            </Pressable>
            {hasSpouseIncome && (
              <Pressable style={styles.spouseClearBtn} onPress={() => { setSpouseMonthlyIncome(0); setSpouseInput(''); setSpouseOpen(false); }}>
                <ThemedText style={styles.spouseClearBtnText}>CLEAR</ThemedText>
              </Pressable>
            )}
          </View>
          <ThemedText style={styles.spousePanelNote}>
            Enter after-tax monthly income. Used for household take-home display only.
          </ThemedText>
        </View>
      )}

      <OverrideModal
        visible={showEdit}
        overrides={lesOverrides}
        onSave={setLesOverrides}
        onClose={() => setShowEdit(false)}
      />
    </TacticalCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 4 },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(26,58,92,0.4)',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDot: { width: 6, height: 6, backgroundColor: Brand.accent, borderRadius: 1 },
  headerLabel: { color: '#4D7A9A' },
  overrideBadge: {
    backgroundColor: Brand.accent + '20', borderRadius: 2,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  overrideBadgeTxt: { fontSize: 7, fontWeight: '800', color: Brand.accent, letterSpacing: 1 },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two,
  },
  netLabel: { color: '#4D7A9A', marginBottom: 4 },
  netAmount: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: Brand.accent, fontFamily: Fonts.data },
  netMonthly: { fontSize: 12, fontWeight: '600', color: '#4D7A9A', fontFamily: Fonts.data, marginTop: 2 },
  netMonthlyUnit: { fontSize: 10, fontWeight: '400', color: '#3D6080' },

  heroRight: { alignItems: 'flex-end', gap: Spacing.one + 2 },
  expandBtn: { alignItems: 'center', gap: 2 },
  expandIcon: { fontSize: 14, color: '#3D6080' },
  expandLabel: { color: '#3D6080', fontSize: 8 },
  editLesBtn: {
    borderWidth: 1, borderColor: Brand.border, borderRadius: 3,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  editLesBtnActive: { borderColor: Brand.accent + '60' },
  editLesTxt: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 0.5 },

  householdBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,178,122,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.success + '30',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: 4,
  },
  householdItem: { flex: 1, alignItems: 'center', gap: 2 },
  householdLabel: { fontSize: 7, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8 },
  householdValue: { fontSize: 13, fontWeight: '900', fontFamily: Fonts.data },
  householdPlus: { fontSize: 16, color: '#3D6080', fontWeight: '300' },

  quickBar: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border, paddingVertical: Spacing.two,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 3 },
  quickSep: { width: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  quickLabel: { color: '#3D6080', fontSize: 8 },
  quickValue: { fontSize: 14, fontWeight: '700', fontFamily: Fonts.data },

  detail: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border, marginVertical: Spacing.two },
  sectionHead: { color: Brand.tactical, marginBottom: Spacing.one, fontSize: 9 },
  disclaimer: { color: '#2A4A60', fontSize: 8, lineHeight: 12, marginTop: Spacing.two, letterSpacing: 0.8 },

  spouseToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  spouseToggleIcon: { fontSize: 14 },
  spouseToggleLabel: { flex: 1, fontSize: 10, fontWeight: '700', color: '#4D7A9A', letterSpacing: 0.5 },
  spouseToggleChevron: { fontSize: 10, color: '#3D6080' },

  spousePanel: {
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border,
    backgroundColor: 'rgba(32,138,239,0.04)',
  },
  spousePanelLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2, color: '#208AEF', marginTop: Spacing.two },
  spouseInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: '#04080F', borderWidth: 1, borderColor: Brand.border,
    borderRadius: 3, paddingHorizontal: Spacing.two, paddingVertical: 6,
  },
  spouseDollar: { fontSize: 16, color: '#208AEF', fontWeight: '700' },
  spouseInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#C8D8E8', fontFamily: Fonts.data, padding: 0 },
  spouseSaveBtn: { backgroundColor: '#208AEF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3 },
  spouseSaveBtnText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  spouseClearBtn: { borderWidth: 1, borderColor: Brand.danger, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 3 },
  spouseClearBtnText: { fontSize: 10, fontWeight: '800', color: Brand.danger, letterSpacing: 0.5 },
  spousePanelNote: { fontSize: 9, color: '#3D6080', lineHeight: 13 },
});
