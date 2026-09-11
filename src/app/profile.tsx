import { useRouter } from 'expo-router';
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

import { DatePickerModal } from '@/components/DatePickerModal';
import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, Spacing } from '@/constants/theme';
import { RETIREMENT_TAX_EXEMPT_STATES, US_STATES } from '@/data/state-tax';
import { TIPS } from '@/data/tips';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BranchSelector } from '@/features/profile/components/BranchSelector';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { useThemeColors } from '@/hooks/use-theme';
import {
  cancelPayDayReminders,
  cancelWeeklyTip,
  requestNotificationPermissions,
  scheduleWeeklyTip,
  schedulePayDayReminders,
} from '@/services/notifications';
import { resetAllLocalData } from '@/services/reset-local-data';
import { AddKidModal } from '@/features/kids/components/AddKidModal';
import { useKidsStore } from '@/store/kids.store';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';
import { KidProfile, PendingCompletion } from '@/types/kids.types';
import { Installation, getInstallationById, getInstallationByZip } from '@/data/installations';
import {
  BRANCH_LABELS,
  HOUSING_STATUS_DESCRIPTIONS,
  HOUSING_STATUS_LABELS,
  HousingStatus,
  MilitaryBranch,
  RankVariant,
  ServiceStatus,
  getRankAbbrev,
} from '@/types/user.types';
import { VALID_RATINGS, monthlyCompensation } from '@/features/va/utils/vaDisabilityCalc';
import { getDrillPay, fmtPay, FSA_MONTHLY } from '@/features/home/utils/lesCalc';
import { EditPayModal } from '@/features/home/components/EditPayModal';
import { GS_LOCALITIES } from '@/data/gs-pay-rates';

const HOUSING_STATUS_ORDER: HousingStatus[] = ['off_base', 'barracks', 'on_base_family_housing'];
import { PayGrade } from '@/data/bah-rates';
import { getDualVariants } from '@/data/rank-insignia';

const APP_VERSION = '1.0.0';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

function yearsFromDate(iso: string | undefined): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

