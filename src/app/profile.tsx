import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getStateTaxInfo, US_STATES } from '@/data/state-tax';
import { TIPS } from '@/data/tips';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BranchSelector } from '@/features/profile/components/BranchSelector';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { useThemeColors } from '@/hooks/use-theme';
import {
  cancelDailyTip,
  cancelPayDayReminders,
  requestNotificationPermissions,
  scheduleDailyTip,
  schedulePayDayReminders,
} from '@/services/notifications';
import { useChatStore } from '@/store/chat.store';
import { useEntitlementStore } from '@/store/entitlement.store';
import { useKidsStore } from '@/store/kids.store';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';
import { KidGender, KidProfile, PendingCompletion } from '@/types/kids.types';
import { Installation } from '@/data/installations';
import {
  BRANCH_LABELS,
  MilitaryBranch,
  RankVariant,
  SPECIAL_PAY_LABELS,
  SPECIAL_PAY_RANGES,
  SpecialPayType,
  getRankAbbrev,
} from '@/types/user.types';
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

function SectionLabel({ text }: { text: string }) {
  const tc = useThemeColors();
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
      <ThemedText type="label" style={[styles.sectionLabel, { color: tc.textMuted }]}>{text}</ThemedText>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

// ── Add Kid Modal ──────────────────────────────────────────────────────────────

function AddKidModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (nickname: string, gender: KidGender) => void;
}) {
  const tc = useThemeColors();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<KidGender>('boy');
  const submit = () => {
    if (!nickname.trim()) return;
    onAdd(nickname.trim(), gender);
    setNickname('');
    onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[modalStyles.bg, { backgroundColor: tc.background }]}>
        <SafeAreaView style={modalStyles.safe}>
          <View style={modalStyles.header}>
            <ThemedText style={[modalStyles.title, { color: tc.textPrimary }]}>// NEW CADET</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={[modalStyles.cancel, { color: tc.textMuted }]}>CANCEL</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="label" style={[modalStyles.label, { color: tc.textMuted }]}>NICKNAME</ThemedText>
          <View style={[modalStyles.inputWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Maverick"
              placeholderTextColor={tc.textHint}
              style={[modalStyles.input, { color: tc.textPrimary }]}
              autoFocus
              autoCapitalize="words"
            />
          </View>
          <ThemedText type="label" style={[modalStyles.label, { color: tc.textMuted, marginTop: Spacing.three }]}>THEME</ThemedText>
          <View style={modalStyles.genderRow}>
            {(['boy', 'girl'] as KidGender[]).map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={[modalStyles.genderBtn, { borderColor: tc.borderColor }, gender === g && modalStyles.genderBtnActive]}>
                <ThemedText style={modalStyles.genderEmoji}>{g === 'boy' ? '🪖' : '⭐'}</ThemedText>
                <ThemedText type="label" style={[modalStyles.genderLabel, { color: tc.textMuted }, gender === g && { color: Brand.accent }]}>
                  {g === 'boy' ? 'NAVY / OLIVE' : 'NAVY / PURPLE'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={submit} style={[modalStyles.addBtn, !nickname.trim() && { opacity: 0.4 }]}>
            <ThemedText style={modalStyles.addBtnText}>ACTIVATE PROFILE →</ThemedText>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  cancel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  label: { fontSize: 9, marginBottom: 6 },
  inputWrap: { borderWidth: 1, borderRadius: 4, paddingHorizontal: Spacing.three },
  input: { fontSize: 18, fontWeight: '700', paddingVertical: Spacing.two + 4 },
  genderRow: { flexDirection: 'row', gap: Spacing.two },
  genderBtn: { flex: 1, borderWidth: 1.5, borderRadius: 4, padding: Spacing.three, alignItems: 'center', gap: 4 },
  genderBtnActive: { borderColor: Brand.accent },
  genderEmoji: { fontSize: 32, lineHeight: 40 },
  genderLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  addBtn: { backgroundColor: Brand.accent, borderRadius: 4, padding: Spacing.three, alignItems: 'center', marginTop: 'auto' },
  addBtnText: { color: '#04080F', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});

// ── State Picker Modal ─────────────────────────────────────────────────────────

function StatePickerModal({ visible, selected, onSelect, onClose }: {
  visible: boolean;
  selected: string | undefined;
  onSelect: (code: string) => void;
  onClose: () => void;
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
              <ThemedText style={stateStyles.cancel}>DONE</ThemedText>
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
                    <ThemedText style={[stateStyles.code, { color: tc.textMuted }, isSelected && { color: Brand.accent }]}>{s.code}</ThemedText>
                    <ThemedText style={[stateStyles.name, { color: tc.textHint }, isSelected && { color: tc.textPrimary }]}>{s.name}</ThemedText>
                  </View>
                  <View style={stateStyles.rowRight}>
                    {s.militaryExempt ? (
                      <View style={stateStyles.exemptBadge}>
                        <ThemedText type="label" style={stateStyles.exemptText}>NO TAX</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={[stateStyles.rate, { color: tc.textMuted, fontFamily: Fonts.data }]}>
                        ~{(s.effectiveRate * 100).toFixed(1)}%
                      </ThemedText>
                    )}
                    {isSelected && <ThemedText style={stateStyles.check}>✓</ThemedText>}
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
  cancel: { fontSize: 12, fontWeight: '700', color: Brand.tactical, letterSpacing: 1 },
  searchWrap: { borderWidth: 1, borderRadius: 4, paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  search: { fontSize: 14, paddingVertical: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  code: { fontSize: 13, fontWeight: '800', width: 36, fontFamily: Fonts.data },
  name: { fontSize: 13 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  exemptBadge: { backgroundColor: Brand.tactical + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  exemptText: { color: Brand.tactical, fontSize: 7 },
  rate: { fontSize: 12 },
  check: { color: Brand.accent, fontSize: 16, width: 20, textAlign: 'center' },
});

// ── Special Pay Type Picker ────────────────────────────────────────────────────

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
            <Pressable onPress={onClose}><ThemedText style={ptStyles.done}>DONE</ThemedText></Pressable>
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
                    <ThemedText style={[ptStyles.label, { color: tc.textPrimary }, isSelected && { color: Brand.accent }]}>{SPECIAL_PAY_LABELS[type]}</ThemedText>
                    <ThemedText type="label" style={[ptStyles.range, { color: tc.textMuted }]}>Typical: {SPECIAL_PAY_RANGES[type]}</ThemedText>
                  </View>
                  {isSelected && <ThemedText style={ptStyles.check}>✓</ThemedText>}
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
  done: { fontSize: 12, fontWeight: '700', color: Brand.tactical, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  icon: { fontSize: 22, width: 32, textAlign: 'center', lineHeight: 28 },
  rowText: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '600' },
  range: { fontSize: 10 },
  check: { color: Brand.accent, fontSize: 18 },
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
  const hasSpouse      = useUserStore((s) => s.hasSpouse);
  const numChildren    = useUserStore((s) => s.numChildren);
  const stateResidence = useUserStore((s) => s.stateResidence);
  const dateOfEnlist   = useUserStore((s) => s.dateOfEnlistment);
  const dateOfRank     = useUserStore((s) => s.dateOfRank);
  const storedGsGrade  = useUserStore((s) => s.gsGrade);
  const storedGsStep   = useUserStore((s) => s.gsStep);
  const setPersonalDetails = useUserStore((s) => s.setPersonalDetails);
  const setGSInfo      = useUserStore((s) => s.setGSInfo);
  const setBranch      = useUserStore((s) => s.setBranch);
  const branch         = useUserStore((s) => s.branch);

  const isCivilian = branch === 'other';

  const [grade, setGrade]         = useState<PayGrade>(payGrade ?? 'E5');
  const [rankVariant, setRankVariant] = useState<RankVariant>(storedVariant ?? 'default');
  const [ln, setLn]               = useState(lastName ?? '');
  const [nn, setNn]               = useState(nickname ?? '');
  const [y, setY]                 = useState(yos);
  const [yManual, setYManual]     = useState(false);
  const [station, setStation]     = useState<Installation | null>(null);
  const [spouse, setSpouse]       = useState(hasSpouse);
  const [children, setChildren]   = useState(numChildren);
  const [state, setState]         = useState(stateResidence ?? '');
  const [enlistDate, setEnlistDate] = useState(dateOfEnlist ?? '');
  const [rankDate, setRankDate]   = useState(dateOfRank ?? '');

  // Auto-calc YOS from enlistment date unless manually overridden
  useEffect(() => {
    if (enlistDate && !yManual) {
      const ms = Date.now() - new Date(enlistDate).getTime();
      const calc = Math.floor(ms / (365.25 * 864e5));
      if (calc >= 0 && calc <= 40) setY(calc);
    }
  }, [enlistDate]);
  const [gsGrade, setGsGrade]     = useState(storedGsGrade ?? 7);
  const [gsStep, setGsStep]       = useState(storedGsStep ?? 1);
  const [showStatePicker, setShowStatePicker]   = useState(false);
  const [showEnlistPicker, setShowEnlistPicker] = useState(false);
  const [showRankPicker, setShowRankPicker]     = useState(false);

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
    if (isCivilian) {
      setGSInfo(gsGrade, gsStep, ln, nn, enlistDate || undefined);
    }
    setPersonalDetails({
      payGrade: grade,
      lastName: ln,
      nickname: nn,
      yos: y,
      mhaZip: station?.mhaZip ?? mhaZip ?? '',
      installationName: station?.name ?? installName ?? '',
      hasSpouse: spouse,
      numChildren: children,
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
            <Pressable onPress={save}><ThemedText style={editStyles.save}>SAVE</ThemedText></Pressable>
          </View>

          <ScrollView
            contentContainerStyle={editStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">

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
                      <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsGrade === g && { color: Brand.accent }]}>
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
                      <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsStep === s && { color: Brand.accent }]}>
                        {s}
                      </ThemedText>
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
                          <ThemedText style={[editStyles.variantAbbrev, { color: tc.textHint }, active && { color: Brand.accent }]}>{opt.abbrev}</ThemedText>
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
            {enlistDate && yearsFromDate(enlistDate) !== null && (
              <ThemedText style={editStyles.dateHint}>↳ {yearsFromDate(enlistDate)} years of service (auto-calculated)</ThemedText>
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
              <ThemedText style={editStyles.dateHint}>↳ {yearsFromDate(rankDate)} years in grade · Used for High-3 calculator</ThemedText>
            )}

            <NumberStepper
              label={enlistDate ? 'Years of Service (auto-calculated — tap to override)' : 'Years of Service'}
              value={y}
              min={0}
              max={40}
              onChange={(v) => { setY(v); setYManual(true); }}
              unit="yrs"
            />

            {/* Duty Station */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>DUTY STATION</ThemedText>
            <StationPicker label="Duty Station" selected={station} onSelect={setStation} conusOnly />

            {/* State */}
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>STATE OF RESIDENCE</ThemedText>
            <Pressable onPress={() => setShowStatePicker(true)} style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: state ? tc.textPrimary : placeholder, flex: 1, paddingVertical: Spacing.two + 4 }]}>
                {stateInfo ? `${stateInfo.name} (${stateInfo.code})` : 'Tap to select state'}
              </ThemedText>
              <ThemedText style={{ color: Brand.accent, fontSize: 18, paddingRight: 4 }}>›</ThemedText>
            </Pressable>
            {stateInfo && (
              <ThemedText style={editStyles.dateHint}>
                {stateInfo.militaryExempt ? '✓ Military pay exempt' : `~${(stateInfo.effectiveRate * 100).toFixed(1)}% est. effective rate`}
              </ThemedText>
            )}

            {/* Family */}
            <View style={editStyles.toggleRow}>
              <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Spouse / Dependent</ThemedText>
              <Switch value={spouse} onValueChange={setSpouse} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>
            <NumberStepper label="Dependent Children" value={children} min={0} max={8} onChange={setChildren} />

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <StatePickerModal
        visible={showStatePicker}
        selected={state}
        onSelect={setState}
        onClose={() => setShowStatePicker(false)}
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
    </Modal>
  );
}

// ── Edit Pay Modal ─────────────────────────────────────────────────────────────

function EditPayModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
  const addSpecialPay    = useUserStore((s) => s.addSpecialPay);
  const removeSpecialPay = useUserStore((s) => s.removeSpecialPay);

  const [tsp, setTsp]         = useState(tspContribPct);
  const [rothTsp, setRothTsp] = useState(rothTspPct);
  const [dental, setDental]   = useState(hasDentalFamily);
  const [sgl, setSgl]         = useState(sglOptOut);
  const [spouseAmt, setSpouseAmt] = useState(spouseIncome > 0 ? spouseIncome.toString() : '');
  const [basePayStr, setBasePayStr] = useState(lesOverrides.basePayOverride ? lesOverrides.basePayOverride.toString() : '');
  const [bahStr, setBahStr]   = useState(lesOverrides.bahOverride ? lesOverrides.bahOverride.toString() : '');
  const [basStr, setBasStr]   = useState(lesOverrides.basOverride ? lesOverrides.basOverride.toString() : '');

  // Special pay inline add form
  const [showAddPay, setShowAddPay]         = useState(false);
  const [selectedPayType, setSelectedPayType] = useState<SpecialPayType>('language');
  const [payAmountInput, setPayAmountInput] = useState('');
  const [showPayTypePicker, setShowPayTypePicker] = useState(false);

  const save = () => {
    Keyboard.dismiss();
    setPayDetails({
      tspContribPct: tsp,
      rothTspPct: rothTsp,
      hasDentalFamily: dental,
      sglOptOut: sgl,
      spouseMonthlyIncome: parseFloat(spouseAmt) || 0,
      basePayOverride: parseFloat(basePayStr) || undefined,
      bahOverride: parseFloat(bahStr) || undefined,
      basOverride: parseFloat(basStr) || undefined,
    });
    onClose();
  };

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
            <Pressable onPress={save}><ThemedText style={editStyles.save}>SAVE</ThemedText></Pressable>
          </View>

          <ScrollView
            contentContainerStyle={editStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">

            {/* LES Overrides */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>📋 LES OVERRIDES</ThemedText>
              <ThemedText style={[editStyles.sectionHeadSub, { color: tc.textHint }]}>Enter actual amounts from your LES to override calculated values. Leave blank to use calculated rates.</ThemedText>
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>BASE PAY ($/mo from LES)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={basePayStr} onChangeText={setBasePayStr} placeholder="Leave blank to use calculated"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="next" />
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>BAH ($/mo from LES)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={bahStr} onChangeText={setBahStr} placeholder="Leave blank to use calculated"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="next" />
            </View>

            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>BAS ($/mo from LES)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg, borderColor: tc.borderColor, flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={[editStyles.input, { color: tc.textHint, paddingVertical: Spacing.two + 4 }]}>$</ThemedText>
              <TextInput value={basStr} onChangeText={setBasStr} placeholder="Leave blank to use calculated"
                placeholderTextColor={placeholder} keyboardType="decimal-pad"
                style={[editStyles.input, { color: tc.textPrimary, flex: 1 }]} returnKeyType="next" />
            </View>

            {/* TSP */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>📈 TSP / RETIREMENT</ThemedText>
            </View>
            <ThemedText style={[editStyles.fieldHint, { color: tc.textMuted }]}>
              Enter the % you contribute from your base pay. Check your LES block "DEDUCTIONS" — look for Traditional TSP and/or Roth TSP lines.
            </ThemedText>
            <NumberStepper label="Traditional TSP" value={tsp} min={0} max={100} onChange={setTsp} unit="%" />
            <NumberStepper label="Roth TSP" value={rothTsp} min={0} max={100} onChange={setRothTsp} unit="%" />
            <ThemedText style={[editStyles.fieldHint, { color: tc.textMuted }]}>
              Total TSP: {tsp + rothTsp}% of base pay. Combined cannot exceed IRS annual limit ($23,500 for FY2026).
            </ThemedText>

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
                  <ThemedText style={editStyles.payAmt}>${pay.monthlyAmount.toFixed(0)}/mo</ThemedText>
                </View>
                <Pressable onPress={() => handleRemoveSpecialPay(pay.id, pay.customLabel ?? SPECIAL_PAY_LABELS[pay.type])} style={editStyles.removeBtn}>
                  <ThemedText style={editStyles.removeBtnText}>✕</ThemedText>
                </Pressable>
              </View>
            ))}

            {specialPays.length > 0 && (
              <View style={editStyles.totalRow}>
                <ThemedText style={[editStyles.totalLabel, { color: tc.textHint }]}>TOTAL SPECIAL PAY</ThemedText>
                <ThemedText style={[editStyles.totalAmt, { fontFamily: Fonts.data }]}>${totalSpecialPay}/mo</ThemedText>
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
                  <ThemedText style={editStyles.payTypeDropdownChevron}>▼</ThemedText>
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
                <ThemedText style={editStyles.amountDisplay}>${payAmountInput || '0'}/mo</ThemedText>
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
                <ThemedText style={editStyles.addRowBtnText}>+ ADD SPECIAL PAY</ThemedText>
              </Pressable>
            )}

            {/* Deductions */}
            <View style={[editStyles.sectionHead, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={[editStyles.sectionHeadText, { color: tc.textPrimary }]}>📉 DEDUCTIONS</ThemedText>
            </View>

            <View style={editStyles.toggleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Family Dental Plan</ThemedText>
                <ThemedText style={[editStyles.toggleSub, { color: tc.textHint }]}>-$36/mo deduction</ThemedText>
              </View>
              <Switch value={dental} onValueChange={setDental} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>

            <View style={editStyles.toggleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Opt Out of SGLI</ThemedText>
                <ThemedText style={[editStyles.toggleSub, { color: tc.textHint }]}>-$29/mo savings (removes coverage)</ThemedText>
              </View>
              <Switch value={sgl} onValueChange={setSgl} trackColor={{ true: Brand.classified }} thumbColor="#FFF" />
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
  save: { fontSize: 13, color: Brand.tactical, fontWeight: '800', letterSpacing: 0.5 },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  fieldHint: { fontSize: 10, lineHeight: 14 },
  dateHint: { color: Brand.tactical, fontSize: 10, marginTop: -Spacing.two },
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
  payAmt: { color: Brand.tactical, fontSize: 10 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Brand.classified + '20', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: Brand.classified, fontSize: 13, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.one },
  totalLabel: { fontSize: 10 },
  totalAmt: { fontSize: 16, fontWeight: '700', color: Brand.tactical },

  addPayForm: { gap: Spacing.two },
  payTypeDropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two, gap: Spacing.two },
  payTypeDropdownLabel: { fontSize: 14, fontWeight: '600' },
  payTypeDropdownRange: { fontSize: 9, marginTop: 2 },
  payTypeDropdownChevron: { fontSize: 12, color: Brand.accent },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  numpadKey: { width: '30.5%', paddingVertical: Spacing.two, alignItems: 'center', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  numpadKeyBlank: { backgroundColor: 'transparent' },
  numpadKeyText: { fontSize: 20, fontWeight: '500' },
  amountDisplay: { fontSize: 28, fontWeight: '800', color: Brand.accent, fontFamily: Fonts.data, textAlign: 'center' },
  formButtons: { flexDirection: 'row', gap: Spacing.two },
  formBtnCancel: { flex: 1, borderWidth: 1, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  formBtnAdd: { flex: 1, backgroundColor: Brand.accent, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  addRowBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  addRowBtnText: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

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
  const dateOfRank     = useUserStore((s) => s.dateOfRank);
  const setNotifications = useUserStore((s) => s.setNotifications);
  const resetAll       = useUserStore((s) => s.resetAll);

  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [showEditPay, setShowEditPay]           = useState(false);
  const [showAddKid, setShowAddKid]             = useState(false);

  const foundingMember = useEntitlementStore((s) => s.foundingMember);

  const savedTipIds = useTipsStore((s) => s.savedTipIds);
  const clearSaved  = () => useTipsStore.setState({ savedTipIds: [] }, false);
  const clearChat   = useChatStore((s) => s.clearChat);

  const kids        = useKidsStore((s) => s.kids);
  const addKid      = useKidsStore((s) => s.addKid);
  const removeKid   = useKidsStore((s) => s.removeKid);
  const approveCompletion = useKidsStore((s) => s.approveCompletion);
  const rejectCompletion  = useKidsStore((s) => s.rejectCompletion);

  useEffect(() => { useKidsStore.getState().hydrate(); }, []);

  const rankAbbrev    = getRankAbbrev(branch, payGrade, rankVariant);
  const displayName   = nickname || lastName?.toUpperCase() || 'UNNAMED';
  const stateInfo     = getStateTaxInfo(stateResidence);
  const totalSpecialPay = specialPays.reduce((s, p) => s + p.monthlyAmount, 0);
  const enlistYears   = yearsFromDate(dateOfEnlist);

  // All pending completions across all kids
  const allPending: Array<{ kid: KidProfile; completion: PendingCompletion }> = kids.flatMap((kid) =>
    (kid.pendingCompletions ?? []).map((c) => ({ kid, completion: c })),
  );

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) { Alert.alert('Permission Required', 'Enable notifications in device settings.'); return; }
      setNotifications(true);
      scheduleDailyTip(notificationHour, notificationMinute);
      schedulePayDayReminders();
    } else {
      setNotifications(false);
      cancelDailyTip();
      cancelPayDayReminders();
    }
  };

  const handleResetApp = () => {
    Alert.alert('Reset All App Data', 'This will permanently delete your profile, budget, goals, and all saved data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => {
        Alert.alert('Final Confirmation', 'Are you absolutely sure? All data will be erased.', [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Erase All Data', style: 'destructive', onPress: async () => {
            resetAll(); clearSaved(); clearChat();
            await AsyncStorage.clear();
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
          <ThemedText type="label" style={styles.eyebrow}>// PERSONNEL FILE</ThemedText>
          <ThemedText style={[styles.heading, { color: tc.textPrimary }]}>PROFILE</ThemedText>
        </SafeAreaView>

        {/* ── Identity Card ─────────────────────────────────────────── */}
        <TacticalCard accentColor={Brand.accent} style={styles.identityCard}>
          {foundingMember && (
            <View style={styles.foundingBadge}>
              <ThemedText style={styles.foundingBadgeText}>🏅 FOUNDING MEMBER</ThemedText>
            </View>
          )}
          <View style={styles.identityTop}>
            <View style={styles.identityLeft}>
              <ThemedText type="label" style={styles.identityRank}>{rankAbbrev || '—'}</ThemedText>
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
        <View style={styles.tilesRow}>
          {/* PAY tile */}
          <Pressable
            onPress={() => setShowEditPay(true)}
            style={({ pressed }) => [styles.editTile, { borderColor: Brand.tactical + '60', backgroundColor: Brand.tactical + '08' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.tileIcon}>💰</ThemedText>
            <ThemedText style={[styles.tileTitle, { color: Brand.tactical }]}>PAY</ThemedText>
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
            <View style={styles.tileEditBtn}>
              <ThemedText style={[styles.tileEditBtnText, { color: Brand.tactical }]}>EDIT PAY ›</ThemedText>
            </View>
          </Pressable>

          {/* PERSONAL tile */}
          <Pressable
            onPress={() => setShowEditPersonal(true)}
            style={({ pressed }) => [styles.editTile, { borderColor: Brand.accent + '60', backgroundColor: Brand.accent + '08' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.tileIcon}>🪖</ThemedText>
            <ThemedText style={[styles.tileTitle, { color: Brand.accent }]}>PERSONAL</ThemedText>
            <View style={styles.tileSummary}>
              {payGrade && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>{payGrade} · {lastName?.toUpperCase() || 'NAME NOT SET'}</ThemedText>}
              {installName ? <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]} numberOfLines={1}>{installName}</ThemedText> : mhaZip ? <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>ZIP {mhaZip}</ThemedText> : null}
              {stateResidence && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Residence: {stateResidence}</ThemedText>}
              {dateOfEnlist && <ThemedText style={[styles.tileSummaryLine, { color: tc.textSecondary }]}>Enl: {dateOfEnlist}</ThemedText>}
            </View>
            <View style={styles.tileEditBtn}>
              <ThemedText style={[styles.tileEditBtnText, { color: Brand.accent }]}>EDIT PERSONAL ›</ThemedText>
            </View>
          </Pressable>
        </View>

        {/* ── Greeting Style ─────────────────────────────────────────── */}
        <SectionLabel text="HOME SCREEN GREETING" />
        <TacticalCard accentColor={tc.borderColor} style={styles.sectionCard}>
          <ThemedText type="label" style={[styles.emptyText, { color: tc.textSecondary }]}>How should we greet you on the home screen?</ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two }}>
            {(['nickname', 'rank'] as const).map((style) => {
              const label = style === 'nickname'
                ? `${nickname || 'Maverick'}`
                : `${rankAbbrev || 'SGT'} ${lastName?.toUpperCase() || 'SMITH'}`;
              const active = (greetingStyle ?? 'nickname') === style;
              return (
                <Pressable key={style} onPress={() => setGreetingStyle(style)}
                  style={[styles.greetingBtn, { borderColor: tc.borderColor }, active && { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' }]}>
                  <ThemedText style={[styles.greetingBtnLabel, { color: tc.textHint }, active && { color: Brand.accent }]}>
                    {style === 'nickname' ? '😎 NICKNAME' : '🪖 RANK'}
                  </ThemedText>
                  <ThemedText style={[styles.greetingBtnValue, { color: tc.textPrimary }, active && { color: Brand.accent }]} numberOfLines={1}>{label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </TacticalCard>

        {/* ── Commander's Inbox ──────────────────────────────────────── */}
        {allPending.length > 0 && (
          <>
            <SectionLabel text={`COMMANDER'S INBOX — ${allPending.length} PENDING`} />
            <TacticalCard accentColor="#FFB300" style={[styles.sectionCard, { borderColor: '#FFB30040' }]}>
              <ThemedText type="label" style={{ color: '#FFB300', fontSize: 10, marginBottom: Spacing.one }}>
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
        <SectionLabel text="CADET PROFILES" />
        <TacticalCard accentColor={tc.borderColor} style={styles.sectionCard}>
          {kids.length === 0 && (
            <ThemedText type="label" style={[styles.emptyText, { color: tc.textSecondary }]}>No cadet profiles. Add a child to give them their own goals and chores app.</ThemedText>
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
                    <ThemedText type="label" style={[styles.kidMeta, { color: tc.textMuted }]}>
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
            <ThemedText type="label" style={styles.addRowBtnText}>+ ENROLL NEW CADET</ThemedText>
          </Pressable>
        </TacticalCard>

        {/* ── Preferences ────────────────────────────────────────────── */}
        <SectionLabel text="PREFERENCES" />
        <TacticalCard accentColor={tc.borderColor} style={styles.sectionCard}>
          <View style={styles.prefRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={[styles.prefLabel, { color: tc.textPrimary }]}>Daily Tip Reminder</ThemedText>
              <ThemedText type="label" style={[styles.prefValue, { color: tc.textHint }]}>
                {notificationsEnabled ? `${formatTime(notificationHour, notificationMinute)} daily` : 'Off'}
              </ThemedText>
            </View>
            <Switch value={notificationsEnabled} onValueChange={handleNotificationToggle} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
          </View>
        </TacticalCard>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <SectionLabel text="INTEL STATS" />
        <View style={styles.statsRow}>
          {[
            { val: savedTipIds.length, label: 'SAVED' },
            { val: TIPS.length, label: 'TOTAL TIPS' },
            { val: 6, label: 'CATEGORIES' },
          ].map((s) => (
            <TacticalCard key={s.label} accentColor={tc.borderColor} style={styles.statCard}>
              <ThemedText style={[styles.statVal, { fontFamily: Fonts.data }]}>{s.val}</ThemedText>
              <ThemedText type="label" style={[styles.statLabel, { color: tc.textSecondary }]}>{s.label}</ThemedText>
            </TacticalCard>
          ))}
        </View>

        {/* ── About ──────────────────────────────────────────────────── */}
        <SectionLabel text="ABOUT" />
        <TacticalCard accentColor={tc.borderColor} style={styles.sectionCard}>
          <View style={styles.aboutRow}>
            <ThemedText type="label" style={[styles.aboutLabel, { color: tc.textHint }]}>VERSION</ThemedText>
            <ThemedText style={[styles.aboutVal, { color: tc.textPrimary, fontFamily: Fonts.data }]}>{APP_VERSION}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Pressable onPress={() => router.push('/legal' as any)} style={styles.aboutLinkRow}>
            <ThemedText type="label" style={styles.aboutLinkText}>PRIVACY POLICY & TERMS</ThemedText>
            <ThemedText style={styles.aboutChevron}>›</ThemedText>
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

        <ThemedText type="label" style={[styles.disclaimer, { color: tc.textMuted }]}>
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
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  eyebrow: { color: Brand.tactical, fontSize: 10, marginTop: Spacing.three, letterSpacing: 1 },
  heading: { fontSize: 28, fontWeight: '900', letterSpacing: 1, marginTop: 6, marginBottom: Spacing.one },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 9 },

  identityCard: { gap: Spacing.three },
  foundingBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#C8A800' + '20', borderWidth: 1, borderColor: '#C8A800' + '50', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  foundingBadgeText: { color: '#C8A800', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  identityTop: { flexDirection: 'row', alignItems: 'center' },
  identityLeft: { flex: 1, gap: 3 },
  identityRank: { color: Brand.accent, fontSize: 10, letterSpacing: 0.5 },
  identityName: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  identityBranch: { fontSize: 10, letterSpacing: 0.3 },
  identityStats: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: Spacing.two },
  identityStat: { flex: 1, alignItems: 'center', gap: 3 },
  identityStatVal: { fontSize: 17, fontWeight: '800' },
  identityStatLabel: { fontSize: 9, letterSpacing: 0.3, textAlign: 'center' },
  identityDivider: { width: 1, height: 34 },

  // Two edit tiles
  tilesRow: { flexDirection: 'row', gap: Spacing.two },
  editTile: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    padding: Spacing.three, gap: Spacing.two,
  },
  tileIcon: { fontSize: 26, lineHeight: 32 },
  tileTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  tileSummary: { flex: 1, gap: 3, minHeight: 54 },
  tileSummaryLine: { fontSize: 11, lineHeight: 15 },
  tileEditBtn: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.one + 2, marginTop: Spacing.one,
  },
  tileEditBtnText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  greetingBtn: { flex: 1, borderWidth: 1, borderRadius: 6, padding: Spacing.two, gap: 4, alignItems: 'center' },
  greetingBtnLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  greetingBtnValue: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  sectionCard: { gap: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: 'center', paddingVertical: Spacing.two },

  // Pending approval inbox
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,179,0,0.15)' },
  pendingLeft: { flex: 1, gap: 2 },
  pendingKid: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, color: '#FFB300' },
  pendingChore: { fontSize: 14, fontWeight: '700' },
  pendingDate: { fontSize: 10 },
  pendingActions: { flexDirection: 'row', gap: Spacing.one },
  pendingBtn: { borderRadius: 8, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2 },
  pendingBtnApprove: { backgroundColor: '#00B27A20', borderWidth: 1, borderColor: '#00B27A60' },
  pendingBtnApproveText: { fontSize: 11, fontWeight: '900', color: '#00B27A', letterSpacing: 0.3 },
  pendingBtnReject: { backgroundColor: Brand.classified + '15', borderWidth: 1, borderColor: Brand.classified + '50', width: 32, alignItems: 'center' },
  pendingBtnRejectText: { fontSize: 13, fontWeight: '900', color: Brand.classified },

  kidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  kidEmoji: { fontSize: 24, width: 36, lineHeight: 32, textAlign: 'center' },
  kidName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  kidMeta: { fontSize: 9 },
  kidChevron: { fontSize: 20 },
  kidBadge: { backgroundColor: '#FFB300', borderRadius: 8, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  kidBadgeText: { fontSize: 10, fontWeight: '900', color: '#04080F' },
  removeKidBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: Brand.classified + '15', alignItems: 'center', justifyContent: 'center' },
  removeKidBtnText: { fontSize: 10, color: Brand.classified, fontWeight: '700' },

  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLabel: { fontSize: 15, fontWeight: '600' },
  prefValue: { fontSize: 9 },

  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: '800', color: Brand.accent },
  statLabel: { fontSize: 10 },

  addRowBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  addRowBtnText: { color: Brand.tactical, fontSize: 10 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aboutLabel: { fontSize: 10 },
  aboutVal: { fontSize: 14 },
  dangerRow: { paddingVertical: Spacing.two, alignItems: 'center' },
  dangerText: { color: Brand.classified, fontSize: 10 },
  aboutLinkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.one },
  aboutLinkText: { flex: 1, color: Brand.tactical, fontSize: 10 },
  aboutChevron: { color: Brand.tactical, fontSize: 16, lineHeight: 22 },

  disclaimer: { fontSize: 8, textAlign: 'center', lineHeight: 14, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
});
