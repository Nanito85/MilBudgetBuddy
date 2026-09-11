import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { DEPLOYMENT_LOCATIONS, DeploymentLocation, getDeploymentLocation } from '@/data/deployment-locations';
import { calcLES, dentalFamilyRate, fmtPay } from '@/features/home/utils/lesCalc';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';
import { LESLineItem, SPECIAL_PAY_LABELS, SPECIAL_PAY_RANGES, SpecialPayType } from '@/types/user.types';

// The single "Edit Pay" screen, used from both HOME > PAY STATEMENT > EDIT
// and SETTINGS > EDIT PAY — previously these were two different modals
// (PaySummaryCard's OverrideModal vs. this one) covering different, only
// partially-overlapping fields, which was confusing since the same person
// reaching "edit my pay" two different ways got two different screens. This
// is now the one shared component both entry points render.

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PAY_TYPE_ICONS: Record<SpecialPayType, string> = {
  language: '🗣️', aviation_acip: '✈️', submarine: '🌊', diving: '🤿',
  parachute: '🪂', sdap: '⭐', hazardous_hdip: '⚠️', sea_pay: '⚓',
  hostile_fire: '🪖', nuclear: '⚛️', foreign_language_bonus: '🌐',
  assignment_incentive: '🎯', other: '💰',
};

function PayTypePickerModal({ visible, selected, onSelect, onClose }: {
  visible: boolean;
  selected: SpecialPayType;
  onSelect: (type: SpecialPayType) => void;
  onClose: () => void;
}) {
  const tc = useThemeColors();
  const ALL_TYPES = Object.keys(SPECIAL_PAY_LABELS) as SpecialPayType[];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[ptStyles.bg, { backgroundColor: tc.background }]}>
        <SafeAreaView style={ptStyles.safe}>
          <View style={ptStyles.header}>
            <ThemedText style={[ptStyles.title, { color: tc.textPrimary }]}>// SELECT PAY TYPE</ThemedText>
            <Pressable onPress={onClose}><ThemedText style={[ptStyles.done, { color: tc.tactical }]}>DONE</ThemedText></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALL_TYPES.map((type) => {
              const isSelected = selected === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => { onSelect(type); onClose(); }}
                  style={[ptStyles.row, { borderColor: tc.borderColor }, isSelected && ptStyles.rowSelected]}>
                  <ThemedText style={ptStyles.icon}>{PAY_TYPE_ICONS[type]}</ThemedText>
                  <View style={ptStyles.rowText}>
                    <ThemedText style={[ptStyles.label, { color: tc.textPrimary }, isSelected && { color: tc.accent }]}>{SPECIAL_PAY_LABELS[type]}</ThemedText>
                    <ThemedText type="label" style={[ptStyles.range, { color: tc.textMuted }]}>Typical: {SPECIAL_PAY_RANGES[type]}</ThemedText>
                  </View>
                  {isSelected && <ThemedText style={[ptStyles.check, { color: tc.accent }]}>✓</ThemedText>}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const ptStyles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  done: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  icon: { fontSize: 22, width: 32, textAlign: 'center', lineHeight: 28 },
  rowText: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '600' },
  range: { fontSize: 10 },
  check: { fontSize: 18 },
});

