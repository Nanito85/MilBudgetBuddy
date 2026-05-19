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

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme';
import { getStateTaxInfo, US_STATES } from '@/data/state-tax';
import { TIPS } from '@/data/tips';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BranchSelector } from '@/features/profile/components/BranchSelector';
import {
  cancelDailyTip,
  cancelPayDayReminders,
  requestNotificationPermissions,
  scheduleDailyTip,
  schedulePayDayReminders,
} from '@/services/notifications';
import { useChatStore } from '@/store/chat.store';
import { useKidsStore } from '@/store/kids.store';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';
import { KidGender, KidProfile } from '@/types/kids.types';
import {
  BRANCH_LABELS,
  MilitaryBranch,
  SPECIAL_PAY_LABELS,
  SPECIAL_PAY_RANGES,
  SpecialPayType,
  getRankAbbrev,
} from '@/types/user.types';
import { PayGrade } from '@/data/bah-rates';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { Installation } from '@/data/installations';

const APP_VERSION = '1.0.0';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLine} />
      <ThemedText type="label" style={styles.sectionLabel}>{text}</ThemedText>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ── Add Kid Modal ──────────────────────────────────────────────────────────────

function AddKidModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (nickname: string, gender: KidGender) => void;
}) {
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
      <View style={modalStyles.bg}>
        <SafeAreaView style={modalStyles.safe}>
          <View style={modalStyles.header}>
            <ThemedText style={modalStyles.title}>// NEW CADET</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={modalStyles.cancel}>CANCEL</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="label" style={modalStyles.label}>NICKNAME</ThemedText>
          <View style={modalStyles.inputWrap}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Maverick"
              placeholderTextColor="#2A4A60"
              style={modalStyles.input}
              autoFocus
              autoCapitalize="words"
            />
          </View>
          <ThemedText type="label" style={[modalStyles.label, { marginTop: Spacing.three }]}>THEME</ThemedText>
          <View style={modalStyles.genderRow}>
            {(['boy', 'girl'] as KidGender[]).map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={[modalStyles.genderBtn, gender === g && modalStyles.genderBtnActive]}>
                <ThemedText style={modalStyles.genderEmoji}>{g === 'boy' ? '🪖' : '⭐'}</ThemedText>
                <ThemedText type="label" style={[modalStyles.genderLabel, gender === g && { color: Brand.accent }]}>
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
  bg: { flex: 1, backgroundColor: '#04080F' },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 1, color: '#C8D8E8' },
  cancel: { fontSize: 12, fontWeight: '700', color: '#3D6080', letterSpacing: 1 },
  label: { color: '#3D6080', fontSize: 9, marginBottom: 6 },
  inputWrap: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 4, paddingHorizontal: Spacing.three },
  input: { fontSize: 18, fontWeight: '700', paddingVertical: Spacing.two + 4, color: '#C8D8E8' },
  genderRow: { flexDirection: 'row', gap: Spacing.two },
  genderBtn: { flex: 1, borderWidth: 1.5, borderColor: Brand.border, borderRadius: 4, padding: Spacing.three, alignItems: 'center', gap: 4 },
  genderBtnActive: { borderColor: Brand.accent },
  genderEmoji: { fontSize: 32, lineHeight: 40 },
  genderLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#3D6080' },
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
  const [query, setQuery] = useState('');
  const filtered = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={stateStyles.bg}>
        <SafeAreaView style={stateStyles.safe}>
          <View style={stateStyles.header}>
            <ThemedText style={stateStyles.title}>// SELECT STATE</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={stateStyles.cancel}>DONE</ThemedText>
            </Pressable>
          </View>
          <View style={stateStyles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search state..."
              placeholderTextColor="#2A4A60"
              style={stateStyles.search}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map((s) => {
              const isSelected = selected === s.code;
              return (
                <Pressable
                  key={s.code}
                  onPress={() => { onSelect(s.code); onClose(); }}
                  style={[stateStyles.row, isSelected && stateStyles.rowSelected]}>
                  <View style={stateStyles.rowLeft}>
                    <ThemedText style={[stateStyles.code, isSelected && { color: Brand.accent }]}>{s.code}</ThemedText>
                    <ThemedText style={[stateStyles.name, isSelected && { color: '#C8D8E8' }]}>{s.name}</ThemedText>
                  </View>
                  <View style={stateStyles.rowRight}>
                    {s.militaryExempt ? (
                      <View style={stateStyles.exemptBadge}>
                        <ThemedText type="label" style={stateStyles.exemptText}>NO TAX</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={[stateStyles.rate, { fontFamily: Fonts.data }]}>
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
  bg: { flex: 1, backgroundColor: '#04080F' },
  safe: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#C8D8E8' },
  cancel: { fontSize: 12, fontWeight: '700', color: Brand.tactical, letterSpacing: 1 },
  searchWrap: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 4, paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  search: { fontSize: 14, paddingVertical: Spacing.two, color: '#C8D8E8' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  code: { fontSize: 13, fontWeight: '800', color: '#3D6080', width: 36, fontFamily: Fonts.data },
  name: { fontSize: 13, color: '#4D7A9A' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  exemptBadge: { backgroundColor: Brand.tactical + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  exemptText: { color: Brand.tactical, fontSize: 7 },
  rate: { color: '#3D6080', fontSize: 12 },
  check: { color: Brand.accent, fontSize: 16, width: 20, textAlign: 'center' },
});

// ── Special Pay Type Picker Modal ─────────────────────────────────────────────

const PAY_TYPE_ICONS: Record<SpecialPayType, string> = {
  language: '🗣️',
  aviation_acip: '✈️',
  submarine: '🌊',
  diving: '🤿',
  parachute: '🪂',
  sdap: '⭐',
  hazardous_hdip: '⚠️',
  sea_pay: '⚓',
  hostile_fire: '🪖',
  nuclear: '⚛️',
  foreign_language_bonus: '🌐',
  assignment_incentive: '🎯',
  other: '💰',
};

function PayTypePickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: SpecialPayType;
  onSelect: (type: SpecialPayType) => void;
  onClose: () => void;
}) {
  const ALL_TYPES = Object.keys(SPECIAL_PAY_LABELS) as SpecialPayType[];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ptStyles.bg}>
        <SafeAreaView style={ptStyles.safe}>
          <View style={ptStyles.header}>
            <ThemedText style={ptStyles.title}>// SELECT PAY TYPE</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={ptStyles.done}>DONE</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="label" style={ptStyles.hint}>
            Select the type of special or incentive pay to add.
          </ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALL_TYPES.map((type) => {
              const isSelected = selected === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => { onSelect(type); onClose(); }}
                  style={[ptStyles.row, isSelected && ptStyles.rowSelected]}>
                  <ThemedText style={ptStyles.icon}>{PAY_TYPE_ICONS[type]}</ThemedText>
                  <View style={ptStyles.rowText}>
                    <ThemedText style={[ptStyles.label, isSelected && { color: Brand.accent }]}>
                      {SPECIAL_PAY_LABELS[type]}
                    </ThemedText>
                    <ThemedText type="label" style={ptStyles.range}>
                      Typical: {SPECIAL_PAY_RANGES[type]}
                    </ThemedText>
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
  bg: { flex: 1, backgroundColor: '#04080F' },
  safe: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#C8D8E8' },
  done: { fontSize: 12, fontWeight: '700', color: Brand.tactical, letterSpacing: 1 },
  hint: { color: '#3D6080', fontSize: 10, marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
  },
  rowSelected: { backgroundColor: Brand.accent + '10' },
  icon: { fontSize: 22, width: 32, textAlign: 'center', lineHeight: 28 },
  rowText: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#C8D8E8' },
  range: { color: '#3D6080', fontSize: 10 },
  check: { color: Brand.accent, fontSize: 18 },
});

// ── Edit Service Info Modal ────────────────────────────────────────────────────

function EditServiceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const appTheme = useAppTheme();
  const isDark = appTheme === 'dark';
  const modalBg   = isDark ? '#04080F' : '#F0F4F8';
  const inputBg   = isDark ? '#080E1C' : '#FFFFFF';
  const inputText = isDark ? '#C8D8E8' : '#0D1E2E';
  const placeholder = '#4A6A84';

  const payGrade = useUserStore((s) => s.payGrade);
  const lastName = useUserStore((s) => s.lastName);
  const nickname = useUserStore((s) => s.nickname);
  const yos = useUserStore((s) => s.yos);
  const mhaZip = useUserStore((s) => s.mhaZip);
  const hasSpouse = useUserStore((s) => s.hasSpouse);
  const numChildren = useUserStore((s) => s.numChildren);
  const tspContribPct = useUserStore((s) => s.tspContribPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut = useUserStore((s) => s.sglOptOut);
  const setServiceInfo = useUserStore((s) => s.setServiceInfo);
  const setLocationFamily = useUserStore((s) => s.setLocationFamily);
  const setPaySetup = useUserStore((s) => s.setPaySetup);

  const [grade, setGrade] = useState<PayGrade>(payGrade ?? 'E5');
  const [ln, setLn] = useState(lastName ?? '');
  const [nn, setNn] = useState(nickname ?? '');
  const [y, setY] = useState(yos);
  const [station, setStation] = useState<Installation | null>(null);
  const [spouse, setSpouse] = useState(hasSpouse);
  const [children, setChildren] = useState(numChildren);
  const [tsp, setTsp] = useState(tspContribPct);
  const [dental, setDental] = useState(hasDentalFamily);
  const [sgl, setSgl] = useState(sglOptOut);

  const save = () => {
    Keyboard.dismiss();
    setServiceInfo(grade, ln, nn, y);
    setLocationFamily(station?.mhaZip ?? mhaZip ?? '', spouse, children);
    setPaySetup(tsp, dental, sgl);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: modalBg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={editStyles.header}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <ThemedText style={editStyles.cancel}>CANCEL</ThemedText>
            </Pressable>
            <ThemedText style={editStyles.title}>// EDIT SERVICE INFO</ThemedText>
            <Pressable onPress={save}><ThemedText style={editStyles.save}>SAVE</ThemedText></Pressable>
          </View>
          <ScrollView
            contentContainerStyle={editStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">
            <ThemedText type="label" style={editStyles.fieldLabel}>PAY GRADE</ThemedText>
            <GradePicker selected={grade} onSelect={setGrade} />

            <ThemedText type="label" style={editStyles.fieldLabel}>LAST NAME</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg }]}>
              <TextInput
                value={ln}
                onChangeText={setLn}
                placeholder="SMITH"
                placeholderTextColor={placeholder}
                style={[editStyles.input, { color: inputText }]}
                autoCapitalize="characters"
                returnKeyType="next"
              />
            </View>

            <ThemedText type="label" style={editStyles.fieldLabel}>NICKNAME (OPTIONAL)</ThemedText>
            <View style={[editStyles.inputWrap, { backgroundColor: inputBg }]}>
              <TextInput
                value={nn}
                onChangeText={setNn}
                placeholder="Maverick"
                placeholderTextColor={placeholder}
                style={[editStyles.input, { color: inputText }]}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <NumberStepper label="Years of Service" value={y} min={0} max={40} onChange={setY} unit="yrs" />

            <ThemedText type="label" style={editStyles.fieldLabel}>DUTY STATION</ThemedText>
            <StationPicker label="Duty Station" selected={station} onSelect={setStation} />

            <View style={editStyles.toggleRow}>
              <ThemedText style={editStyles.toggleLabel}>Spouse / Dependent</ThemedText>
              <Switch value={spouse} onValueChange={setSpouse} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>

            <NumberStepper label="Dependent Children" value={children} min={0} max={8} onChange={setChildren} />
            <NumberStepper label="TSP Contribution %" value={tsp} min={0} max={100} onChange={setTsp} unit="%" />

            <View style={editStyles.toggleRow}>
              <ThemedText style={editStyles.toggleLabel}>Family Dental Plan (+$36/mo)</ThemedText>
              <Switch value={dental} onValueChange={setDental} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
            </View>
            <View style={editStyles.toggleRow}>
              <ThemedText style={editStyles.toggleLabel}>Opt Out of SGLI (-$29/mo)</ThemedText>
              <Switch value={sgl} onValueChange={setSgl} trackColor={{ true: Brand.classified }} thumbColor="#FFF" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  title: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#C8D8E8' },
  cancel: { fontSize: 12, color: '#3D6080', fontWeight: '700', letterSpacing: 1 },
  save: { fontSize: 12, color: Brand.tactical, fontWeight: '800', letterSpacing: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  fieldLabel: { color: '#3D6080', fontSize: 9 },
  inputWrap: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 4, paddingHorizontal: Spacing.three },
  input: { fontSize: 16, fontWeight: '600', paddingVertical: Spacing.two + 2, color: '#C8D8E8' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.one },
  toggleLabel: { fontSize: 14, color: '#C8D8E8' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();

  const branch = useUserStore((s) => s.branch);
  const payGrade = useUserStore((s) => s.payGrade);
  const lastName = useUserStore((s) => s.lastName);
  const nickname = useUserStore((s) => s.nickname);
  const yos = useUserStore((s) => s.yos);
  const mhaZip = useUserStore((s) => s.mhaZip);
  const hasSpouse = useUserStore((s) => s.hasSpouse);
  const numChildren = useUserStore((s) => s.numChildren);
  const tspContribPct = useUserStore((s) => s.tspContribPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut = useUserStore((s) => s.sglOptOut);
  const stateResidence = useUserStore((s) => s.stateResidence);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const notificationHour = useUserStore((s) => s.notificationHour);
  const notificationMinute = useUserStore((s) => s.notificationMinute);
  const specialPays = useUserStore((s) => s.specialPays);
  const setBranch = useUserStore((s) => s.setBranch);
  const setNotifications = useUserStore((s) => s.setNotifications);
  const setStateResidence = useUserStore((s) => s.setStateResidence);
  const addSpecialPay = useUserStore((s) => s.addSpecialPay);
  const removeSpecialPay = useUserStore((s) => s.removeSpecialPay);
  const resetAll = useUserStore((s) => s.resetAll);

  const [showEditService, setShowEditService] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showAddPay, setShowAddPay] = useState(false);
  const [showPayTypePicker, setShowPayTypePicker] = useState(false);
  const [selectedPayType, setSelectedPayType] = useState<SpecialPayType>('language');
  const [payAmountInput, setPayAmountInput] = useState('');
  const [showAddKid, setShowAddKid] = useState(false);

  const savedTipIds = useTipsStore((s) => s.savedTipIds);
  const clearSaved = () => useTipsStore.setState({ savedTipIds: [] }, false);
  const clearChat = useChatStore((s) => s.clearChat);

  const kids = useKidsStore((s) => s.kids);
  const addKid = useKidsStore((s) => s.addKid);
  const removeKid = useKidsStore((s) => s.removeKid);

  useEffect(() => {
    useKidsStore.getState().hydrate();
  }, []);

  const rankAbbrev = getRankAbbrev(branch, payGrade);
  const displayName = nickname || lastName?.toUpperCase() || 'UNNAMED';
  const stateInfo = getStateTaxInfo(stateResidence);
  const totalSpecialPay = specialPays.reduce((sum, p) => sum + p.monthlyAmount, 0);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Enable notifications in device settings.');
        return;
      }
      setNotifications(true);
      scheduleDailyTip(notificationHour, notificationMinute);
      schedulePayDayReminders();
    } else {
      setNotifications(false);
      cancelDailyTip();
      cancelPayDayReminders();
    }
  };

  const handleAddSpecialPay = () => {
    const amount = parseFloat(payAmountInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid monthly dollar amount.');
      return;
    }
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

  const handleResetApp = () => {
    Alert.alert(
      'Reset All App Data',
      'This will permanently delete your profile, budget, goals, and all saved data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All data will be erased and you will need to set up a new profile.',
              [
                { text: 'Go Back', style: 'cancel' },
                {
                  text: 'Erase All Data',
                  style: 'destructive',
                  onPress: async () => {
                    resetAll();
                    clearSaved();
                    clearChat();
                    await AsyncStorage.clear();
                    router.replace('/');
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
          <ThemedText style={styles.heading}>PROFILE</ThemedText>
        </SafeAreaView>

        {/* Identity Card */}
        <TacticalCard accentColor={Brand.accent} style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={styles.identityLeft}>
              <ThemedText type="label" style={styles.identityRank}>{rankAbbrev || '—'}</ThemedText>
              <ThemedText style={styles.identityName}>{displayName}</ThemedText>
              <ThemedText type="label" style={styles.identityBranch}>
                {branch ? BRANCH_LABELS[branch].toUpperCase() : 'BRANCH NOT SET'}
              </ThemedText>
            </View>
            <Pressable onPress={() => setShowEditService(true)} style={styles.editBtn}>
              <ThemedText type="label" style={styles.editBtnText}>EDIT ›</ThemedText>
            </Pressable>
          </View>
          <View style={styles.identityStats}>
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { fontFamily: Fonts.data }]}>{yos}</ThemedText>
              <ThemedText type="label" style={styles.identityStatLabel}>YRS SVC</ThemedText>
            </View>
            <View style={styles.identityDivider} />
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { fontFamily: Fonts.data }]}>{tspContribPct}%</ThemedText>
              <ThemedText type="label" style={styles.identityStatLabel}>TSP</ThemedText>
            </View>
            <View style={styles.identityDivider} />
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { fontFamily: Fonts.data }]}>{hasSpouse ? 'W/D' : 'S'}</ThemedText>
              <ThemedText type="label" style={styles.identityStatLabel}>STATUS</ThemedText>
            </View>
            <View style={styles.identityDivider} />
            <View style={styles.identityStat}>
              <ThemedText style={[styles.identityStatVal, { fontFamily: Fonts.data }]}>{numChildren}</ThemedText>
              <ThemedText type="label" style={styles.identityStatLabel}>DEPS</ThemedText>
            </View>
          </View>
        </TacticalCard>

        {/* Branch */}
        <SectionLabel text="SERVICE BRANCH" />
        <TacticalCard accentColor={Brand.border} style={styles.sectionCard}>
          <BranchSelector selected={branch} onSelect={(b: MilitaryBranch) => setBranch(b)} />
        </TacticalCard>

        {/* State Residence */}
        <SectionLabel text="STATE RESIDENCE" />
        <TacticalCard accentColor={Brand.border} style={styles.sectionCard}>
          <Pressable onPress={() => setShowStatePicker(true)} style={styles.stateRow}>
            <View style={styles.stateLeft}>
              <ThemedText type="label" style={styles.stateLabel}>HOME STATE</ThemedText>
              <ThemedText style={styles.stateValue}>
                {stateInfo ? `${stateInfo.name} (${stateInfo.code})` : 'Not set — tap to select'}
              </ThemedText>
              {stateInfo && (
                <ThemedText type="label" style={styles.stateTaxNote}>
                  {stateInfo.militaryExempt
                    ? `✓ ${stateInfo.note ?? 'Military pay exempt'}`
                    : `~${(stateInfo.effectiveRate * 100).toFixed(1)}% est. effective rate`}
                </ThemedText>
              )}
            </View>
            <ThemedText style={styles.stateChevron}>›</ThemedText>
          </Pressable>
          <View style={styles.stateDivider} />
          <ThemedText type="label" style={styles.stateDisclaimer}>
            Used to estimate state income tax on base pay. Allowances (BAH/BAS) are not state-taxable. Many states exempt military pay — verify with your state tax authority.
          </ThemedText>
        </TacticalCard>

        {/* Special Pays */}
        <SectionLabel text="SPECIAL PAYS" />
        <TacticalCard accentColor={Brand.border} style={styles.sectionCard}>
          {specialPays.length === 0 && !showAddPay && (
            <ThemedText type="label" style={styles.emptyText}>No special pays on file. Add aviation, jump, sea pay, etc.</ThemedText>
          )}
          {specialPays.map((pay, index) => (
            <React.Fragment key={pay.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.payRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText style={styles.payLabel}>{pay.customLabel ?? SPECIAL_PAY_LABELS[pay.type]}</ThemedText>
                  <ThemedText type="label" style={styles.payAmount}>${pay.monthlyAmount.toFixed(0)}/mo</ThemedText>
                </View>
                <Pressable
                  onPress={() => handleRemoveSpecialPay(pay.id, pay.customLabel ?? SPECIAL_PAY_LABELS[pay.type])}
                  style={styles.removeBtn}>
                  <ThemedText style={styles.removeBtnText}>✕</ThemedText>
                </Pressable>
              </View>
            </React.Fragment>
          ))}

          {showAddPay && (
            <View style={styles.addPayForm}>
              <ThemedText type="label" style={styles.formLabel}>PAY TYPE</ThemedText>
              {/* Dropdown button to open pay type picker */}
              <Pressable
                onPress={() => setShowPayTypePicker(true)}
                style={styles.payTypeDropdown}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.payTypeDropdownLabel}>
                    {SPECIAL_PAY_LABELS[selectedPayType]}
                  </ThemedText>
                  <ThemedText type="label" style={styles.payTypeDropdownRange}>
                    Typical: {SPECIAL_PAY_RANGES[selectedPayType]}
                  </ThemedText>
                </View>
                <ThemedText style={styles.payTypeDropdownChevron}>▼</ThemedText>
              </Pressable>

              <ThemedText type="label" style={[styles.formLabel, { marginTop: Spacing.two }]}>MONTHLY AMOUNT ($)</ThemedText>
              <View style={styles.numpadGrid}>
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.numpadKey, !key && styles.numpadKeyBlank]}
                    onPress={() => {
                      if (!key) return;
                      if (key === '⌫') setPayAmountInput((v) => v.slice(0, -1));
                      else setPayAmountInput((v) => v.length < 6 ? v + key : v);
                    }}>
                    <ThemedText style={styles.numpadKeyText}>{key}</ThemedText>
                  </Pressable>
                ))}
              </View>
              <ThemedText style={styles.amountDisplay}>${payAmountInput || '0'}/mo</ThemedText>
              <View style={styles.formButtons}>
                <Pressable style={styles.formBtnCancel} onPress={() => { setShowAddPay(false); setPayAmountInput(''); }}>
                  <ThemedText type="label" style={{ color: '#3D6080' }}>CANCEL</ThemedText>
                </Pressable>
                <Pressable style={styles.formBtnAdd} onPress={handleAddSpecialPay}>
                  <ThemedText type="label" style={{ color: '#04080F' }}>ADD PAY</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {!showAddPay && (
            <>
              {specialPays.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <ThemedText type="label" style={{ color: '#4D7A9A' }}>TOTAL SPECIAL PAY</ThemedText>
                    <ThemedText style={[styles.totalAmt, { fontFamily: Fonts.data }]}>${totalSpecialPay}/mo</ThemedText>
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <Pressable onPress={() => setShowAddPay(true)} style={styles.addRowBtn}>
                <ThemedText type="label" style={styles.addRowBtnText}>+ ADD SPECIAL PAY</ThemedText>
              </Pressable>
            </>
          )}
        </TacticalCard>

        {/* Kids */}
        <SectionLabel text="CADET PROFILES" />
        <TacticalCard accentColor={Brand.border} style={styles.sectionCard}>
          {kids.length === 0 && (
            <ThemedText type="label" style={styles.emptyText}>No cadet profiles. Add a child to give them their own goals and chores app.</ThemedText>
          )}
          {kids.map((kid: KidProfile, index: number) => (
            <React.Fragment key={kid.id}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable
                onPress={() => router.push(`/kids/${kid.id}` as any)}
                style={({ pressed }) => [styles.kidRow, pressed && { opacity: 0.7 }]}>
                <ThemedText style={styles.kidEmoji}>{kid.gender === 'boy' ? '🚀' : '🌸'}</ThemedText>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText style={styles.kidName}>{kid.nickname.toUpperCase()}</ThemedText>
                  <ThemedText type="label" style={styles.kidMeta}>
                    {kid.goals.length} mission{kid.goals.length !== 1 ? 's' : ''} · {kid.chores.length} chore{kid.chores.length !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
                <ThemedText style={styles.kidChevron}>›</ThemedText>
              </Pressable>
            </React.Fragment>
          ))}
          <View style={styles.divider} />
          <Pressable onPress={() => setShowAddKid(true)} style={styles.addRowBtn}>
            <ThemedText type="label" style={styles.addRowBtnText}>+ ENROLL NEW CADET</ThemedText>
          </Pressable>
        </TacticalCard>

        {/* Preferences */}
        <SectionLabel text="PREFERENCES" />
        <TacticalCard accentColor={Brand.border} style={styles.sectionCard}>
          <View style={styles.prefRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={styles.prefLabel}>Daily Tip Reminder</ThemedText>
              <ThemedText type="label" style={styles.prefValue}>
                {notificationsEnabled ? `${formatTime(notificationHour, notificationMinute)} daily` : 'Off'}
              </ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ true: Brand.accent }}
              thumbColor="#FFF"
            />
          </View>
        </TacticalCard>

        {/* Stats */}
        <SectionLabel text="INTEL STATS" />
        <View style={styles.statsRow}>
          {[
            { val: savedTipIds.length, label: 'SAVED' },
            { val: TIPS.length, label: 'TOTAL TIPS' },
            { val: 6, label: 'CATEGORIES' },
          ].map((s) => (
            <TacticalCard key={s.label} accentColor={Brand.border} style={styles.statCard}>
              <ThemedText style={[styles.statVal, { fontFamily: Fonts.data }]}>{s.val}</ThemedText>
              <ThemedText type="label" style={styles.statLabel}>{s.label}</ThemedText>
            </TacticalCard>
          ))}
        </View>

        {/* About */}
        <SectionLabel text="ABOUT" />
        <TacticalCard accentColor={Brand.border} style={styles.sectionCard}>
          <View style={styles.aboutRow}>
            <ThemedText type="label" style={styles.aboutLabel}>VERSION</ThemedText>
            <ThemedText style={[styles.aboutVal, { fontFamily: Fonts.data }]}>{APP_VERSION}</ThemedText>
          </View>
          <View style={styles.divider} />
          <Pressable onPress={() => Alert.alert('Clear Saved Tips', 'Remove all saved tips?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: clearSaved }])} style={styles.dangerRow}>
            <ThemedText type="label" style={styles.dangerText}>CLEAR SAVED TIPS</ThemedText>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={handleResetApp} style={styles.dangerRow}>
            <ThemedText type="label" style={styles.dangerText}>RESET ALL APP DATA</ThemedText>
          </Pressable>
        </TacticalCard>

        <ThemedText type="label" style={styles.disclaimer}>
          MilBudgetBuddy provides financial education for military families. Not a licensed financial advisor. Consult a CFP for major decisions. Pay estimates are approximations — verify at mypay.dfas.mil.
        </ThemedText>
      </ScrollView>

      <EditServiceModal visible={showEditService} onClose={() => setShowEditService(false)} />
      <StatePickerModal
        visible={showStatePicker}
        selected={stateResidence}
        onSelect={setStateResidence}
        onClose={() => setShowStatePicker(false)}
      />
      <AddKidModal visible={showAddKid} onClose={() => setShowAddKid(false)} onAdd={addKid} />
      <PayTypePickerModal
        visible={showPayTypePicker}
        selected={selectedPayType}
        onSelect={setSelectedPayType}
        onClose={() => setShowPayTypePicker(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  eyebrow: { color: Brand.tactical, fontSize: 9, marginTop: Spacing.three },
  heading: { fontSize: 30, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 4 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  sectionLabel: { color: '#3D6080', fontSize: 9 },

  identityCard: { gap: Spacing.two },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  identityLeft: { flex: 1, gap: 3 },
  identityRank: { color: Brand.accent, fontSize: 9 },
  identityName: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5, color: '#C8D8E8' },
  identityBranch: { color: '#3D6080', fontSize: 9 },
  editBtn: { backgroundColor: Brand.tactical + '20', paddingHorizontal: Spacing.two, paddingVertical: 4, borderRadius: 2 },
  editBtnText: { color: Brand.tactical, fontSize: 8 },
  identityStats: { flexDirection: 'row', alignItems: 'center' },
  identityStat: { flex: 1, alignItems: 'center', gap: 2 },
  identityStatVal: { fontSize: 18, fontWeight: '800', color: '#C8D8E8' },
  identityStatLabel: { color: '#6B92B0', fontSize: 10 },
  identityDivider: { width: 1, height: 30, backgroundColor: Brand.border },

  sectionCard: { gap: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },

  stateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stateLeft: { flex: 1, gap: 3 },
  stateLabel: { color: '#3D6080', fontSize: 9 },
  stateValue: { fontSize: 15, fontWeight: '700', color: '#C8D8E8' },
  stateTaxNote: { color: Brand.tactical, fontSize: 9 },
  stateChevron: { color: Brand.accent, fontSize: 20, paddingLeft: Spacing.two },
  stateDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border, marginVertical: Spacing.one },
  stateDisclaimer: { color: '#6B92B0', fontSize: 11, lineHeight: 16 },

  emptyText: { color: '#6B92B0', fontSize: 11, lineHeight: 17, textAlign: 'center', paddingVertical: Spacing.two },

  payRow: { flexDirection: 'row', alignItems: 'center' },
  payLabel: { fontSize: 14, fontWeight: '600', color: '#C8D8E8' },
  payAmount: { color: Brand.tactical, fontSize: 9 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Brand.classified + '20', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: Brand.classified, fontSize: 13, fontWeight: '700' },

  addPayForm: { gap: Spacing.two },
  formLabel: { color: '#3D6080', fontSize: 9 },

  payTypeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050B14',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 6,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  payTypeDropdownLabel: { fontSize: 14, fontWeight: '600', color: '#C8D8E8' },
  payTypeDropdownRange: { color: '#3D6080', fontSize: 9, marginTop: 2 },
  payTypeDropdownChevron: { fontSize: 12, color: Brand.accent },

  rangeHint: { color: '#3D6080', fontSize: 9, fontStyle: 'italic' },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  numpadKey: { width: '30.5%', paddingVertical: Spacing.two, alignItems: 'center', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  numpadKeyBlank: { backgroundColor: 'transparent' },
  numpadKeyText: { fontSize: 20, fontWeight: '500', color: '#C8D8E8' },
  amountDisplay: { fontSize: 28, fontWeight: '800', color: Brand.accent, fontFamily: Fonts.data, textAlign: 'center' },
  formButtons: { flexDirection: 'row', gap: Spacing.two },
  formBtnCancel: { flex: 1, borderWidth: 1, borderColor: Brand.border, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  formBtnAdd: { flex: 1, backgroundColor: Brand.accent, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalAmt: { fontSize: 16, fontWeight: '700', color: Brand.tactical },
  addRowBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  addRowBtnText: { color: Brand.tactical, fontSize: 10 },

  kidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  kidEmoji: { fontSize: 24, width: 36, lineHeight: 32, textAlign: 'center' },
  kidName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, color: '#C8D8E8' },
  kidMeta: { color: '#3D6080', fontSize: 9 },
  kidChevron: { color: '#4D7A9A', fontSize: 20 },

  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLabel: { fontSize: 15, fontWeight: '600', color: '#C8D8E8' },
  prefValue: { color: '#4D7A9A', fontSize: 9 },

  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: '800', color: Brand.accent },
  statLabel: { color: '#6B92B0', fontSize: 10 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aboutLabel: { color: '#4D7A9A', fontSize: 10 },
  aboutVal: { fontSize: 14, color: '#C8D8E8' },
  dangerRow: { paddingVertical: Spacing.two, alignItems: 'center' },
  dangerText: { color: Brand.classified, fontSize: 10 },

  disclaimer: { color: '#2A4A60', fontSize: 8, textAlign: 'center', lineHeight: 14, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
});