// Years between two fixed dates — used instead of yearsFromDate for a
// retired member's YOS, which must stay frozen at whatever it was on their
// retirement date, not keep climbing every year they stay retired. YOS
// directly drives the retired-pay percentage on Home (see lesCalc.ts's
// retiredPayMultiplier), so this matters for more than just display.
function yearsBetweenDates(startIso: string | undefined, endIso: string | undefined): number | null {
  if (!startIso || !endIso || !/^\d{4}-\d{2}-\d{2}$/.test(startIso) || !/^\d{4}-\d{2}(-\d{2})?$/.test(endIso)) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

const VA_PICKER_OPTIONS = [0, ...VALID_RATINGS];

const STATUS_CHOICES: { value: ServiceStatus; label: string; emoji: string }[] = [
  { value: 'active',   label: 'ACTIVE',   emoji: '🪖' },
  { value: 'reserve',  label: 'RESERVE',  emoji: '🎖️' },
  { value: 'retired',  label: 'RETIRED',  emoji: '⭐' },
  { value: 'civilian', label: 'CIVILIAN', emoji: '💼' },
];

function SectionLabel({ text, accentColor }: { text: string; accentColor?: string }) {
  const tc = useThemeColors();
  const color = accentColor ?? tc.textMuted;
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <ThemedText type="smallBold" style={[styles.sectionLabel, { color }]}>{text}</ThemedText>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

// ── State Picker Modal ─────────────────────────────────────────────────────────

function StatePickerModal({ visible, selected, onSelect, onClose, retired = false }: {
  visible: boolean;
  selected: string | undefined;
  onSelect: (code: string) => void;
  onClose: () => void;
  // Military retirement pay exemptions are a different, generally more
  // generous list than active-duty exemptions (see state-tax.ts) — e.g.
  // Kansas and Utah fully tax active-duty pay but fully exempt retirement
  // pay. Without this, a retiree picking their state saw the active-duty
  // "NO TAX" badge / rate, which doesn't reflect what they'll actually pay.
  retired?: boolean;
}) {
  const tc = useThemeColors();
  const [query, setQuery] = useState('');
  const filtered = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[stateStyles.bg, { backgroundColor: tc.background }]}>
        <SafeAreaView style={stateStyles.safe}>
          <View style={stateStyles.header}>
            <ThemedText style={[stateStyles.title, { color: tc.textPrimary }]}>// SELECT STATE</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={[stateStyles.cancel, { color: tc.tactical }]}>DONE</ThemedText>
            </Pressable>
          </View>
          <View style={[stateStyles.searchWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search state..."
              placeholderTextColor={tc.textHint}
              style={[stateStyles.search, { color: tc.textPrimary }]}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map((s) => {
              const isSelected = selected === s.code;
              return (
                <Pressable
                  key={s.code}
                  onPress={() => { onSelect(s.code); onClose(); }}
                  style={[stateStyles.row, { borderColor: tc.borderColor }, isSelected && stateStyles.rowSelected]}>
                  <View style={stateStyles.rowLeft}>
                    <ThemedText style={[stateStyles.code, { color: tc.textMuted }, isSelected && { color: tc.accent }]}>{s.code}</ThemedText>
                    <ThemedText style={[stateStyles.name, { color: tc.textHint }, isSelected && { color: tc.textPrimary }]}>{s.name}</ThemedText>
                  </View>
                  <View style={stateStyles.rowRight}>
                    {(retired ? RETIREMENT_TAX_EXEMPT_STATES.has(s.code) : s.militaryExempt) ? (
                      <View style={stateStyles.exemptBadge}>
                        <ThemedText type="label" style={[stateStyles.exemptText, { color: tc.tactical }]}>NO TAX</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={[stateStyles.rate, { color: tc.textMuted, fontFamily: Fonts.data }]}>
                        ~{(s.effectiveRate * 100).toFixed(1)}%
                      </ThemedText>
                    )}
                    {isSelected && <ThemedText style={[stateStyles.check, { color: tc.accent }]}>✓</ThemedText>}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const stateStyles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  cancel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  searchWrap: { borderWidth: 1, borderRadius: 4, paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  search: { fontSize: 14, paddingVertical: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  code: { fontSize: 13, fontWeight: '800', width: 36, fontFamily: Fonts.data },
  name: { fontSize: 13 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  exemptBadge: { backgroundColor: Brand.tactical + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  exemptText: { fontSize: 7 },
  rate: { fontSize: 12 },
  check: { fontSize: 16, width: 20, textAlign: 'center' },
});

// ── Notification Time Picker ────────────────────────────────────────────────────
// Preset times rather than a full hour/minute wheel — this only controls a
// once-a-week tip reminder, so minute-level precision isn't meaningful and a
// short list of common times is faster to pick from.
const TIME_PRESETS: { hour: number; minute: number }[] = [
  { hour: 6, minute: 0 }, { hour: 7, minute: 0 }, { hour: 8, minute: 0 },
  { hour: 9, minute: 0 }, { hour: 10, minute: 0 }, { hour: 12, minute: 0 },
  { hour: 15, minute: 0 }, { hour: 18, minute: 0 }, { hour: 20, minute: 0 },
  { hour: 21, minute: 0 },
];

function TimePickerModal({ visible, selectedHour, selectedMinute, onSelect, onClose }: {
  visible: boolean;
  selectedHour: number;
  selectedMinute: number;
  onSelect: (hour: number, minute: number) => void;
  onClose: () => void;
}) {
  const tc = useThemeColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[stateStyles.bg, { backgroundColor: tc.background }]}>
        <SafeAreaView style={stateStyles.safe}>
          <View style={stateStyles.header}>
            <ThemedText style={[stateStyles.title, { color: tc.textPrimary }]}>// REMINDER TIME</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={[stateStyles.cancel, { color: tc.tactical }]}>DONE</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={timeStyles.hint}>
            Every Monday, at:
          </ThemedText>
          <View style={timeStyles.grid}>
            {TIME_PRESETS.map((t) => {
              const isSelected = selectedHour === t.hour && selectedMinute === t.minute;
              return (
                <Pressable
                  key={`${t.hour}-${t.minute}`}
                  onPress={() => onSelect(t.hour, t.minute)}
                  style={[timeStyles.chip, { borderColor: tc.borderColor }, isSelected && timeStyles.chipActive]}>
                  <ThemedText style={[timeStyles.chipText, { color: tc.textHint }, isSelected && [timeStyles.chipTextActive, { color: tc.accent }]]}>
                    {formatTime(t.hour, t.minute)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const timeStyles = StyleSheet.create({
  hint: { paddingHorizontal: 2, marginBottom: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2,
  },
  chipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' },
  chipText: { fontSize: 14, fontWeight: '700' },
  chipTextActive: {},
});

// ── Edit Personal Modal ────────────────────────────────────────────────────────

function EditPersonalModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const tc = useThemeColors();
  const bg = tc.background; const inputBg = tc.surface; const placeholder = tc.textHint;

  const payGrade       = useUserStore((s) => s.payGrade);
  const storedVariant  = useUserStore((s) => s.rankVariant);
  const lastName       = useUserStore((s) => s.lastName);
  const nickname       = useUserStore((s) => s.nickname);
  const yos            = useUserStore((s) => s.yos);
  const mhaZip         = useUserStore((s) => s.mhaZip);
  const installName    = useUserStore((s) => s.installationName);
  const storedDutyStationId = useUserStore((s) => s.dutyStationId);
  const hasSpouse      = useUserStore((s) => s.hasSpouse);
  const numChildren    = useUserStore((s) => s.numChildren);
  const housingStatus  = useUserStore((s) => s.housingStatus);
  const stateResidence = useUserStore((s) => s.stateResidence);
  const dateOfEnlist   = useUserStore((s) => s.dateOfEnlistment);
  const dateOfRank     = useUserStore((s) => s.dateOfRank);
  const storedGsGrade  = useUserStore((s) => s.gsGrade);
  const storedGsStep   = useUserStore((s) => s.gsStep);
  const serviceStatus  = useUserStore((s) => s.serviceStatus);
  const storedDrills   = useUserStore((s) => s.drillsPerMonth);
  const storedRetDate  = useUserStore((s) => s.retirementDate);
  const storedVaPct    = useUserStore((s) => s.vaDisabilityPercent);
  const storedGsLocality  = useUserStore((s) => s.gsLocalityKey);
  const storedAlsoGsCivilian = useUserStore((s) => s.alsoGsCivilian);
  const storedFamilySeparated  = useUserStore((s) => s.familySeparated);
  const storedDependentsMhaZip = useUserStore((s) => s.dependentsMhaZip);
  const setPersonalDetails = useUserStore((s) => s.setPersonalDetails);
  const setGSInfo      = useUserStore((s) => s.setGSInfo);
  const setBranch      = useUserStore((s) => s.setBranch);
  const setServiceStatus = useUserStore((s) => s.setServiceStatus);
  const setReserveInfo = useUserStore((s) => s.setReserveInfo);
  const setRetiredInfo = useUserStore((s) => s.setRetiredInfo);
  const setAlsoGsCivilian   = useUserStore((s) => s.setAlsoGsCivilian);
  const setFamilySeparation = useUserStore((s) => s.setFamilySeparation);
  const branch         = useUserStore((s) => s.branch);

  const [status, setStatus] = useState<ServiceStatus | undefined>(serviceStatus);
  const [drillsPerMonth, setDrillsPerMonth] = useState(storedDrills ?? 4);
  const [retirementDate, setRetDate] = useState(storedRetDate ?? '');
  const [vaPercent, setVaPercent]    = useState(storedVaPct ?? 0);
  const [showRetDatePicker, setShowRetDatePicker] = useState(false);

  const isCivilian = branch === 'other' || status === 'civilian';
  const isReserve  = status === 'reserve';
  const isRetired  = status === 'retired';

  const [grade, setGrade]         = useState<PayGrade>(payGrade ?? 'E5');
  const [rankVariant, setRankVariant] = useState<RankVariant>(storedVariant ?? 'default');
  const [ln, setLn]               = useState(lastName ?? '');
  const [nn, setNn]               = useState(nickname ?? '');
  const [y, setY]                 = useState(yos);
  const [yManual, setYManual]     = useState(false);
  const [station, setStation]     = useState<Installation | null>(() => getInstallationById(storedDutyStationId) ?? getInstallationByZip(mhaZip));
  const [spouse, setSpouse]       = useState(hasSpouse);
  const [children, setChildren]   = useState(numChildren);
  const [housing, setHousing]     = useState<HousingStatus>(housingStatus ?? 'off_base');
  const [state, setState]         = useState(stateResidence ?? '');
  const [enlistDate, setEnlistDate] = useState(dateOfEnlist ?? '');
  const [rankDate, setRankDate]   = useState(dateOfRank ?? '');

  // Auto-calc YOS from enlistment date unless manually overridden. For a
  // retired member this must be frozen at their retirement date, not still
  // counting up to today — see yearsBetweenDates's doc comment.
  useEffect(() => {
    if (!enlistDate || yManual) return;
    if (isRetired) {
      const calc = yearsBetweenDates(enlistDate, retirementDate);
      if (calc !== null && calc >= 0 && calc <= 40) setY(calc);
      return;
    }
    const ms = Date.now() - new Date(enlistDate).getTime();
    const calc = Math.floor(ms / (365.25 * 864e5));
    if (calc >= 0 && calc <= 40) setY(calc);
  }, [enlistDate, retirementDate, isRetired]);
  const [gsGrade, setGsGrade]     = useState(storedGsGrade ?? 7);
  const [gsStep, setGsStep]       = useState(storedGsStep ?? 1);
  const [gsLocality, setGsLocality] = useState(storedGsLocality ?? 'RUS');
  const [alsoGsCivilian, setAlsoGsCivilianLocal] = useState(storedAlsoGsCivilian ?? false);
  const [familySeparated, setFamilySeparatedLocal] = useState(storedFamilySeparated ?? false);
  const [dependentsStation, setDependentsStation] = useState<Installation | null>(
    () => getInstallationByZip(storedDependentsMhaZip),
  );
  const [showStatePicker, setShowStatePicker]   = useState(false);
  const [showEnlistPicker, setShowEnlistPicker] = useState(false);
  const [showRankPicker, setShowRankPicker]     = useState(false);

  // Re-sync every local field from the store each time the modal opens.
  // Without this, fields only ever reflect what the store held at the moment
  // this component first mounted (ProfileScreen mounts it once and just toggles
  // `visible`), so data saved later — e.g. during onboarding — would never show.
  useEffect(() => {
    if (!visible) return;
    setStatus(serviceStatus);
    setDrillsPerMonth(storedDrills ?? 4);
    setRetDate(storedRetDate ?? '');
    setVaPercent(storedVaPct ?? 0);
    setGrade(payGrade ?? 'E5');
    setRankVariant(storedVariant ?? 'default');
    setLn(lastName ?? '');
    setNn(nickname ?? '');
    setY(yos);
    setYManual(false);
    setStation(getInstallationById(storedDutyStationId) ?? getInstallationByZip(mhaZip));
    setSpouse(hasSpouse);
    setChildren(numChildren);
    setHousing(housingStatus ?? 'off_base');
    setState(stateResidence ?? '');
    setEnlistDate(dateOfEnlist ?? '');
    setRankDate(dateOfRank ?? '');
    setGsGrade(storedGsGrade ?? 7);
    setGsStep(storedGsStep ?? 1);
    setGsLocality(storedGsLocality ?? 'RUS');
    setAlsoGsCivilianLocal(storedAlsoGsCivilian ?? false);
    setFamilySeparatedLocal(storedFamilySeparated ?? false);
    setDependentsStation(getInstallationByZip(storedDependentsMhaZip));
  }, [visible]);

  // Reset variant to default when branch or grade changes and current variant no longer applies
  useEffect(() => {
    if (!branch) return;
    const options = getDualVariants(branch, grade);
    if (!options || !options.find((o) => o.variant === rankVariant)) {
      setRankVariant('default');
    }
  }, [branch, grade]);

  const save = () => {
    Keyboard.dismiss();
    if (branch) setBranch(branch);
    if (status) setServiceStatus(status);
    if (isCivilian) {
      setGSInfo(gsGrade, gsStep, ln, nn, enlistDate || undefined, gsLocality);
    }
    if (isReserve) {
      setReserveInfo(drillsPerMonth);
    }
    if (isRetired) {
      // A retiree can ALSO currently be a GS civilian — retired pay, VA
      // disability, and a GS paycheck stack as three independent income
      // sources for the same person (see lesCalc.ts). Only meaningful here;
      // the pure-civilian case already sets gsGrade/gsStep via setGSInfo above.
      setAlsoGsCivilian(alsoGsCivilian, gsGrade, gsStep, gsLocality);
    }
    // VA disability rating applies regardless of service status — this used
    // to only save when isRetired, so a non-retired member's rating was
    // silently discarded on save even after the UI let them pick one.
    setRetiredInfo(isRetired ? (retirementDate || undefined) : undefined, vaPercent);
    if (!isRetired && !isCivilian) {
      // Family separation (unaccompanied OCONUS tour, sea duty, etc.) only
      // applies to someone actually drawing active/reserve BAH — a retiree
      // or civilian has no BAH/OHA/FSA to split between two locations.
      setFamilySeparation(familySeparated, dependentsStation?.mhaZip ?? '');
    }
    setPersonalDetails({
      payGrade: grade,
      lastName: ln,
      nickname: nn,
      yos: y,
      mhaZip: station?.mhaZip ?? mhaZip ?? '',
      installationName: station?.name ?? installName ?? '',
      dutyStationId: station?.id ?? storedDutyStationId ?? '',
      hasSpouse: spouse,
      numChildren: children,
      housingStatus: housing,
      stateResidence: state,
      dateOfEnlistment: enlistDate,
      dateOfRank: rankDate,
      rankVariant,
    });
    onClose();
  };

  const stateInfo = US_STATES.find((s) => s.code === state);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[editStyles.header, { borderColor: tc.borderColor }]}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <ThemedText style={[editStyles.cancel, { color: tc.textMuted }]}>CANCEL</ThemedText>
            </Pressable>
            <ThemedText style={[editStyles.title, { color: tc.textPrimary }]}>🪖 PERSONAL INFO</ThemedText>
            <Pressable onPress={save}><ThemedText style={[editStyles.save, { color: tc.tactical }]}>SAVE</ThemedText></Pressable>
          </View>

          <ScrollView
        style={{ flex: 1 }}
            contentContainerStyle={editStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets>

            {/* Service Status */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>SERVICE STATUS</ThemedText>
            <View style={editStyles.gsRow}>
              {STATUS_CHOICES.map((opt) => {
                const active = status === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    style={[editStyles.statusChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, active && editStyles.statusChipActive]}>
                    <ThemedText style={editStyles.statusChipEmoji}>{opt.emoji}</ThemedText>
                    <ThemedText style={[editStyles.statusChipText, { color: tc.textHint }, active && { color: tc.accent }]}>
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* Branch */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>SERVICE BRANCH</ThemedText>
            <BranchSelector selected={branch} onSelect={(b: MilitaryBranch) => setBranch(b)} />

            {/* Grade — military only */}
            {!isCivilian && (
              <>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>PAY GRADE</ThemedText>
                <GradePicker selected={grade} onSelect={setGrade} />
              </>
            )}

            {/* GS Grade/Step — civilian only */}
            {isCivilian && (
              <>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS GRADE</ThemedText>
                <View style={editStyles.gsRow}>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setGsGrade(g)}
                      style={[editStyles.gsChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, gsGrade === g && editStyles.gsChipActive]}>
                      <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsGrade === g && { color: tc.accent }]}>
                        {g}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS STEP</ThemedText>
                <View style={editStyles.gsRow}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setGsStep(s)}
                      style={[editStyles.gsChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, gsStep === s && editStyles.gsChipActive]}>
                      <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsStep === s && { color: tc.accent }]}>
                        {s}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS LOCALITY PAY AREA</ThemedText>
                <View style={{ gap: Spacing.one }}>
                  {GS_LOCALITIES.map((loc) => (
                    <Pressable
                      key={loc.key}
                      onPress={() => setGsLocality(loc.key)}
                      style={[
                        editStyles.inputWrap,
                        { backgroundColor: inputBg, borderColor: gsLocality === loc.key ? Brand.accent : tc.borderColor, paddingVertical: Spacing.two },
                      ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                        <ThemedText style={{ fontSize: 16, color: gsLocality === loc.key ? Brand.accent : tc.textHint }}>
                          {gsLocality === loc.key ? '●' : '○'}
                        </ThemedText>
                        <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary, fontSize: 14 }]}>
                          {loc.label} ({(loc.rate * 100).toFixed(2)}%)
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Rank Variant Picker — shown only for dual-title grades */}
            {branch && (() => {
              const variants = getDualVariants(branch, grade);
              if (!variants) return null;
              return (
                <>
                  <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>TITLE / BILLET</ThemedText>
                  <View style={editStyles.variantRow}>
                    {variants.map((opt) => {
                      const active = rankVariant === opt.variant;
                      return (
                        <Pressable
                          key={opt.variant}
                          onPress={() => setRankVariant(opt.variant)}
                          style={[editStyles.variantChip, { borderColor: tc.borderColor }, active && editStyles.variantChipActive]}>
                          <ThemedText style={[editStyles.variantAbbrev, { color: tc.textHint }, active && { color: tc.accent }]}>{opt.abbrev}</ThemedText>
                          <ThemedText style={[editStyles.variantName, { color: tc.textHint }, active && { color: tc.textPrimary }]}>{opt.fullName}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              );
            })()}

            {/* Name */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>LAST NAME</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor }]}>
              <TextInput value={ln} onChangeText={setLn} placeholder="SMITH" placeholderTextColor={placeholder}
                style={[editStyles.input, { color: tc.textPrimary }]} autoCapitalize="characters" returnKeyType="next" />
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>NICKNAME (OPTIONAL)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor }]}>
              <TextInput value={nn} onChangeText={setNn} placeholder="Maverick" placeholderTextColor={placeholder}
                style={[editStyles.input, { color: tc.textPrimary }]} returnKeyType="done" />
            </View>

            {/* Dates */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>DATE OF ENLISTMENT / COMMISSION</ThemedText>
            <Pressable
              onPress={() => setShowEnlistPicker(true)}
              style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: enlistDate ? tc.textPrimary : placeholder, flex: 1, paddingVertical: Spacing.two + 4 }]}>
                {enlistDate ? enlistDate : 'Tap to select date'}
              </ThemedText>
              <ThemedText style={{ fontSize: 18, paddingRight: 4 }}>📅</ThemedText>
            </Pressable>
            {enlistDate && !isRetired && yearsFromDate(enlistDate) !== null && (
              <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>↳ {yearsFromDate(enlistDate)} years of service (auto-calculated)</ThemedText>
            )}
            {enlistDate && isRetired && yearsBetweenDates(enlistDate, retirementDate) !== null && (
              <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>↳ {yearsBetweenDates(enlistDate, retirementDate)} years of service at retirement (auto-calculated)</ThemedText>
            )}

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>DATE OF CURRENT RANK</ThemedText>
            <Pressable
              onPress={() => setShowRankPicker(true)}
              style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: rankDate ? tc.textPrimary : placeholder, flex: 1, paddingVertical: Spacing.two + 4 }]}>
                {rankDate ? rankDate : 'Tap to select date'}
              </ThemedText>
              <ThemedText style={{ fontSize: 18, paddingRight: 4 }}>📅</ThemedText>
            </Pressable>
            {rankDate && yearsFromDate(rankDate) !== null && (
              <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>↳ {yearsFromDate(rankDate)} years in grade · Used for High-3 calculator</ThemedText>
            )}

            <NumberStepper
              label={
                isRetired
                  ? enlistDate && retirementDate
                    ? 'Years of Service at Retirement (auto-calculated — tap to override)'
                    : 'Years of Service at Retirement'
                  : enlistDate
                    ? 'Years of Service (auto-calculated — tap to override)'
                    : 'Years of Service'
              }
              value={y}
              min={0}
              max={40}
              onChange={(v) => { setY(v); setYManual(true); }}
              unit="yrs"
            />
            {isRetired && (
              <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                Determines your retired pay: 50% of High-3 average base pay at 20 years, +2.5% for every year beyond that.
              </ThemedText>
            )}

            {/* Reserve/Guard — drills per month (drives drill pay) */}
            {isReserve && (
              <>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>DRILLS PER MONTH</ThemedText>
                <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                  One battle assembly weekend = 4 drills. Used to estimate your monthly drill pay.
                </ThemedText>
                <NumberStepper label="Drills" value={drillsPerMonth} min={0} max={20} onChange={setDrillsPerMonth} unit="drills" />
                <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                  ↳ Est. drill pay: {fmtPay(getDrillPay(grade, y, drillsPerMonth))}/mo
                </ThemedText>
              </>
            )}

            {/* Retired — retirement date */}
            {isRetired && (
              <>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>MONTH & YEAR YOU RETIRED</ThemedText>
                <Pressable
                  onPress={() => setShowRetDatePicker(true)}
                  style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
                  <ThemedText style={[editStyles.input, { color: retirementDate ? tc.textPrimary : placeholder, flex: 1, paddingVertical: Spacing.two + 4 }]}>
                    {retirementDate ? retirementDate : 'Tap to select date'}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 18, paddingRight: 4 }}>📅</ThemedText>
                </Pressable>
              </>
            )}

            {/* VA Disability Rating — available regardless of service status.
                A member doesn't need to be retired to have a service-connected
                VA rating (medically separated before 20 years, still serving
                with a rating from a prior injury, etc). This used to be nested
                under isRetired, so anyone else had no way to enter one at all
                and the Home screen's VA card silently never showed for them,
                even though they may be owed real, separate compensation. */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>VA DISABILITY RATING (IF ANY)</ThemedText>
            <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
              Optional — set this even if you're still serving or separated without retiring. VA compensation is separate, tax-free income independent of any other pay.
            </ThemedText>
            <View style={editStyles.gsRow}>
              {VA_PICKER_OPTIONS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setVaPercent(p)}
                  style={[editStyles.gsChip, { width: 52, borderColor: tc.borderColor, backgroundColor: tc.surface }, vaPercent === p && editStyles.gsChipActive]}>
                  <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, vaPercent === p && { color: tc.accent }]}>
                    {p}%
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            {vaPercent > 0 && (
              <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                ↳ Est. VA compensation: {fmtPay(monthlyCompensation(vaPercent, spouse, children))}/mo
              </ThemedText>
            )}

            {/* Retired-only settings continue below */}
            {isRetired && (
              <>
                {/* Retired + currently working GS civilian — retired pay, VA
                    disability, and a GS paycheck all stack together, so this
                    doesn't replace anything above; it adds to it. */}
                <View style={editStyles.toggleRow}>
                  <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Also Working GS Civilian Job</ThemedText>
                  <Switch value={alsoGsCivilian} onValueChange={setAlsoGsCivilianLocal} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
                </View>
                {alsoGsCivilian && (
                  <>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                      Added to your retired pay and VA disability as a separate income source in your Pay Statement.
                    </ThemedText>
                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS GRADE</ThemedText>
                    <View style={editStyles.gsRow}>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => setGsGrade(g)}
                          style={[editStyles.gsChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, gsGrade === g && editStyles.gsChipActive]}>
                          <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsGrade === g && { color: tc.accent }]}>
                            {g}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS STEP</ThemedText>
                    <View style={editStyles.gsRow}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => setGsStep(s)}
                          style={[editStyles.gsChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, gsStep === s && editStyles.gsChipActive]}>
                          <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsStep === s && { color: tc.accent }]}>
                            {s}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS LOCALITY PAY AREA</ThemedText>
                    <View style={{ gap: Spacing.one }}>
                      {GS_LOCALITIES.map((loc) => (
                        <Pressable
                          key={loc.key}
                          onPress={() => setGsLocality(loc.key)}
                          style={[
                            editStyles.inputWrap,
                            { backgroundColor: inputBg, borderColor: gsLocality === loc.key ? Brand.accent : tc.borderColor, paddingVertical: Spacing.two },
                          ]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                            <ThemedText style={{ fontSize: 16, color: gsLocality === loc.key ? Brand.accent : tc.textHint }}>
                              {gsLocality === loc.key ? '●' : '○'}
                            </ThemedText>
                            <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary, fontSize: 14 }]}>
                              {loc.label} ({(loc.rate * 100).toFixed(2)}%)
                            </ThemedText>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            {/* Duty Station */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>DUTY STATION</ThemedText>
            <StationPicker label="Duty Station" selected={station} onSelect={setStation} />

            {/* State */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>STATE OF RESIDENCE</ThemedText>
            <Pressable onPress={() => setShowStatePicker(true)} style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: state ? tc.textPrimary : placeholder, flex: 1, paddingVertical: Spacing.two + 4 }]}>
                {stateInfo ? `${stateInfo.name} (${stateInfo.code})` : 'Tap to select state'}
              </ThemedText>
              <ThemedText style={{ color: tc.accent, fontSize: 18, paddingRight: 4 }}>›</ThemedText>
            </Pressable>
            {stateInfo && (
              <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                {(isRetired ? RETIREMENT_TAX_EXEMPT_STATES.has(stateInfo.code) : stateInfo.militaryExempt)
                  ? `✓ Military ${isRetired ? 'retirement ' : ''}pay exempt`
                  : `~${(stateInfo.effectiveRate * 100).toFixed(1)}% est. effective rate`}
              </ThemedText>
            )}

            {/* Family */}
            <View style={editStyles.toggleRow}>
              <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Spouse / Dependent</ThemedText>
              <Switch value={spouse} onValueChange={setSpouse} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>
            <NumberStepper label="Dependent Children" value={children} min={0} max={8} onChange={setChildren} />

            {/* Housing status */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>CURRENT HOUSING</ThemedText>
            <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
              This determines your actual BAH entitlement.
            </ThemedText>
            <View style={{ gap: Spacing.one }}>
              {HOUSING_STATUS_ORDER.map((hs) => (
                <Pressable
                  key={hs}
                  onPress={() => setHousing(hs)}
                  style={[
                    editStyles.inputWrap,
                    { backgroundColor: inputBg, borderColor: housing === hs ? Brand.accent : tc.borderColor, paddingVertical: Spacing.two },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                    <ThemedText style={{ fontSize: 16, color: housing === hs ? Brand.accent : tc.textHint }}>
                      {housing === hs ? '●' : '○'}
                    </ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary, fontSize: 14 }]}>
                        {HOUSING_STATUS_LABELS[hs]}
                      </ThemedText>
                      <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: 2 }]}>
                        {HOUSING_STATUS_DESCRIPTIONS[hs]}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Family Separation — unaccompanied OCONUS tour, sea duty, etc.
                Doesn't apply to a retiree or pure civilian (no BAH/OHA/FSA to
                split), and there's no one to be separated FROM without a
                dependent. */}
            {!isRetired && !isCivilian && spouse && (
              <>
                <View style={editStyles.toggleRow}>
                  <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Currently Separated From Family</ThemedText>
                  <Switch value={familySeparated} onValueChange={setFamilySeparatedLocal} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
                </View>
                {familySeparated && (
                  <>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                      Unaccompanied OCONUS tour, sea duty, or similar orders where your family lives elsewhere.
                      Your OHA/BAH above switches to the without-dependents rate, your family draws BAH at their
                      own location, and you&apos;re added Family Separation Allowance (FSA, ${FSA_MONTHLY}/mo).
                    </ThemedText>
                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>WHERE YOUR FAMILY LIVES</ThemedText>
                    <StationPicker label="Family's Location" selected={dependentsStation} onSelect={setDependentsStation} conusOnly />
                    {!dependentsStation && (
                      <ThemedText style={[editStyles.fieldHint, { color: Brand.danger, marginTop: -Spacing.two }]}>
                        Set this so we can calculate your family&apos;s actual BAH — without it, that entitlement won&apos;t show up in your Pay Statement.
                      </ThemedText>
                    )}
                  </>
                )}
              </>
            )}

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <StatePickerModal
        visible={showStatePicker}
        selected={state}
        onSelect={setState}
        onClose={() => setShowStatePicker(false)}
        retired={isRetired}
      />
      <DatePickerModal
        visible={showEnlistPicker}
        value={enlistDate}
        title="Date of Enlistment / Commission"
        onConfirm={(d) => { setEnlistDate(d); setShowEnlistPicker(false); }}
        onCancel={() => setShowEnlistPicker(false)}
      />
      <DatePickerModal
        visible={showRankPicker}
        value={rankDate}
        title="Date of Current Rank"
        onConfirm={(d) => { setRankDate(d); setShowRankPicker(false); }}
        onCancel={() => setShowRankPicker(false)}
      />
      <DatePickerModal
        visible={showRetDatePicker}
        value={retirementDate}
        title="Month & Year You Retired"
        onConfirm={(d) => { setRetDate(d); setShowRetDatePicker(false); }}
        onCancel={() => setShowRetDatePicker(false)}
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
  dateHint: { fontSize: 10, marginTop: -Spacing.two },
  emptyHint: { fontSize: 11, textAlign: 'center', paddingVertical: Spacing.two },
  inputWrap: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.three },
  input: { fontSize: 16, fontWeight: '600', paddingVertical: Spacing.two + 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.two },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 10 },

  sectionHead: { gap: 4, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  sectionHeadText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  sectionHeadSub: { fontSize: 10, lineHeight: 14 },

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

  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  variantChip: { flexBasis: '48%', flex: 1, borderWidth: 1.5, borderRadius: 8, padding: Spacing.two, gap: 2, alignItems: 'center' },
  variantChipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '12' },
  variantAbbrev: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5, fontFamily: Fonts.data },
  variantName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  gsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  gsChip: {
    width: 44, height: 38, borderWidth: 1, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  gsChipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' },
  gsChipText: { fontSize: 13, fontWeight: '700' },

  statusChip: {
    flexBasis: '48%', flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingVertical: Spacing.two, paddingHorizontal: Spacing.two,
  },
  statusChipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' },
  statusChipEmoji: { fontSize: 16 },
  statusChipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const tc = useThemeColors();

  const branch         = useUserStore((s) => s.branch);
  const payGrade       = useUserStore((s) => s.payGrade);
  const rankVariant    = useUserStore((s) => s.rankVariant);
  const lastName       = useUserStore((s) => s.lastName);
  const nickname       = useUserStore((s) => s.nickname);
  const greetingStyle  = useUserStore((s) => s.greetingStyle);
  const setGreetingStyle = useUserStore((s) => s.setGreetingStyle);
  const yos            = useUserStore((s) => s.yos);
  const mhaZip         = useUserStore((s) => s.mhaZip);
  const installName    = useUserStore((s) => s.installationName);
  const hasSpouse      = useUserStore((s) => s.hasSpouse);
  const numChildren    = useUserStore((s) => s.numChildren);
  const tspContribPct  = useUserStore((s) => s.tspContribPct);
  const rothTspPct     = useUserStore((s) => s.rothTspPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut      = useUserStore((s) => s.sglOptOut);
  const stateResidence = useUserStore((s) => s.stateResidence);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const notificationHour  = useUserStore((s) => s.notificationHour);
  const notificationMinute = useUserStore((s) => s.notificationMinute);
  const specialPays    = useUserStore((s) => s.specialPays);
  const lesOverrides   = useUserStore((s) => s.lesOverrides);
  const dateOfEnlist   = useUserStore((s) => s.dateOfEnlistment);
  const serviceStatus  = useUserStore((s) => s.serviceStatus);
  const setNotifications = useUserStore((s) => s.setNotifications);
  const setNotificationTime = useUserStore((s) => s.setNotificationTime);

  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [showEditPay, setShowEditPay]           = useState(false);
  const [showAddKid, setShowAddKid]             = useState(false);
  const [showTimePicker, setShowTimePicker]     = useState(false);

  const savedTipIds = useTipsStore((s) => s.savedTipIds);
  // Was previously a bare setState({ savedTipIds: [] }) that only cleared
  // in-memory state, never AsyncStorage — cleared tips silently came back
  // on next app launch. tips.store's own resetAll() now clears both.
  const clearSaved  = () => useTipsStore.getState().resetAll();

  const kids        = useKidsStore((s) => s.kids);
  const addKid      = useKidsStore((s) => s.addKid);
  const removeKid   = useKidsStore((s) => s.removeKid);
  const approveCompletion = useKidsStore((s) => s.approveCompletion);
  const rejectCompletion  = useKidsStore((s) => s.rejectCompletion);

  useEffect(() => { useKidsStore.getState().hydrate(); }, []);

  const rankAbbrev    = getRankAbbrev(branch, payGrade, rankVariant);
  const displayName   = nickname || lastName?.toUpperCase() || 'UNNAMED';
  const totalSpecialPay = specialPays.reduce((s, p) => s + p.monthlyAmount, 0);
  // For a retired member this must NOT keep climbing every year they stay
  // retired — same reasoning as yearsBetweenDates above (used by the Personal
  // Info edit modal). `yos` is already frozen at retirement date and is what
  // actually drives the retired-pay calculation everywhere else in the app,
  // so fall back to it here instead of a continuously-recomputed enlistment
  // age that would silently disagree with the stat driving their own pay.
  const enlistYears   = serviceStatus === 'retired' ? null : yearsFromDate(dateOfEnlist);

  // All pending completions across all kids
  const allPending: Array<{ kid: KidProfile; completion: PendingCompletion }> = kids.flatMap((kid) =>
    (kid.pendingCompletions ?? []).map((c) => ({ kid, completion: c })),
  );

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) { Alert.alert('Permission Required', 'Enable notifications in device settings.'); return; }
      setNotifications(true);
      scheduleWeeklyTip(notificationHour, notificationMinute);
      schedulePayDayReminders();
    } else {
      setNotifications(false);
      cancelWeeklyTip();
      cancelPayDayReminders();
    }
  };

  // Re-schedules immediately if notifications are currently on, so the new
  // time takes effect right away rather than waiting for the next
  // toggle-off/toggle-on (scheduleWeeklyTip cancels and re-registers the
  // existing scheduled notification under the hood).
  const handleTimeChange = (hour: number, minute: number) => {
    setNotificationTime(hour, minute);
    setShowTimePicker(false);
    if (notificationsEnabled) scheduleWeeklyTip(hour, minute);
  };

  const handleResetApp = () => {
    Alert.alert('Reset All App Data', 'This will permanently delete your profile, budget, goals, and all saved data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => {
        Alert.alert('Final Confirmation', 'Are you absolutely sure? All data will be erased.', [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Erase All Data', style: 'destructive', onPress: async () => {
            await resetAllLocalData();
            router.replace('/');
          }},
        ]);
      }},
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <SafeAreaView>
          {router.canGoBack() && (
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
              <ThemedText style={[styles.backText, { color: tc.tactical }]}>‹ Back</ThemedText>
            </Pressable>
          )}
          <ThemedText type="label" style={[styles.eyebrow, { color: tc.tactical }]}>// PERSONNEL FILE</ThemedText>
          <ThemedText style={[styles.heading, { color: tc.textPrimary }]}>PROFILE</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.headingSub}>
            Your service record, pay setup, and app preferences.
          </ThemedText>
        </SafeAreaView>

        {/* ── Identity Card ─────────────────────────────────────────── */}
        <TacticalCard accentColor={Brand.accent} style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={styles.identityLeft}>
              <ThemedText type="label" style={[styles.identityRank, { color: tc.accent }]}>{rankAbbrev || '—'}</ThemedText>
              <ThemedText style={[styles.identityName, { color: tc.textPrimary }]}>{displayName}</ThemedText>
              <ThemedText type="label" style={[styles.identityBranch, { color: tc.textMuted }]}>
                {branch ? BRANCH_LABELS[branch].toUpperCase() : 'BRANCH NOT SET'}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.identityStats, { backgroundColor: tc.surfaceInner }]}>
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { color: tc.textPrimary, fontFamily: Fonts.data }]}>
                {enlistYears !== null ? enlistYears : yos}
              </ThemedText>
              <ThemedText type="label" style={[styles.identityStatLabel, { color: tc.textSecondary }]}>YRS SVC</ThemedText>
            </View>
            <View style={[styles.identityDivider, { backgroundColor: tc.borderColor }]} />
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { color: tc.textPrimary, fontFamily: Fonts.data }]}>{tspContribPct + rothTspPct}%</ThemedText>
              <ThemedText type="label" style={[styles.identityStatLabel, { color: tc.textSecondary }]}>TSP TOTAL</ThemedText>
            </View>
            <View style={[styles.identityDivider, { backgroundColor: tc.borderColor }]} />
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { color: tc.textPrimary, fontFamily: Fonts.data }]}>{hasSpouse ? 'W/D' : 'S'}</ThemedText>
              <ThemedText type="label" style={[styles.identityStatLabel, { color: tc.textSecondary }]}>MARITAL</ThemedText>
            </View>
            <View style={[styles.identityDivider, { backgroundColor: tc.borderColor }]} />
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { color: tc.textPrimary, fontFamily: Fonts.data }]}>{numChildren}</ThemedText>
              <ThemedText type="label" style={[styles.identityStatLabel, { color: tc.textSecondary }]}>DEPS</ThemedText>
            </View>
          </View>
        </TacticalCard>

        {/* ── Two Edit Tiles ─────────────────────────────────────────── */}
        <SectionLabel text="EDIT YOUR INFO" />
        <View style={styles.tilesRow}>
          {/* PERSONAL tile */}
          <Pressable
            onPress={() => setShowEditPersonal(true)}
            style={({ pressed }) => [styles.editTile, { borderColor: Brand.accent + '60', backgroundColor: Brand.accent + '08' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.tileIcon}>🪖</ThemedText>
            <ThemedText style={[styles.tileTitle, { color: tc.accent }]}>PERSONAL</ThemedText>
            <View style={styles.tileSummary}>
              {payGrade && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>{payGrade} · {lastName?.toUpperCase() || 'NAME NOT SET'}</ThemedText>}
              {installName ? <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]} numberOfLines={1}>{installName}</ThemedText> : mhaZip ? <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>ZIP {mhaZip}</ThemedText> : null}
              {stateResidence && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Residence: {stateResidence}</ThemedText>}
              {dateOfEnlist && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Enl: {dateOfEnlist}</ThemedText>}
            </View>
            <View style={[styles.tileEditBtn, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[styles.tileEditBtnText, { color: tc.accent }]}>EDIT PERSONAL ›</ThemedText>
            </View>
          </Pressable>

          {/* PAY tile */}
          <Pressable
            onPress={() => setShowEditPay(true)}
            style={({ pressed }) => [styles.editTile, { borderColor: Brand.tactical + '60', backgroundColor: Brand.tactical + '08' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.tileIcon}>💰</ThemedText>
            <ThemedText style={[styles.tileTitle, { color: tc.tactical }]}>PAY</ThemedText>
            <View style={styles.tileSummary}>
              {tspContribPct > 0 && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Trad TSP {tspContribPct}%</ThemedText>}
              {rothTspPct > 0 && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Roth TSP {rothTspPct}%</ThemedText>}
              {tspContribPct === 0 && rothTspPct === 0 && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>TSP 0% (set in edit)</ThemedText>}
              {totalSpecialPay > 0 && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>+${totalSpecialPay}/mo special</ThemedText>}
              {lesOverrides.basePayOverride ? <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Base: ${lesOverrides.basePayOverride}/mo</ThemedText> : null}
              {(hasDentalFamily || sglOptOut) && (
                <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>
                  {[hasDentalFamily && 'Dental', sglOptOut && 'SGLI opt-out'].filter(Boolean).join(' · ')}
                </ThemedText>
              )}
            </View>
            <View style={[styles.tileEditBtn, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[styles.tileEditBtnText, { color: tc.tactical }]}>EDIT PAY ›</ThemedText>
            </View>
          </Pressable>
        </View>

        {/* ── Greeting Style ─────────────────────────────────────────── */}
        <SectionLabel text="HOME SCREEN GREETING" accentColor={Brand.primary} />
        <TacticalCard accentColor={Brand.primary} style={styles.sectionCard}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>How should we greet you on the home screen?</ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two }}>
            {(['nickname', 'rank'] as const).map((style) => {
              const label = style === 'nickname'
                ? `${nickname || 'Maverick'}`
                : `${rankAbbrev || 'SGT'} ${lastName?.toUpperCase() || 'SMITH'}`;
              const active = (greetingStyle ?? 'nickname') === style;
              return (
                <Pressable key={style} onPress={() => setGreetingStyle(style)}
                  style={[styles.greetingBtn, { borderColor: tc.borderColor }, active && { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' }]}>
                  <ThemedText style={[styles.greetingBtnLabel, { color: tc.textHint }, active && { color: tc.accent }]}>
                    {style === 'nickname' ? '😎 NICKNAME' : '🪖 RANK'}
                  </ThemedText>
                  <ThemedText style={[styles.greetingBtnValue, { color: tc.textPrimary }, active && { color: tc.accent }]} numberOfLines={1}>{label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </TacticalCard>

        {/* ── Commander's Inbox ──────────────────────────────────────── */}
        {allPending.length > 0 && (
          <>
            <SectionLabel text={`COMMANDER'S INBOX — ${allPending.length} PENDING`} accentColor="#FFB300" />
            <TacticalCard accentColor="#FFB300" style={[styles.sectionCard, { borderColor: '#FFB30040' }]}>
              <ThemedText type="smallBold" style={{ color: '#FFB300', fontSize: 11, marginBottom: Spacing.one }}>
                ⏳ MISSIONS AWAITING YOUR APPROVAL
              </ThemedText>
              {allPending.map(({ kid, completion }) => (
                <View key={completion.id} style={styles.pendingRow}>
                  <View style={styles.pendingLeft}>
                    <ThemedText style={styles.pendingKid}>{kid.nickname.toUpperCase()}</ThemedText>
                    <ThemedText style={[styles.pendingChore, { color: tc.textPrimary }]}>{completion.choreName}</ThemedText>
                    <ThemedText style={[styles.pendingDate, { color: tc.textSecondary }]}>{completion.submittedDate} · +${completion.choreValue.toFixed(2)}</ThemedText>
                  </View>
                  <View style={styles.pendingActions}>
                    <Pressable
                      onPress={() => approveCompletion(kid.id, completion.id)}
                      style={[styles.pendingBtn, styles.pendingBtnApprove]}>
                      <ThemedText style={styles.pendingBtnApproveText}>✓ APPROVE</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Alert.alert('Reject Mission', `Reject "${completion.choreName}" for ${kid.nickname}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Reject', style: 'destructive', onPress: () => rejectCompletion(kid.id, completion.id) },
                        ]);
                      }}
                      style={[styles.pendingBtn, styles.pendingBtnReject]}>
                      <ThemedText style={styles.pendingBtnRejectText}>✕</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </TacticalCard>
          </>
        )}

        {/* ── Cadet Profiles ─────────────────────────────────────────── */}
        <SectionLabel text="CADET PROFILES" accentColor={Brand.tactical} />
        <TacticalCard accentColor={Brand.tactical} style={styles.sectionCard}>
          {kids.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>No cadet profiles. Add a child to give them their own goals and chores app.</ThemedText>
          )}
          {kids.map((kid: KidProfile, index: number) => {
            const pendingCount = (kid.pendingCompletions ?? []).length;
            return (
              <React.Fragment key={kid.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />}
                <Pressable
                  onPress={() => router.push(`/kids/${kid.id}` as any)}
                  style={({ pressed }) => [styles.kidRow, pressed && { opacity: 0.7 }]}>
                  <ThemedText style={styles.kidEmoji}>{kid.gender === 'boy' ? '🚀' : '🌸'}</ThemedText>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
                      <ThemedText style={[styles.kidName, { color: tc.textPrimary }]}>{kid.nickname.toUpperCase()}</ThemedText>
                      {pendingCount > 0 && (
                        <View style={styles.kidBadge}>
                          <ThemedText style={styles.kidBadgeText}>{pendingCount}</ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textMuted" style={styles.kidMeta}>
                      {kid.goals.length} goal{kid.goals.length !== 1 ? 's' : ''} · {kid.chores.length} mission{kid.chores.length !== 1 ? 's' : ''}
                      {pendingCount > 0 ? ` · ${pendingCount} awaiting approval` : ''}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => Alert.alert('Remove Cadet', `Remove ${kid.nickname}'s profile?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeKid(kid.id) },
                    ])}
                    style={styles.removeKidBtn}
                    hitSlop={8}>
                    <ThemedText style={styles.removeKidBtnText}>✕</ThemedText>
                  </Pressable>
                  <ThemedText style={[styles.kidChevron, { color: tc.textHint }]}>›</ThemedText>
                </Pressable>
              </React.Fragment>
            );
          })}
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Pressable onPress={() => setShowAddKid(true)} style={styles.addRowBtn}>
            <ThemedText type="label" style={[styles.addRowBtnText, { color: tc.tactical }]}>+ ENROLL NEW CADET</ThemedText>
          </Pressable>
        </TacticalCard>

        {/* ── Preferences ────────────────────────────────────────────── */}
        <SectionLabel text="PREFERENCES" accentColor={Brand.primary} />
        <TacticalCard accentColor={Brand.primary} style={styles.sectionCard}>
          <View style={styles.prefRow}>
            <Pressable
              disabled={!notificationsEnabled}
              onPress={() => setShowTimePicker(true)}
              style={{ flex: 1, gap: 2 }}>
              <ThemedText style={[styles.prefLabel, { color: tc.textPrimary }]}>Weekly Tip Reminder</ThemedText>
              <ThemedText type="small" themeColor="textHint" style={styles.prefValue}>
                {notificationsEnabled ? `Mondays at ${formatTime(notificationHour, notificationMinute)} — tap to change` : 'Off'}
              </ThemedText>
            </Pressable>
            <Switch value={notificationsEnabled} onValueChange={handleNotificationToggle} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
          </View>
        </TacticalCard>

        <TimePickerModal
          visible={showTimePicker}
          selectedHour={notificationHour}
          selectedMinute={notificationMinute}
          onSelect={handleTimeChange}
          onClose={() => setShowTimePicker(false)}
        />

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <SectionLabel text="INTEL STATS" accentColor={Brand.accent} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.intelStatsCaption}>
          Your Home screen tip rotates weekly — 58 tips means about a year before any repeat. Tap below to browse the full library, filter by topic, or read your saved tips.
        </ThemedText>
        <Pressable onPress={() => router.push('/tip-library' as any)} style={({ pressed }) => pressed && { opacity: 0.8 }}>
          <View style={styles.statsRow}>
            {[
              { val: savedTipIds.length, label: 'SAVED' },
              { val: TIPS.length, label: 'TOTAL TIPS' },
              { val: 6, label: 'CATEGORIES' },
            ].map((s) => (
              <TacticalCard key={s.label} accentColor={Brand.accent} style={styles.statCard}>
                <ThemedText style={[styles.statVal, { color: tc.accent }, { fontFamily: Fonts.data }]}>{s.val}</ThemedText>
                <ThemedText type="label" style={[styles.statLabel, { color: tc.textSecondary }]}>{s.label}</ThemedText>
              </TacticalCard>
            ))}
          </View>
          <ThemedText style={[styles.intelViewAll, { color: tc.accent }]}>VIEW TIP LIBRARY ›</ThemedText>
        </Pressable>

        {/* ── About ──────────────────────────────────────────────────── */}
        <SectionLabel text="ABOUT" />
        <TacticalCard accentColor={tc.borderColor} style={styles.sectionCard}>
          <View style={styles.aboutRow}>
            <ThemedText type="label" style={[styles.aboutLabel, { color: tc.textHint }]}>VERSION</ThemedText>
            <ThemedText style={[styles.aboutVal, { color: tc.textPrimary, fontFamily: Fonts.data }]}>{APP_VERSION}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Pressable onPress={() => router.push('/legal' as any)} style={styles.aboutLinkRow}>
            <ThemedText type="label" style={[styles.aboutLinkText, { color: tc.tactical }]}>PRIVACY POLICY & TERMS</ThemedText>
            <ThemedText style={[styles.aboutChevron, { color: tc.tactical }]}>›</ThemedText>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Pressable onPress={() => Alert.alert('Clear Saved Tips', 'Remove all saved tips?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: clearSaved }])} style={styles.dangerRow}>
            <ThemedText type="label" style={styles.dangerText}>CLEAR SAVED TIPS</ThemedText>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Pressable onPress={handleResetApp} style={styles.dangerRow}>
            <ThemedText type="label" style={styles.dangerText}>RESET ALL APP DATA</ThemedText>
          </Pressable>
        </TacticalCard>

        <ThemedText type="small" themeColor="textMuted" style={styles.disclaimer}>
          MilBudgetBuddy provides financial education for military families. Not a licensed financial advisor. Consult a CFP for major decisions. Pay estimates are approximations — verify at mypay.dfas.mil.
        </ThemedText>
      </ScrollView>

      <EditPersonalModal visible={showEditPersonal} onClose={() => setShowEditPersonal(false)} />
      <EditPayModal visible={showEditPay} onClose={() => setShowEditPay(false)} />
      <AddKidModal visible={showAddKid} onClose={() => setShowAddKid(false)} onAdd={addKid} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.four },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one, marginTop: Spacing.two },
  backText: { fontSize: 15, fontWeight: '600' },
  eyebrow: { fontSize: 11, marginTop: Spacing.three, letterSpacing: 1 },
  heading: { fontSize: 28, fontWeight: '900', letterSpacing: 1, marginTop: 6, marginBottom: 4 },
  headingSub: { lineHeight: 19, marginBottom: Spacing.one },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionDot: { width: 7, height: 7, borderRadius: 4 },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 12, letterSpacing: 0.8 },

  identityCard: { gap: Spacing.three },
  identityTop: { flexDirection: 'row', alignItems: 'center' },
  identityLeft: { flex: 1, gap: 4 },
  identityRank: { fontSize: 11, letterSpacing: 0.5 },
  identityName: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  identityBranch: { fontSize: 11, letterSpacing: 0.3 },
  identityStats: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: Spacing.two },
  identityStat: { flex: 1, alignItems: 'center', gap: 4 },
  identityStatVal: { fontSize: 17, fontWeight: '800' },
  identityStatLabel: { fontSize: 10, letterSpacing: 0.3, textAlign: 'center' },
  identityDivider: { width: 1, height: 34 },

  // Two edit tiles
  tilesRow: { flexDirection: 'row', gap: Spacing.two },
  editTile: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    padding: Spacing.three, gap: Spacing.two,
  },
  tileIcon: { fontSize: 26, lineHeight: 32 },
  tileTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  tileSummary: { flex: 1, gap: 4, minHeight: 58 },
  tileSummaryLine: { fontSize: 12, lineHeight: 16 },
  tileEditBtn: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.one + 2, marginTop: Spacing.one,
  },
  tileEditBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },

  greetingBtn: { flex: 1, borderWidth: 1, borderRadius: 8, padding: Spacing.two + 2, gap: 5, alignItems: 'center' },
  greetingBtnLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  greetingBtnValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  sectionCard: { gap: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', paddingVertical: Spacing.two },

  // Pending approval inbox
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,179,0,0.15)' },
  pendingLeft: { flex: 1, gap: 3 },
  pendingKid: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, color: '#FFB300' },
  pendingChore: { fontSize: 14, fontWeight: '700' },
  pendingDate: { fontSize: 11 },
  pendingActions: { flexDirection: 'row', gap: Spacing.one },
  pendingBtn: { borderRadius: 8, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2 },
  pendingBtnApprove: { backgroundColor: '#00B27A20', borderWidth: 1, borderColor: '#00B27A60' },
  pendingBtnApproveText: { fontSize: 12, fontWeight: '900', color: '#00B27A', letterSpacing: 0.3 },
  pendingBtnReject: { backgroundColor: Brand.classified + '15', borderWidth: 1, borderColor: Brand.classified + '50', width: 32, alignItems: 'center' },
  pendingBtnRejectText: { fontSize: 13, fontWeight: '900', color: Brand.classified },

  kidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  kidEmoji: { fontSize: 24, width: 36, lineHeight: 32, textAlign: 'center' },
  kidName: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  kidMeta: { fontSize: 11 },
  kidChevron: { fontSize: 20 },
  kidBadge: { backgroundColor: '#FFB300', borderRadius: 8, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  kidBadgeText: { fontSize: 10, fontWeight: '900', color: '#04080F' },
  // A fixed 24x24 circle couldn't grow with the "✕" inside it at larger
  // Settings > Text Size scales. minWidth/minHeight + padding keeps the
  // circle shape at the default size but lets it grow instead of clipping.
  removeKidBtn: { minWidth: 24, minHeight: 24, borderRadius: 12, paddingHorizontal: 3, paddingVertical: 3, backgroundColor: Brand.classified + '15', alignItems: 'center', justifyContent: 'center' },
  removeKidBtnText: { fontSize: 10, lineHeight: 13, color: Brand.classified, fontWeight: '700' },

  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLabel: { fontSize: 15, fontWeight: '600' },
  prefValue: { fontSize: 12 },

  intelStatsCaption: { lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, alignItems: 'center', gap: 5 },
  statVal: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  intelViewAll: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', marginTop: Spacing.two },

  addRowBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  addRowBtnText: { fontSize: 11 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aboutLabel: { fontSize: 11 },
  aboutVal: { fontSize: 14 },
  dangerRow: { paddingVertical: Spacing.two, alignItems: 'center' },
  dangerText: { color: Brand.classified, fontSize: 11 },
  aboutLinkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.one },
  aboutLinkText: { flex: 1, fontSize: 11 },
  aboutChevron: { fontSize: 16, lineHeight: 22 },

  disclaimer: { textAlign: 'center', lineHeight: 16, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
});