function DeploymentLocationPickerModal({ visible, selectedId, onSelect, onClose }: {
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const tc = useThemeColors();
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? DEPLOYMENT_LOCATIONS.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()))
    : DEPLOYMENT_LOCATIONS;

  const handleSelect = (loc: DeploymentLocation) => {
    onSelect(loc.id);
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[dlStyles.bg, { backgroundColor: tc.background }]}>
        <SafeAreaView style={dlStyles.safe}>
          <View style={dlStyles.header}>
            <ThemedText style={[dlStyles.title, { color: tc.textPrimary }]}>// DEPLOYMENT LOCATION</ThemedText>
            <Pressable onPress={() => { setQuery(''); onClose(); }}><ThemedText style={[dlStyles.done, { color: tc.tactical }]}>DONE</ThemedText></Pressable>
          </View>
          <ThemedText style={[dlStyles.hint, { color: tc.textMuted }]}>
            Every DoD/IRS-designated Imminent Danger Pay area. &ldquo;Combat Zone&rdquo; locations also exclude basic pay from income tax.
          </ThemedText>
          <View style={[dlStyles.searchWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or area..."
              placeholderTextColor={tc.textHint}
              style={[dlStyles.searchInput, { color: tc.textPrimary }]}
              autoFocus
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.map((loc) => {
              const isSelected = selectedId === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => handleSelect(loc)}
                  style={[dlStyles.row, { borderColor: tc.borderColor }, isSelected && dlStyles.rowSelected]}>
                  <View style={dlStyles.rowText}>
                    <ThemedText style={[dlStyles.label, { color: tc.textPrimary }, isSelected && { color: tc.accent }]}>{loc.label}</ThemedText>
                    <ThemedText type="label" style={[dlStyles.zoneTag, { color: loc.zoneType === 'czte' ? tc.tactical : tc.textMuted }]}>
                      {loc.zoneType === 'czte' ? 'COMBAT ZONE — TAX-FREE BASIC PAY' : 'IMMINENT DANGER PAY AREA'}
                    </ThemedText>
                  </View>
                  {isSelected && <ThemedText style={[dlStyles.check, { color: tc.accent }]}>✓</ThemedText>}
                </Pressable>
              );
            })}
            {filtered.length === 0 && (
              <ThemedText style={[dlStyles.hint, { color: tc.textMuted, textAlign: 'center', marginTop: Spacing.four }]}>
                No matching location. If you believe your location should be designated, verify at your S1/finance office — this list follows current DoD/IRS designations.
              </ThemedText>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const dlStyles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  done: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  hint: { fontSize: 11, lineHeight: 15, marginBottom: Spacing.two },
  searchWrap: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  searchInput: { fontSize: 15, paddingVertical: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  rowText: { flex: 1, gap: 2 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  zoneTag: { fontSize: 9, lineHeight: 12 },
  check: { fontSize: 18 },
});

function SummaryRow({ label, value }: { label: string; value: string }) {
  const tc = useThemeColors();
  return (
    <View style={sumStyles.row}>
      <ThemedText style={[sumStyles.label, { color: tc.textHint }]}>{label}</ThemedText>
      <ThemedText style={[sumStyles.value, { color: tc.textPrimary, fontFamily: Fonts.data }]}>{value}</ThemedText>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  value: { fontSize: 13, fontWeight: '700' },
});

// ── Edit Pay Modal ─────────────────────────────────────────────────────────────

export function EditPayModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const tc = useThemeColors();
  const bg = tc.background; const inputBg = tc.surface; const placeholder = tc.textHint;

  const tspContribPct    = useUserStore((s) => s.tspContribPct);
  const rothTspPct       = useUserStore((s) => s.rothTspPct);
  const hasDentalFamily  = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut        = useUserStore((s) => s.sglOptOut);
  const spouseIncome     = useUserStore((s) => s.spouseMonthlyIncome);
  const lesOverrides     = useUserStore((s) => s.lesOverrides);
  const specialPays      = useUserStore((s) => s.specialPays);
  const setPayDetails    = useUserStore((s) => s.setPayDetails);
  const setLesOverrides  = useUserStore((s) => s.setLesOverrides);
  const addSpecialPay    = useUserStore((s) => s.addSpecialPay);
  const removeSpecialPay = useUserStore((s) => s.removeSpecialPay);

  // Needed to compute the same calculated Base Pay/BAH/BAS/FSA/COLA/etc. the
  // Pay Statement card shows, so this modal can both pre-fill the override
  // fields AND show a full read-only summary of everything already on the
  // pay screen — matching what the user sees on Home before they edit it.
  const payGrade         = useUserStore((s) => s.payGrade);
  const yos              = useUserStore((s) => s.yos);
  const mhaZip           = useUserStore((s) => s.mhaZip);
  const dutyStationId    = useUserStore((s) => s.dutyStationId);
  const hasSpouse        = useUserStore((s) => s.hasSpouse);
  const numChildren      = useUserStore((s) => s.numChildren);
  const housingStatus    = useUserStore((s) => s.housingStatus);
  const stateResidence   = useUserStore((s) => s.stateResidence);
  const serviceStatus    = useUserStore((s) => s.serviceStatus);
  const familySeparated  = useUserStore((s) => s.familySeparated);
  const dependentsMhaZip = useUserStore((s) => s.dependentsMhaZip);
  const isDeployed = useUserStore((s) => s.isDeployed);
  const deploymentLocationId = useUserStore((s) => s.deploymentLocationId);
  const setDeploymentStatus = useUserStore((s) => s.setDeploymentStatus);
  const alsoGsCivilian   = useUserStore((s) => s.alsoGsCivilian);
  const storedGsGradeLES = useUserStore((s) => s.gsGrade);
  const storedGsStepLES  = useUserStore((s) => s.gsStep);
  const gsLocalityKey    = useUserStore((s) => s.gsLocalityKey);

  // Retired pay is a pension, not earned wages — it isn't TSP-eligible (you
  // can't contribute a portion of a pension disbursement to TSP, only actual
  // payroll earnings). A member who set a TSP % while still active and then
  // retired would otherwise keep seeing a phantom TSP deduction taken out of
  // retired pay that DFAS would never actually withhold.
  const isRetired = serviceStatus === 'retired';

  const specialPaysTotal = specialPays.reduce((s, p) => s + p.monthlyAmount, 0);
  const calculated = payGrade
    ? calcLES({
        payGrade, yos, mhaZip, dutyStationId, hasSpouse, numChildren, housingStatus, specialPaysTotal,
        tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence, serviceStatus,
        familySeparated, dependentsMhaZip, alsoGsCivilian, gsGrade: storedGsGradeLES, gsStep: storedGsStepLES, gsLocalityKey,
        isDeployed, deploymentLocationId,
        overrides: lesOverrides,
      })
    : null;

  const [tsp, setTsp]         = useState(tspContribPct);
  const [rothTsp, setRothTsp] = useState(rothTspPct);
  const [dental, setDental]   = useState(hasDentalFamily);
  const [sgl, setSgl]         = useState(sglOptOut);
  const [spouseAmt, setSpouseAmt] = useState(spouseIncome > 0 ? spouseIncome.toString() : '');
  const [basePayStr, setBasePayStr] = useState(
    lesOverrides.basePayOverride ? lesOverrides.basePayOverride.toString() : calculated ? String(Math.round(calculated.basePay)) : '',
  );
  const [bahStr, setBahStr]   = useState(
    lesOverrides.bahOverride ? lesOverrides.bahOverride.toString() : calculated ? String(Math.round(calculated.bah)) : '',
  );
  const [basStr, setBasStr]   = useState(
    lesOverrides.basOverride ? lesOverrides.basOverride.toString() : calculated ? String(Math.round(calculated.bas)) : '',
  );

  // Additional income/deduction line items — arbitrary label+amount pairs
  // for anything on the member's actual LES this app doesn't calculate on
  // its own (extra COLA/OHA adjustments, clothing allowance, BOP, allotments, etc).
  const [extraIncome,     setExtraIncome]     = useState<LESLineItem[]>(lesOverrides.extraIncome);
  const [extraDeductions, setExtraDeductions] = useState<LESLineItem[]>(lesOverrides.extraDeductions);
  const [newIncomeLabel,  setNewIncomeLabel]  = useState('');
  const [newIncomeAmt,    setNewIncomeAmt]    = useState('');
  const [newDeductLabel,  setNewDeductLabel]  = useState('');
  const [newDeductAmt,    setNewDeductAmt]    = useState('');

  // Special pay inline add form
  const [showAddPay, setShowAddPay]         = useState(false);
  const [selectedPayType, setSelectedPayType] = useState<SpecialPayType>('language');
  const [payAmountInput, setPayAmountInput] = useState('');
  const [showPayTypePicker, setShowPayTypePicker] = useState(false);

  // Deployment / hazard pay
  const [deployed, setDeployed] = useState(!!isDeployed);
  const [locationId, setLocationId] = useState(deploymentLocationId ?? '');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const selectedDeploymentLocation = getDeploymentLocation(locationId);

  // Re-sync every local field from the store each time the modal opens —
  // without this, fields only ever reflect what the store held when this
  // component first mounted, so pay data set later (onboarding, cloud sync,
  // a rank/duty-station change made elsewhere) never shows.
  useEffect(() => {
    if (!visible) return;
    setTsp(tspContribPct);
    setRothTsp(rothTspPct);
    setDental(hasDentalFamily);
    setSgl(sglOptOut);
    setSpouseAmt(spouseIncome > 0 ? spouseIncome.toString() : '');
    setBasePayStr(lesOverrides.basePayOverride ? lesOverrides.basePayOverride.toString() : calculated ? String(Math.round(calculated.basePay)) : '');
    setBahStr(lesOverrides.bahOverride ? lesOverrides.bahOverride.toString() : calculated ? String(Math.round(calculated.bah)) : '');
    setBasStr(lesOverrides.basOverride ? lesOverrides.basOverride.toString() : calculated ? String(Math.round(calculated.bas)) : '');
    setExtraIncome(lesOverrides.extraIncome);
    setExtraDeductions(lesOverrides.extraDeductions);
    setDeployed(!!isDeployed);
    setLocationId(deploymentLocationId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function parseAmount(raw: string): number {
    return parseFloat(raw.replace(',', '.').trim());
  }

  const save = () => {
    Keyboard.dismiss();
    const bp  = parseFloat(basePayStr);
    const bah = parseFloat(bahStr);
    const bas = parseFloat(basStr);
    // Only persist as an override if it meaningfully differs from the
    // calculated value — otherwise a pre-filled, unedited field would freeze
    // in a stale override instead of continuing to track future recalcs
    // (e.g. a rate change, or a later PCS/rank update).
    const bpDiffers  = calculated && !isNaN(bp)  && Math.abs(bp  - calculated.basePay) > 0.5;
    const bahDiffers = calculated && !isNaN(bah) && Math.abs(bah - calculated.bah)     > 0.5;
    const basDiffers = calculated && !isNaN(bas) && Math.abs(bas - calculated.bas)     > 0.5;
    const basePayOverride = bpDiffers  ? bp  : (calculated ? undefined : (parseFloat(basePayStr) || undefined));
    const bahOverride     = bahDiffers ? bah : (calculated ? undefined : (parseFloat(bahStr) || undefined));
    const basOverride     = basDiffers ? bas : (calculated ? undefined : (parseFloat(basStr) || undefined));

    setPayDetails({
      tspContribPct: tsp,
      rothTspPct: rothTsp,
      hasDentalFamily: dental,
      sglOptOut: sgl,
      spouseMonthlyIncome: parseFloat(spouseAmt) || 0,
      basePayOverride, bahOverride, basOverride,
    });
    // setPayDetails already preserves extraIncome/extraDeductions untouched,
    // but it can't set them itself — write those two arrays through here.
    setLesOverrides({ basePayOverride, bahOverride, basOverride, extraIncome, extraDeductions });
    setDeploymentStatus(deployed, locationId);
    onClose();
  };

  function addIncome() {
    const amt = parseAmount(newIncomeAmt);
    if (!newIncomeLabel.trim() || isNaN(amt) || amt <= 0) return;
    setExtraIncome([...extraIncome, { id: makeId(), label: newIncomeLabel.trim(), amount: amt }]);
    setNewIncomeLabel(''); setNewIncomeAmt('');
    Keyboard.dismiss();
  }
  function removeIncome(id: string) {
    setExtraIncome(extraIncome.filter((i) => i.id !== id));
  }
  function addDeduction() {
    const amt = parseAmount(newDeductAmt);
    if (!newDeductLabel.trim() || isNaN(amt) || amt <= 0) return;
    setExtraDeductions([...extraDeductions, { id: makeId(), label: newDeductLabel.trim(), amount: amt }]);
    setNewDeductLabel(''); setNewDeductAmt('');
    Keyboard.dismiss();
  }
  function removeDeduction(id: string) {
    setExtraDeductions(extraDeductions.filter((i) => i.id !== id));
  }

  const handleAddSpecialPay = () => {
    const amount = parseFloat(payAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    addSpecialPay(selectedPayType, amount);
    setPayAmountInput('');
    setShowAddPay(false);
  };

  const handleRemoveSpecialPay = (id: string, label: string) => {
    Alert.alert('Remove Pay', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSpecialPay(id) },
    ]);
  };

  const totalSpecialPay = specialPays.reduce((s, p) => s + p.monthlyAmount, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[editStyles.header, { borderColor: tc.borderColor }]}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <ThemedText style={[editStyles.cancel, { color: tc.textMuted }]}>CANCEL</ThemedText>
            </Pressable>
            <ThemedText style={[editStyles.title, { color: tc.textPrimary }]}>💰 PAY & DEDUCTIONS</ThemedText>
            <Pressable onPress={save}><ThemedText style={[editStyles.save, { color: tc.tactical }]}>SAVE</ThemedText></Pressable>
          </View>

          <ScrollView
        style={{ flex: 1 }}
            contentContainerStyle={editStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets>

            {/* Read-only summary of everything currently on the Pay Statement,
                so this screen shows the same picture no matter which door you
                came in — including entitlements that aren't directly editable
                here because they're auto-calculated (FSA, Family BAH, COLA,
                GS civilian pay). */}
            {calculated && (
              <View style={[editStyles.summaryBox, { backgroundColor: inputBg, borderColor: tc.borderColor }]}>
                <ThemedText style={[editStyles.summaryTitle, { color: tc.tactical }]}>
                  CURRENT PAY STATEMENT (MONTHLY)
                </ThemedText>
                <SummaryRow
                  label={calculated.isRetiredPay ? `RETIRED PAY (${calculated.retiredPayPct}%)` : 'BASE PAY'}
                  value={fmtPay(calculated.basePay)}
                />
                {(!calculated.isRetiredPay || calculated.bahOverridden) && (
                  <SummaryRow label={calculated.isOha ? 'OHA' : 'BAH'} value={fmtPay(calculated.bah)} />
                )}
                {(!calculated.isRetiredPay || calculated.basOverridden) && (
                  <SummaryRow label="BAS" value={fmtPay(calculated.bas)} />
                )}
                {calculated.colaTracked && <SummaryRow label="COLA" value={fmtPay(calculated.cola)} />}
                {calculated.isDeployed && (
                  <>
                    <SummaryRow label="IMMINENT DANGER PAY (IDP)" value={fmtPay(calculated.idp)} />
                    {calculated.isCzte && calculated.czteExcluded > 0 && (
                      <SummaryRow label="COMBAT ZONE TAX EXCLUSION" value={`-${fmtPay(calculated.czteExcluded)} taxable`} />
                    )}
                  </>
                )}
                {calculated.familySeparated && (
                  <>
                    <SummaryRow label="FAMILY BAH" value={fmtPay(calculated.familyBah)} />
                    <SummaryRow label="FAMILY SEP. ALLOWANCE (FSA)" value={fmtPay(calculated.fsa)} />
                  </>
                )}
                {calculated.alsoGsCivilian && <SummaryRow label="GS CIVILIAN PAY" value={fmtPay(calculated.gsGrossMonthly)} />}
                {calculated.specialPays > 0 && <SummaryRow label="SPECIAL PAYS" value={fmtPay(calculated.specialPays)} />}
                {calculated.extraIncomeItems.map((item) => (
                  <SummaryRow key={item.id} label={item.label.toUpperCase()} value={fmtPay(item.amount)} />
                ))}
                <View style={[editStyles.summaryDivider, { backgroundColor: tc.borderColor }]} />
                <SummaryRow label="GROSS PAY" value={fmtPay(calculated.grossPay)} />
                <SummaryRow label="TOTAL DEDUCTIONS" value={`-${fmtPay(calculated.totalDeductions)}`} />
                <SummaryRow label="NET PAY" value={fmtPay(calculated.netPay)} />
              </View>
            )}

            {/* LES Overrides */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>📋 LES OVERRIDES</ThemedText>
              <ThemedText style={[editStyles.sectionHeadSub, { color: tc.textHint }]}>Pre-filled with the app's calculated estimate — edit any that differ from your actual LES.</ThemedText>
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>BASE PAY ($/mo from LES)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={basePayStr} onChangeText={setBasePayStr} placeholder="0"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="next" />
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>{calculated?.isOha ? 'OHA' : 'BAH'} ($/mo from LES)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={bahStr} onChangeText={setBahStr} placeholder="0"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="next" />
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>BAS ($/mo from LES)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={basStr} onChangeText={setBasStr} placeholder="0"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="next" />
            </View>

            {/* TSP — not applicable to retired pay (a pension, not payroll
                earnings you can contribute from) */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>📈 TSP / RETIREMENT</ThemedText>
            </View>
            {isRetired ? (
              <ThemedText style={[editStyles.fieldHint, { color: tc.textMuted }]}>
                Not applicable — retired pay is a pension, not payroll earnings, so it can&apos;t be contributed to TSP.
                {alsoGsCivilian ? " If you contribute to TSP through your GS civilian job, that isn't tracked here yet." : ''}
              </ThemedText>
            ) : (
              <>
                <ThemedText style={[editStyles.fieldHint, { color: tc.textMuted }]}>
                  Enter the % you contribute from your base pay. Check your LES block "DEDUCTIONS" — look for Traditional TSP and/or Roth TSP lines.
                </ThemedText>
                <NumberStepper label="Traditional TSP" value={tsp} min={0} max={100} onChange={setTsp} unit="%" />
                <NumberStepper label="Roth TSP" value={rothTsp} min={0} max={100} onChange={setRothTsp} unit="%" />
                <ThemedText style={[editStyles.fieldHint, { color: tc.textMuted }]}>
                  Total TSP: {tsp + rothTsp}% of base pay. Combined cannot exceed IRS annual limit ($24,500 for FY2026).
                </ThemedText>
              </>
            )}

            {/* Spouse Income */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>👥 HOUSEHOLD INCOME</ThemedText>
            </View>
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>SPOUSE MONTHLY INCOME ($/mo)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={spouseAmt} onChangeText={setSpouseAmt} placeholder="0"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="done" />
            </View>

            {/* Special Pays */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>⭐ SPECIAL & INCENTIVE PAY</ThemedText>
            </View>

            {specialPays.length === 0 && !showAddPay && (
              <ThemedText style={[editStyles.emptyHint, { color: tc.textSecondary }]}>No special pays on file. Add aviation, jump, sea pay, etc.</ThemedText>
            )}

            {specialPays.map((pay) => (
              <View key={pay.id} style={editStyles.payRow}>
                <ThemedText style={editStyles.payIcon}>{PAY_TYPE_ICONS[pay.type]}</ThemedText>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText style={[editStyles.payLabel, { color: tc.textPrimary }]}>{pay.customLabel ?? SPECIAL_PAY_LABELS[pay.type]}</ThemedText>
                  <ThemedText style={[editStyles.payAmt, { color: tc.tactical }]}>${pay.monthlyAmount.toFixed(0)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => handleRemoveSpecialPay(pay.id, pay.customLabel ?? SPECIAL_PAY_LABELS[pay.type])} style={editStyles.removeBtn}>
                  <ThemedText style={editStyles.removeBtnText}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            {specialPays.length > 0 && (
              <View style={editStyles.totalRow}>
                <ThemedText style={[editStyles.totalLabel, { color: tc.textHint }]}>TOTAL SPECIAL PAY</ThemedText>
                <ThemedText style={[editStyles.totalAmt, { color: tc.tactical }, { fontFamily: Fonts.data }]}>${totalSpecialPay}/mo</ThemedText>
              </View>
            )}

            {showAddPay ? (
              <View style={editStyles.addPayForm}>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>PAY TYPE</ThemedText>
                <Pressable onPress={() => setShowPayTypePicker(true)} style={[editStyles.payTypeDropdown, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[editStyles.payTypeDropdownLabel, { color: tc.textPrimary }]}>{SPECIAL_PAY_LABELS[selectedPayType]}</ThemedText>
                    <ThemedText type="label" style={[editStyles.payTypeDropdownRange, { color: tc.textMuted }]}>Typical: {SPECIAL_PAY_RANGES[selectedPayType]}</ThemedText>
                  </View>
                  <ThemedText style={[editStyles.payTypeDropdownChevron, { color: tc.accent }]}>▼</ThemedText>
                </Pressable>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint, marginTop: Spacing.two }]}>MONTHLY AMOUNT ($)</ThemedText>
                <View style={editStyles.numpadGrid}>
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
                    <Pressable key={i} style={[editStyles.numpadKey, !key && editStyles.numpadKeyBlank]}
                      onPress={() => {
                        if (!key) return;
                        if (key === '⌫') setPayAmountInput((v) => v.slice(0, -1));
                        else setPayAmountInput((v) => v.length < 6 ? v + key : v);
                      }}>
                      <ThemedText style={[editStyles.numpadKeyText, { color: tc.textPrimary }]}>{key}</ThemedText>
                    </Pressable>
                  ))}
                </View>
                <ThemedText style={[editStyles.amountDisplay, { color: tc.accent }]}>${payAmountInput || '0'}/mo</ThemedText>
                <View style={editStyles.formButtons}>
                  <Pressable style={[editStyles.formBtnCancel, { borderColor: tc.borderColor }]} onPress={() => { setShowAddPay(false); setPayAmountInput(''); }}>
                    <ThemedText type="label" style={{ color: tc.textMuted }}>CANCEL</ThemedText>
                  </Pressable>
                  <Pressable style={editStyles.formBtnAdd} onPress={handleAddSpecialPay}>
                    <ThemedText type="label" style={{ color: '#04080F' }}>ADD PAY</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setShowAddPay(true)} style={editStyles.addRowBtn}>
                <ThemedText style={[editStyles.addRowBtnText, { color: tc.tactical }]}>+ ADD SPECIAL PAY</ThemedText>
              </Pressable>
            )}

            {/* Deployment / Hazard Pay — flat $225/mo Imminent Danger Pay for
                any DoD-designated IDP area, plus (for actual Combat Zones) a
                federal/state income tax exclusion on basic pay. Independent
                of Family Separation above. */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>🪖 DEPLOYMENT / HAZARD PAY</ThemedText>
              <ThemedText style={[editStyles.sectionHeadSub, { color: tc.textHint }]}>
                Deployed, embarked, or on TDY to a DoD-designated hazard area? Select where — this adds
                Imminent Danger Pay automatically, and excludes basic pay from income tax in an actual combat zone.
              </ThemedText>
            </View>

            <View style={editStyles.toggleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Currently Deployed</ThemedText>
                {deployed && selectedDeploymentLocation && (
                  <ThemedText style={[editStyles.toggleSub, { color: tc.textHint }]}>
                    {selectedDeploymentLocation.zoneType === 'czte' ? 'Combat Zone — tax-free basic pay' : 'Imminent Danger Pay area'}
                  </ThemedText>
                )}
              </View>
              <Switch value={deployed} onValueChange={setDeployed} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>

            {deployed && (
              <Pressable onPress={() => setShowLocationPicker(true)} style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <ThemedText style={{ color: selectedDeploymentLocation ? tc.textPrimary : placeholder, fontSize: 15 }}>
                  {selectedDeploymentLocation ? selectedDeploymentLocation.label : 'Select deployment location'}
                </ThemedText>
                <ThemedText style={{ color: tc.accent, fontSize: 12 }}>▼</ThemedText>
              </Pressable>
            )}

            {/* Additional Income — anything else on the LES this app doesn't
                calculate on its own (extra COLA/OHA adjustment, clothing
                allowance, etc). */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>➕ ADDITIONAL INCOME</ThemedText>
              <ThemedText style={[editStyles.sectionHeadSub, { color: tc.textHint }]}>Add entitlements from your LES not listed above: Clothing Allowance, extra COLA/OHA adjustment, Hardship Duty Pay, etc.</ThemedText>
            </View>

            {extraIncome.map((item) => (
              <View key={item.id} style={editStyles.lineItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[editStyles.lineItemLabel, { color: tc.textPrimary }]}>{item.label}</ThemedText>
                  <ThemedText style={[editStyles.lineItemAmt, { color: tc.tactical }]}>${item.amount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => removeIncome(item.id)} style={editStyles.removeBtn}>
                  <ThemedText style={editStyles.removeBtnText}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={editStyles.addBlock}>
              <TextInput
                style={[editStyles.addLabelInput, { backgroundColor: inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]}
                value={newIncomeLabel} onChangeText={setNewIncomeLabel}
                placeholder="Label (e.g. Clothing Allowance)" placeholderTextColor={placeholder} autoCapitalize="words" />
              <View style={editStyles.addAmtRow}>
                <ThemedText style={[editStyles.input, { color: tc.textHint }]}>$</ThemedText>
                <TextInput
                  style={[editStyles.input, { flex: 1, color: tc.textPrimary }]}
                  value={newIncomeAmt} onChangeText={setNewIncomeAmt}
                  placeholder="Monthly amount" placeholderTextColor={placeholder} keyboardType="decimal-pad" />
                <Pressable onPress={addIncome} style={[editStyles.addBtn, { backgroundColor: Brand.tactical }]}>
                  <ThemedText style={editStyles.addBtnTxt}>ADD</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Deductions */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>📉 DEDUCTIONS</ThemedText>
            </View>

            <View style={editStyles.toggleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Family Dental Plan</ThemedText>
                <ThemedText style={[editStyles.toggleSub, { color: tc.textHint }]}>
                  -${dentalFamilyRate(payGrade ?? 'E5').toFixed(2)}/mo deduction
                </ThemedText>
              </View>
              <Switch value={dental} onValueChange={setDental} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>

            <View style={editStyles.toggleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Opt Out of SGLI</ThemedText>
                <ThemedText style={[editStyles.toggleSub, { color: tc.textHint }]}>-$26/mo savings (removes coverage)</ThemedText>
              </View>
              <Switch value={sgl} onValueChange={setSgl} trackColor={{ true: Brand.classified }} thumbColor="#FFF" />
            </View>

            {/* Additional Deductions */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>➖ ADDITIONAL DEDUCTIONS</ThemedText>
              <ThemedText style={[editStyles.sectionHeadSub, { color: tc.textHint }]}>Add deductions from your LES that aren't listed above: BOP, allotments, AAFES debt, vision plan, mid-month pay, etc.</ThemedText>
            </View>

            {extraDeductions.map((item) => (
              <View key={item.id} style={editStyles.lineItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[editStyles.lineItemLabel, { color: tc.textPrimary }]}>{item.label}</ThemedText>
                  <ThemedText style={[editStyles.lineItemAmt, { color: Brand.danger }]}>-${item.amount.toFixed(2)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => removeDeduction(item.id)} style={editStyles.removeBtn}>
                  <ThemedText style={editStyles.removeBtnText}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={editStyles.addBlock}>
              <TextInput
                style={[editStyles.addLabelInput, { backgroundColor: inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]}
                value={newDeductLabel} onChangeText={setNewDeductLabel}
                placeholder="Label (e.g. BOP, Allotment)" placeholderTextColor={placeholder} autoCapitalize="words" />
              <View style={editStyles.addAmtRow}>
                <ThemedText style={[editStyles.input, { color: tc.textHint }]}>$</ThemedText>
                <TextInput
                  style={[editStyles.input, { flex: 1, color: tc.textPrimary }]}
                  value={newDeductAmt} onChangeText={setNewDeductAmt}
                  placeholder="Monthly amount" placeholderTextColor={placeholder} keyboardType="decimal-pad" />
                <Pressable onPress={addDeduction} style={[editStyles.addBtn, { backgroundColor: Brand.danger }]}>
                  <ThemedText style={editStyles.addBtnTxt}>ADD</ThemedText>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <PayTypePickerModal
        visible={showPayTypePicker}
        selected={selectedPayType}
        onSelect={setSelectedPayType}
        onClose={() => setShowPayTypePicker(false)}
      />

      <DeploymentLocationPickerModal
        visible={showLocationPicker}
        selectedId={locationId}
        onSelect={setLocationId}
        onClose={() => setShowLocationPicker(false)}
      />
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  cancel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  save: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  fieldHint: { fontSize: 10, lineHeight: 14 },
  emptyHint: { fontSize: 11, textAlign: 'center', paddingVertical: Spacing.two },
  inputWrap: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.three },
  input: { fontSize: 16, fontWeight: '600', paddingVertical: Spacing.two + 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.two },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 10 },

  sectionHead: { gap: 4, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  sectionHeadText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  sectionHeadSub: { fontSize: 10, lineHeight: 14 },

  summaryBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: 2 },
  summaryTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  summaryDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  payIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  payLabel: { fontSize: 14, fontWeight: '600' },
  payAmt: { fontSize: 10 },
  // A fixed 28x28 circle couldn't grow with the "✕" inside it at larger
  // Settings > Text Size scales. minWidth/minHeight + padding keeps the
  // circle shape at the default size but lets it grow instead of clipping.
  removeBtn: { minWidth: 28, minHeight: 28, borderRadius: 14, paddingHorizontal: 3, paddingVertical: 3, backgroundColor: Brand.classified + '20', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: Brand.classified, fontSize: 13, lineHeight: 16, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.one },
  totalLabel: { fontSize: 10 },
  totalAmt: { fontSize: 16, fontWeight: '700' },

  addPayForm: { gap: Spacing.two },
  payTypeDropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two, gap: Spacing.two },
  payTypeDropdownLabel: { fontSize: 14, fontWeight: '600' },
  payTypeDropdownRange: { fontSize: 9, marginTop: 2 },
  payTypeDropdownChevron: { fontSize: 12 },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  numpadKey: { width: '30.5%', paddingVertical: Spacing.two, alignItems: 'center', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  numpadKeyBlank: { backgroundColor: 'transparent' },
  numpadKeyText: { fontSize: 20, fontWeight: '500' },
  amountDisplay: { fontSize: 28, fontWeight: '800', fontFamily: Fonts.data, textAlign: 'center' },
  formButtons: { flexDirection: 'row', gap: Spacing.two },
  formBtnCancel: { flex: 1, borderWidth: 1, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  formBtnAdd: { flex: 1, backgroundColor: Brand.accent, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  addRowBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  addRowBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  lineItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 4, borderWidth: 1, borderColor: 'rgba(128,128,128,0.25)',
    padding: Spacing.two,
  },
  lineItemLabel: { fontSize: 13, fontWeight: '600' },
  lineItemAmt: { fontSize: 11, fontWeight: '700', fontFamily: Fonts.data, marginTop: 2 },

  addBlock: { gap: Spacing.one + 2 },
  addLabelInput: {
    borderWidth: 1,
    borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 8,
    fontSize: 14,
  },
  addAmtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  addBtn: { paddingHorizontal: Spacing.two + 4, paddingVertical: 8, borderRadius: 4 },
  addBtnTxt: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
});
