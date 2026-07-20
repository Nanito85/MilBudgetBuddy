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
import { LESLineItem, LESOverrides, SPECIAL_PAY_LABELS, SPECIAL_PAY_RANGES, SpecialPay, SpecialPayType } from '@/types/user.types';
import { useUserStore } from '@/store/user.store';
import { useThemeColors } from '@/hooks/use-theme';

const SPECIAL_PAY_TYPES = Object.keys(SPECIAL_PAY_LABELS) as SpecialPayType[];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

// ── LES Override Modal ────────────────────────────────────────────────────────

function OverrideModal({
  overrides,
  breakdown,
  specialPays,
  onAddSpecialPay,
  onRemoveSpecialPay,
  onSave,
  onClose,
}: {
  overrides: LESOverrides;
  breakdown: LESBreakdown;
  specialPays: SpecialPay[];
  onAddSpecialPay: (type: SpecialPayType, amount: number) => void;
  onRemoveSpecialPay: (id: string) => void;
  onSave: (o: LESOverrides) => void;
  onClose: () => void;
}) {
  const tc = useThemeColors();
  // Pre-fill with current resolved values so user can see & edit what's showing
  const [bahInput, setBahInput] = useState(
    overrides.bahOverride != null ? String(overrides.bahOverride) : String(Math.round(breakdown.bah)),
  );
  const [basInput, setBasInput] = useState(
    overrides.basOverride != null ? String(overrides.basOverride) : String(Math.round(breakdown.bas)),
  );
  const [bpInput, setBpInput] = useState(
    overrides.basePayOverride != null ? String(overrides.basePayOverride) : String(Math.round(breakdown.basePay)),
  );

  const [extraIncome,      setExtraIncome]      = useState<LESLineItem[]>(overrides.extraIncome);
  const [extraDeductions,  setExtraDeductions]  = useState<LESLineItem[]>(overrides.extraDeductions);

  const [newIncomeLabel,  setNewIncomeLabel]  = useState('');
  const [newIncomeAmt,    setNewIncomeAmt]    = useState('');
  const [newDeductLabel,  setNewDeductLabel]  = useState('');
  const [newDeductAmt,    setNewDeductAmt]    = useState('');

  const [selectedPayType, setSelectedPayType] = useState<SpecialPayType>('language');
  const [newPayAmt,       setNewPayAmt]       = useState('');

  function parseAmount(raw: string): number {
    return parseFloat(raw.replace(',', '.').trim());
  }

  function save() {
    const bah = parseFloat(bahInput);
    const bas = parseFloat(basInput);
    const bp  = parseFloat(bpInput);
    // Only store as override if the value meaningfully differs from the calculated value
    const bahDiffers = !isNaN(bah) && Math.abs(bah - breakdown.bah) > 0.5;
    const basDiffers = !isNaN(bas) && Math.abs(bas - breakdown.bas) > 0.5;
    const bpDiffers  = !isNaN(bp)  && Math.abs(bp  - breakdown.basePay) > 0.5;
    onSave({
      bahOverride:     bahDiffers ? bah : overrides.bahOverride,
      basOverride:     basDiffers ? bas : overrides.basOverride,
      basePayOverride: bpDiffers  ? bp  : overrides.basePayOverride,
      extraIncome,
      extraDeductions,
    });
    onClose();
  }

  function addIncome() {
    const amt = parseAmount(newIncomeAmt);
    if (!newIncomeLabel.trim() || isNaN(amt) || amt <= 0) return;
    setExtraIncome([...extraIncome, { id: makeId(), label: newIncomeLabel.trim(), amount: amt }]);
    setNewIncomeLabel(''); setNewIncomeAmt('');
    Keyboard.dismiss();
  }

  function addDeduction() {
    const amt = parseAmount(newDeductAmt);
    if (!newDeductLabel.trim() || isNaN(amt) || amt <= 0) return;
    setExtraDeductions([...extraDeductions, { id: makeId(), label: newDeductLabel.trim(), amount: amt }]);
    setNewDeductLabel(''); setNewDeductAmt('');
    Keyboard.dismiss();
  }

  function removeIncome(id: string) {
    setExtraIncome(extraIncome.filter(i => i.id !== id));
  }
  function removeDeduction(id: string) {
    setExtraDeductions(extraDeductions.filter(i => i.id !== id));
  }

  function addSpecialPay() {
    const amt = parseAmount(newPayAmt);
    if (isNaN(amt) || amt <= 0) return;
    onAddSpecialPay(selectedPayType, amt);
    setNewPayAmt('');
    Keyboard.dismiss();
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
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tc.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={[mStyles.header, { borderBottomColor: tc.borderColor }]}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <ThemedText style={[mStyles.cancel, { color: tc.textMuted }]}>CANCEL</ThemedText>
            </Pressable>
            <ThemedText style={[mStyles.title, { color: tc.textPrimary }]}>// EDIT YOUR LES</ThemedText>
            <Pressable onPress={save}>
              <ThemedText style={mStyles.saveBtn}>SAVE</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={mStyles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets>

            {/* LES annotation tip */}
            <View style={mStyles.lesTip}>
              <ThemedText style={mStyles.lesTipTitle}>📋 HOW TO USE YOUR LES</ThemedText>
              <ThemedText style={[mStyles.lesTipBody, { color: tc.textHint }]}>
                Open your LES at <ThemedText style={mStyles.lesTipLink}>MyPay.DFAS.mil</ThemedText> and compare each section below. Values are pre-filled from the app's estimate — update any that differ from your actual LES.
              </ThemedText>
            </View>

            {/* ── Entitlement Overrides ── */}
            <ThemedText style={mStyles.sectionLabel}>ENTITLEMENTS (from LES block 3–7)</ThemedText>
            <ThemedText style={[mStyles.hint, { color: tc.textMuted }]}>Pre-filled from app estimate. Tap ✕ to reset to calculated value.</ThemedText>

            <ThemedText style={[mStyles.fieldLabel, { color: tc.textHint }]}>BASE PAY (monthly)</ThemedText>
            <View style={[mStyles.inputRow, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <ThemedText style={[mStyles.dollar, { color: tc.textHint }]}>$</ThemedText>
              <TextInput
                style={[mStyles.input, { color: tc.textPrimary }]}
                value={bpInput}
                onChangeText={setBpInput}
                placeholder="0"
                placeholderTextColor={tc.textMuted}
                keyboardType="decimal-pad"
              />
              {bpInput ? <Pressable onPress={() => setBpInput('')}><ThemedText style={[mStyles.clearX, { color: tc.textMuted }]}>✕</ThemedText></Pressable> : null}
            </View>

            <ThemedText style={[mStyles.fieldLabel, { color: tc.textHint }]}>BAH (monthly)</ThemedText>
            <View style={[mStyles.inputRow, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <ThemedText style={[mStyles.dollar, { color: tc.textHint }]}>$</ThemedText>
              <TextInput
                style={[mStyles.input, { color: tc.textPrimary }]}
                value={bahInput}
                onChangeText={setBahInput}
                placeholder="0"
                placeholderTextColor={tc.textMuted}
                keyboardType="decimal-pad"
              />
              {bahInput ? <Pressable onPress={() => setBahInput('')}><ThemedText style={[mStyles.clearX, { color: tc.textMuted }]}>✕</ThemedText></Pressable> : null}
            </View>

            <ThemedText style={[mStyles.fieldLabel, { color: tc.textHint }]}>BAS (monthly)</ThemedText>
            <View style={[mStyles.inputRow, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <ThemedText style={[mStyles.dollar, { color: tc.textHint }]}>$</ThemedText>
              <TextInput
                style={[mStyles.input, { color: tc.textPrimary }]}
                value={basInput}
                onChangeText={setBasInput}
                placeholder="0"
                placeholderTextColor={tc.textMuted}
                keyboardType="decimal-pad"
              />
              {basInput ? <Pressable onPress={() => setBasInput('')}><ThemedText style={[mStyles.clearX, { color: tc.textMuted }]}>✕</ThemedText></Pressable> : null}
            </View>

            {/* ── Special Pay ── */}
            <ThemedText style={mStyles.sectionLabel}>SPECIAL PAY</ThemedText>
            <ThemedText style={[mStyles.hint, { color: tc.textMuted }]}>
              Language pay, flight pay, jump pay, hazard duty, sea pay, hostile fire, and more. These
              show up in your Profile too — either screen edits the same list.
            </ThemedText>

            {specialPays.map(pay => (
              <View key={pay.id} style={[mStyles.lineItem, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[mStyles.lineItemLabel, { color: tc.textPrimary }]}>
                    {pay.customLabel ?? SPECIAL_PAY_LABELS[pay.type]}
                  </ThemedText>
                  <ThemedText style={[mStyles.lineItemAmt, { color: Brand.tactical }]}>${pay.monthlyAmount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => onRemoveSpecialPay(pay.id)} style={mStyles.removeBtn}>
                  <ThemedText style={mStyles.removeTxt}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={mStyles.addBlock}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mStyles.payTypeRow}>
                {SPECIAL_PAY_TYPES.map(type => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedPayType(type)}
                    style={[mStyles.payTypeChip, { borderColor: tc.borderColor }, selectedPayType === type && mStyles.payTypeChipActive]}>
                    <ThemedText style={[mStyles.payTypeChipTxt, { color: tc.textHint }, selectedPayType === type && mStyles.payTypeChipTxtActive]}>
                      {SPECIAL_PAY_LABELS[type]}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              <ThemedText style={[mStyles.hint, { color: tc.textMuted, marginTop: 0 }]}>
                Typical: {SPECIAL_PAY_RANGES[selectedPayType]}
              </ThemedText>
              <View style={mStyles.addAmtRow}>
                <ThemedText style={[mStyles.dollar, { color: tc.textHint }]}>$</ThemedText>
                <TextInput
                  style={[mStyles.input, { flex: 1, color: tc.textPrimary }]}
                  value={newPayAmt}
                  onChangeText={setNewPayAmt}
                  placeholder="Monthly amount"
                  placeholderTextColor={tc.textMuted}
                  keyboardType="decimal-pad"
                />
                <Pressable
                  onPress={addSpecialPay}
                  style={[mStyles.addBtn, { backgroundColor: Brand.tactical }]}>
                  <ThemedText style={mStyles.addBtnTxt}>ADD</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* ── Extra Income ── */}
            <ThemedText style={mStyles.sectionLabel}>ADDITIONAL INCOME (LES block 3–18)</ThemedText>
            <ThemedText style={[mStyles.hint, { color: tc.textMuted }]}>Add entitlements from your LES not listed above: OHA, Clothing Allowance, COLA, FSA, Hardship Duty Pay, Family Sep, etc.</ThemedText>

            {extraIncome.map(item => (
              <View key={item.id} style={[mStyles.lineItem, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[mStyles.lineItemLabel, { color: tc.textPrimary }]}>{item.label}</ThemedText>
                  <ThemedText style={[mStyles.lineItemAmt, { color: Brand.tactical }]}>${item.amount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => removeIncome(item.id)} style={mStyles.removeBtn}>
                  <ThemedText style={mStyles.removeTxt}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={mStyles.addBlock}>
              <TextInput
                style={[mStyles.addLabelInput, { backgroundColor: tc.surface, borderColor: tc.borderColor, color: tc.textPrimary }]}
                value={newIncomeLabel}
                onChangeText={setNewIncomeLabel}
                placeholder="Label (e.g. OHA, COLA)"
                placeholderTextColor={tc.textMuted}
                autoCapitalize="words"
              />
              <View style={mStyles.addAmtRow}>
                <ThemedText style={[mStyles.dollar, { color: tc.textHint }]}>$</ThemedText>
                <TextInput
                  style={[mStyles.input, { flex: 1, color: tc.textPrimary }]}
                  value={newIncomeAmt}
                  onChangeText={setNewIncomeAmt}
                  placeholder="Monthly amount"
                  placeholderTextColor={tc.textMuted}
                  keyboardType="decimal-pad"
                />
                <Pressable
                  onPress={addIncome}
                  style={[mStyles.addBtn, { backgroundColor: Brand.tactical }]}>
                  <ThemedText style={mStyles.addBtnTxt}>ADD</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* ── Calculated Deductions Reference ── */}
            <ThemedText style={mStyles.sectionLabel}>DEDUCTIONS REFERENCE (LES block 19–24)</ThemedText>
            <ThemedText style={[mStyles.hint, { color: tc.textMuted }]}>
              App estimates shown below. Cross-reference with your LES "DEDUCTIONS" column. To set TSP %, go to Profile → Edit Pay.
            </ThemedText>
            <View style={[mStyles.refTable, { backgroundColor: tc.background, borderColor: tc.borderColor }]}>
              <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>FICA (Soc Security + Medicare)</ThemedText>
                <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.fica)}/mo</ThemedText>
              </View>
              <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>Federal Income Tax (est.)</ThemedText>
                <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.fedTax)}/mo</ThemedText>
              </View>
              {breakdown.stateTax > 0 && (
                <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>State Income Tax (est.)</ThemedText>
                  <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.stateTax)}/mo</ThemedText>
                </View>
              )}
              {breakdown.traditionalTsp > 0 && (
                <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>Traditional TSP</ThemedText>
                  <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.traditionalTsp)}/mo</ThemedText>
                </View>
              )}
              {breakdown.rothTsp > 0 && (
                <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>Roth TSP</ThemedText>
                  <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.rothTsp)}/mo</ThemedText>
                </View>
              )}
              {breakdown.tsp === 0 && (
                <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>TSP (set in Profile)</ThemedText>
                  <ThemedText style={[mStyles.refValue, { color: tc.textMuted }]}>$0/mo</ThemedText>
                </View>
              )}
              {breakdown.sgli > 0 && (
                <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>SGLI Premium ($500k)</ThemedText>
                  <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.sgli)}/mo</ThemedText>
                </View>
              )}
              {breakdown.dental > 0 && (
                <View style={[mStyles.refRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[mStyles.refLabel, { color: tc.textHint }]}>Dental (TDP Family)</ThemedText>
                  <ThemedText style={[mStyles.refValue, { color: Brand.danger }]}>-{fmtPay(breakdown.dental)}/mo</ThemedText>
                </View>
              )}
            </View>

            {/* ── Extra Deductions ── */}
            <ThemedText style={mStyles.sectionLabel}>ADDITIONAL DEDUCTIONS (LES block 19+)</ThemedText>
            <ThemedText style={[mStyles.hint, { color: tc.textMuted }]}>Add deductions from your LES that aren't listed above: BOP, allotments, AAFES debt, vision plan, mid-month pay, etc.</ThemedText>

            {extraDeductions.map(item => (
              <View key={item.id} style={[mStyles.lineItem, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[mStyles.lineItemLabel, { color: tc.textPrimary }]}>{item.label}</ThemedText>
                  <ThemedText style={[mStyles.lineItemAmt, { color: Brand.danger }]}>-${item.amount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => removeDeduction(item.id)} style={mStyles.removeBtn}>
                  <ThemedText style={mStyles.removeTxt}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={mStyles.addBlock}>
              <TextInput
                style={[mStyles.addLabelInput, { backgroundColor: tc.surface, borderColor: tc.borderColor, color: tc.textPrimary }]}
                value={newDeductLabel}
                onChangeText={setNewDeductLabel}
                placeholder="Label (e.g. BOP, Allotment)"
                placeholderTextColor={tc.textMuted}
                autoCapitalize="words"
              />
              <View style={mStyles.addAmtRow}>
                <ThemedText style={[mStyles.dollar, { color: tc.textHint }]}>$</ThemedText>
                <TextInput
                  style={[mStyles.input, { flex: 1, color: tc.textPrimary }]}
                  value={newDeductAmt}
                  onChangeText={setNewDeductAmt}
                  placeholder="Monthly amount"
                  placeholderTextColor={tc.textMuted}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  cancel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  saveBtn: { fontSize: 13, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },

  scroll: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 60 },
  intro: { fontSize: 12, color: '#4D7A9A', lineHeight: 18 },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: Brand.tactical,
    letterSpacing: 1.5, marginTop: Spacing.two,
  },
  hint: { fontSize: 11, lineHeight: 16, marginTop: -Spacing.one },

  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 6,
  },
  dollar: { fontSize: 16, fontWeight: '700' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', padding: 0 },
  clearX: { fontSize: 14, paddingHorizontal: 4 },

  lineItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.two,
  },
  lineItemLabel: { fontSize: 13, fontWeight: '600' },
  lineItemAmt: { fontSize: 11, fontWeight: '700', fontFamily: Fonts.data, marginTop: 2 },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Brand.classified + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  removeTxt: { color: Brand.classified, fontSize: 13, fontWeight: '700' },

  payTypeRow: { gap: Spacing.one, paddingBottom: 2 },
  payTypeChip: {
    paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 4, borderWidth: 1,
  },
  payTypeChipActive: { backgroundColor: Brand.tactical + '20', borderColor: Brand.tactical },
  payTypeChipTxt: { fontSize: 11, fontWeight: '700' },
  payTypeChipTxtActive: { color: Brand.tactical },

  addBlock: { gap: Spacing.one + 2 },
  addLabelInput: {
    borderWidth: 1,
    borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 8,
    fontSize: 14,
  },
  addAmtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  addBtn: { paddingHorizontal: Spacing.two + 4, paddingVertical: 8, borderRadius: 4 },
  addBtnTxt: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 0.5 },

  clearAllBtn: { marginTop: Spacing.three, alignItems: 'center', padding: Spacing.two },
  clearAllTxt: { fontSize: 11, fontWeight: '700', color: Brand.classified, letterSpacing: 1 },

  lesTip: {
    backgroundColor: Brand.tactical + '10',
    borderWidth: 1, borderColor: Brand.tactical + '30',
    borderRadius: 6, padding: Spacing.two + 2, gap: 4,
  },
  lesTipTitle: { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  lesTipBody:  { fontSize: 11, lineHeight: 16 },
  lesTipLink:  { color: Brand.accent, fontWeight: '700' },

  refTable: {
    borderWidth: 1,
    borderRadius: 6, overflow: 'hidden',
  },
  refRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  refLabel: { fontSize: 11, flex: 1 },
  refValue:  { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
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
  const setLesOverrides     = useUserStore((s) => s.setLesOverrides);
  const spouseMonthlyIncome = useUserStore((s) => s.spouseMonthlyIncome);
  const setSpouseMonthlyIncome = useUserStore((s) => s.setSpouseMonthlyIncome);
  const housingStatus       = useUserStore((s) => s.housingStatus);
  const specialPays         = useUserStore((s) => s.specialPays);
  const addSpecialPay       = useUserStore((s) => s.addSpecialPay);
  const removeSpecialPay    = useUserStore((s) => s.removeSpecialPay);

  const bahLabel = breakdown.bahOverridden
    ? 'BAH'
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
              <ThemedText style={styles.overrideBadgeTxt}>ADJUSTED</ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="label" style={[styles.headerLabel, { color: tc.textHint }]}>FY2026</ThemedText>
      </View>

      {/* Net pay hero */}
      <View style={styles.hero}>
        <View>
          <ThemedText type="label" style={[styles.netLabel, { color: tc.textHint }]}>EST. NET / PAYCHECK</ThemedText>
          <ThemedText style={styles.netAmount}>{fmtPay(perPaycheck)}</ThemedText>
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
            <ThemedText style={[styles.editLesTxt, { color: tc.textHint }, hasOverrides && { color: Brand.accent }]}>
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
            <ThemedText style={[styles.householdValue, { color: Brand.accent }]}>{fmtPay(perPaycheck)}</ThemedText>
          </View>
          <ThemedText style={[styles.householdPlus, { color: tc.textMuted }]}>+</ThemedText>
          <View style={styles.householdItem}>
            <ThemedText style={[styles.householdLabel, { color: tc.textMuted }]}>SPOUSE CHECK</ThemedText>
            <ThemedText style={[styles.householdValue, { color: '#208AEF' }]}>{fmtPay(spousePerPaycheck)}</ThemedText>
          </View>
          <ThemedText style={[styles.householdPlus, { color: tc.textMuted }]}>=</ThemedText>
          <View style={styles.householdItem}>
            <ThemedText style={[styles.householdLabel, { color: tc.textMuted }]}>HOUSEHOLD</ThemedText>
            <ThemedText style={[styles.householdValue, { color: Brand.success }]}>{fmtPay(householdPerCheck)}</ThemedText>
          </View>
        </View>
      )}

      {/* Quick bar */}
      {!expanded && (
        <View style={[styles.quickBar, { borderTopColor: tc.borderColor }]}>
          <View style={styles.quickItem}>
            <ThemedText type="label" style={[styles.quickLabel, { color: tc.textMuted }]}>GROSS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.tactical }]}>{fmtPay(breakdown.grossPay / 2)}</ThemedText>
          </View>
          <View style={[styles.quickSep, { backgroundColor: tc.borderColor }]} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={[styles.quickLabel, { color: tc.textMuted }]}>DEDUCTIONS</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.danger }]}>-{fmtPay(breakdown.totalDeductions / 2)}</ThemedText>
          </View>
          <View style={[styles.quickSep, { backgroundColor: tc.borderColor }]} />
          <View style={styles.quickItem}>
            <ThemedText type="label" style={[styles.quickLabel, { color: tc.textMuted }]}>TSP</ThemedText>
            <ThemedText style={[styles.quickValue, { color: Brand.accent }]}>{fmtPay(breakdown.tsp / 2)}</ThemedText>
          </View>
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />

          <ThemedText type="label" style={styles.sectionHead}>// ENTITLEMENTS (MONTHLY)</ThemedText>
          <Row label="BASE PAY"     value={fmtPay(breakdown.basePay)}    indent positive overridden={breakdown.basePayOverridden} />
          <Row label={bahLabel}     value={fmtPay(breakdown.bah)}         indent positive overridden={breakdown.bahOverridden} />
          <Row label="BAS"          value={fmtPay(breakdown.bas)}         indent positive overridden={breakdown.basOverridden} />
          {breakdown.specialPays > 0 && (
            <Row label="SPECIAL PAYS" value={fmtPay(breakdown.specialPays)} indent positive />
          )}
          {breakdown.extraIncomeItems.map(item => (
            <Row key={item.id} label={item.label.toUpperCase()} value={fmtPay(item.amount)} indent positive />
          ))}
          <Row label="GROSS PAY"    value={fmtPay(breakdown.grossPay)}   bold positive />

          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />

          <ThemedText type="label" style={styles.sectionHead}>// DEDUCTIONS (MONTHLY)</ThemedText>
          <Row label="FICA (SS + MED)"  value={`-${fmtPay(breakdown.fica)}`}     indent negative />
          <Row label="FED TAX (EST.)"   value={`-${fmtPay(breakdown.fedTax)}`}   indent negative />
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
              <ThemedText type="label" style={styles.sectionHead}>// HOUSEHOLD COMBINED</ThemedText>
              <Row label="YOUR NET/MO"        value={fmtPay(breakdown.netPay)}   indent positive />
              <Row label="SPOUSE INCOME/MO"   value={fmtPay(spouseMonthlyIncome)} indent positive />
              <Row label="HOUSEHOLD MONTHLY"  value={fmtPay(householdMonthly)}   bold positive />
              <Row label="HOUSEHOLD / CHECK"  value={fmtPay(householdPerCheck)}  bold />
            </>
          )}

          <ThemedText type="label" style={[styles.disclaimer, { color: tc.textMuted }]}>
            * ESTIMATE ONLY — VERIFY AT MYPAY.DFAS.MIL{'\n'}
            {hasOverrides ? '✎ SOME VALUES MANUALLY ADJUSTED FROM LES' : 'SET HOME STATE IN PROFILE FOR STATE TAX ESTIMATE'}
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

      {showEdit && <OverrideModal
        overrides={lesOverrides}
        breakdown={breakdown}
        specialPays={specialPays}
        onAddSpecialPay={addSpecialPay}
        onRemoveSpecialPay={removeSpecialPay}
        onSave={setLesOverrides}
        onClose={() => setShowEdit(false)}
      />}
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
  overrideBadgeTxt: { fontSize: 7, fontWeight: '800', color: Brand.accent, letterSpacing: 1 },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two,
  },
  netLabel: { marginBottom: 4 },
  netAmount: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: Brand.accent, fontFamily: Fonts.data },
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
  sectionHead: { color: Brand.tactical, marginBottom: Spacing.one, fontSize: 9 },
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
