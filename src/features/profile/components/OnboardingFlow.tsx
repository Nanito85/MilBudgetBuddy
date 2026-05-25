import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { PayGrade } from '@/data/bah-rates';
import { US_STATES } from '@/data/state-tax';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import {
  cancelDailyTip,
  cancelPayDayReminders,
  requestNotificationPermissions,
  scheduleDailyTip,
  schedulePayDayReminders,
} from '@/services/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';
import {
  FINANCIAL_GOAL_ICONS,
  FINANCIAL_GOAL_LABELS,
  FinancialGoal,
  MilitaryBranch,
  ServiceStatus,
} from '@/types/user.types';
import { RankVariant, getDualVariants } from '@/data/rank-insignia';
import { getDefaultQuickAccessIds } from '@/data/quick-actions';
import { Installation } from '@/data/installations';

import { BranchSelector } from './BranchSelector';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

function StepDots({ current, total }: { current: Step; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

// ── Step 0: Auth ───────────────────────────────────────────────────────────────
function AuthStep({ onSkip }: { onSkip: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.step}>
      <View style={styles.heroArea}>
        <ThemedText style={styles.heroEmoji}>🪖</ThemedText>
        <ThemedText style={styles.heroTitle}>MilBudgetBuddy</ThemedText>
        <ThemedText style={styles.heroSlogan}>Your Money. Your Mission.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heroBody}>
          Sign in to sync your data across all your devices — or continue without an account.
        </ThemedText>
      </View>
      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => router.push('/auth/sign-in' as any)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Sign In  →</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push('/auth/sign-up' as any)}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.secondaryBtnText}>Create Account</ThemedText>
        </Pressable>
        <Pressable onPress={onSkip} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Continue without account (local only)</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step 1: Welcome ────────────────────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.heroArea}>
        <ThemedText style={styles.heroEmoji}>🪖</ThemedText>
        <ThemedText style={styles.heroTitle}>MilBudgetBuddy</ThemedText>
        <ThemedText style={styles.heroSlogan}>Your Money. Your Mission.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heroBody}>
          Know your pay, plan your budget, and make the most of every dollar — built for servicemembers and their families.
        </ThemedText>
      </View>
      <Pressable
        onPress={onNext}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
        <ThemedText style={styles.primaryBtnText}>Get Started  →</ThemedText>
      </Pressable>
    </View>
  );
}

// ── Step 1: Branch ─────────────────────────────────────────────────────────────
function BranchStep({ onNext }: { onNext: (branch?: MilitaryBranch) => void }) {
  const [selected, setSelected] = useState<MilitaryBranch | undefined>();
  return (
    <View style={styles.step}>
      <View style={styles.topArea}>
        <ThemedText style={styles.stepTitle}>What's your branch?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
          We'll tailor your pay breakdown and tips to your service.
        </ThemedText>
        <View style={styles.selectorWrap}>
          <BranchSelector selected={selected} onSelect={setSelected} />
        </View>
      </View>
      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(selected)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable onPress={() => onNext(undefined)} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step 2: Service Status ─────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: ServiceStatus; label: string; sub: string; emoji: string }[] = [
  { value: 'active', label: 'Active Duty', sub: 'Full-time military service', emoji: '🪖' },
  { value: 'reserve', label: 'Reserve / Guard', sub: 'Part-time with drill weekends', emoji: '🎖️' },
  { value: 'retired', label: 'Retired', sub: 'Separated or drawing pension', emoji: '⭐' },
];

function ServiceStatusStep({ onNext }: { onNext: (status?: ServiceStatus) => void }) {
  const [selected, setSelected] = useState<ServiceStatus | undefined>();
  return (
    <View style={styles.step}>
      <View style={styles.topArea}>
        <ThemedText style={styles.stepTitle}>What's your status?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
          This helps us show the right calculators and pay tools for your situation.
        </ThemedText>
        <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
          {STATUS_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              style={[styles.optionCard, selected === opt.value && styles.optionCardActive]}>
              <ThemedText style={styles.optionEmoji}>{opt.emoji}</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.optionLabel, selected === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.optionSub}>
                  {opt.sub}
                </ThemedText>
              </View>
              {selected === opt.value && <ThemedText style={styles.optionCheck}>✓</ThemedText>}
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(selected)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable onPress={() => onNext(undefined)} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step 5: Financial Goal ─────────────────────────────────────────────────────
const GOAL_ORDER: FinancialGoal[] = [
  'save_money', 'pay_debt', 'pcs_planning', 'retirement', 'family_budgeting', 'emergency_fund',
];

function FinancialGoalStep({ onNext }: { onNext: (goal?: FinancialGoal) => void }) {
  const [selected, setSelected] = useState<FinancialGoal | undefined>();
  return (
    <View style={styles.step}>
      <View style={styles.topArea}>
        <ThemedText style={styles.stepTitle}>What's your top financial goal?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
          We'll prioritize tips and tools around what matters most to you right now.
        </ThemedText>
        <View style={styles.goalGrid}>
          {GOAL_ORDER.map((goal) => (
            <Pressable
              key={goal}
              onPress={() => setSelected(goal)}
              style={[styles.goalCard, selected === goal && styles.goalCardActive]}>
              <ThemedText style={styles.goalEmoji}>{FINANCIAL_GOAL_ICONS[goal]}</ThemedText>
              <ThemedText style={[styles.goalLabel, selected === goal && styles.goalLabelActive]}>
                {FINANCIAL_GOAL_LABELS[goal]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(selected)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable onPress={() => onNext(undefined)} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step 3: Service Info ───────────────────────────────────────────────────────
function ServiceInfoStep({ branch, onNext }: {
  branch?: MilitaryBranch;
  onNext: (grade: PayGrade | undefined, lastName: string, nickname: string, yos: number, variant: RankVariant) => void;
}) {
  const [grade, setGrade] = useState<PayGrade | undefined>();
  const [rankVariant, setRankVariant] = useState<RankVariant>('default');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [yos, setYos] = useState(4);
  const tc = useThemeColors();

  const variants = branch && grade ? getDualVariants(branch, grade) : null;

  const handleGradeChange = (g: PayGrade) => {
    setGrade(g);
    setRankVariant('default');
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollStep} showsVerticalScrollIndicator={false}>
      <ThemedText style={styles.stepTitle}>Your service info</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
        Used to calculate your base pay, BAH, and greeting. All data stays on your device.
      </ThemedText>

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>PAY GRADE</ThemedText>
        <GradePicker selected={grade ?? 'E5'} onSelect={handleGradeChange} />
      </View>

      {variants && variants.length > 1 && (
        <View style={styles.fieldBlock}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>RANK TITLE</ThemedText>
          <View style={styles.toggle}>
            {variants.map((v) => (
              <Pressable
                key={v.variant}
                onPress={() => setRankVariant(v.variant)}
                style={[styles.toggleBtn, rankVariant === v.variant && styles.toggleBtnActive]}>
                <ThemedText style={[styles.toggleText, rankVariant === v.variant && styles.toggleTextActive]}>
                  {v.abbrev}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
            {variants.find(v => v.variant === rankVariant)?.fullName}
          </ThemedText>
        </View>
      )}

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>LAST NAME</ThemedText>
        <ThemedView type="backgroundElement" style={styles.inputWrap}>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="e.g. SMITH"
            placeholderTextColor="rgba(128,128,128,0.5)"
            style={[styles.textInput, { color: tc.textPrimary }]}
            autoCapitalize="characters"
          />
        </ThemedView>
      </View>

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          NICKNAME <ThemedText type="small" themeColor="textSecondary">(optional)</ThemedText>
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.inputWrap}>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. Maverick"
            placeholderTextColor="rgba(128,128,128,0.5)"
            style={[styles.textInput, { color: tc.textPrimary }]}
          />
        </ThemedView>
      </View>

      <View style={styles.fieldBlock}>
        <NumberStepper label="Years of Service" value={yos} min={0} max={40} onChange={setYos} unit="yrs" />
      </View>

      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(grade, lastName, nickname, yos, rankVariant)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable onPress={() => onNext(undefined, '', '', yos, 'default')} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Step 3: Location & Family ──────────────────────────────────────────────────
function LocationFamilyStep({ onNext }: {
  onNext: (mhaZip: string, hasSpouse: boolean, numChildren: number, stateCode: string) => void;
}) {
  const [station, setStation] = useState<Installation | null>(null);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [numChildren, setNumChildren] = useState(0);
  const [stateCode, setStateCode] = useState('');
  const [stateQuery, setStateQuery] = useState('');
  const [showStateList, setShowStateList] = useState(false);
  const tc = useThemeColors();

  const filteredStates = US_STATES.filter((s) =>
    s.name.toLowerCase().includes(stateQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(stateQuery.toLowerCase()),
  ).slice(0, 8);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollStep} showsVerticalScrollIndicator={false}>
      <ThemedText style={styles.stepTitle}>Location & family</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
        Used to calculate your BAH rate and estimate state income taxes on your pay.
      </ThemedText>

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>DUTY STATION</ThemedText>
        <StationPicker label="Duty Station" selected={station} onSelect={setStation} />
      </View>

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          HOME STATE (FOR TAX ESTIMATE)
        </ThemedText>
        {stateCode ? (
          <Pressable
            onPress={() => { setStateCode(''); setStateQuery(''); }}
            style={[styles.toggleBtn, styles.toggleBtnActive, { alignSelf: 'flex-start', paddingHorizontal: Spacing.three }]}>
            <ThemedText style={styles.toggleTextActive}>
              {US_STATES.find(s => s.code === stateCode)?.name} ({stateCode}) ✕
            </ThemedText>
          </Pressable>
        ) : (
          <>
            <ThemedView type="backgroundElement" style={styles.inputWrap}>
              <TextInput
                value={stateQuery}
                onChangeText={(t) => { setStateQuery(t); setShowStateList(true); }}
                onFocus={() => setShowStateList(true)}
                placeholder="Search state..."
                placeholderTextColor="rgba(128,128,128,0.5)"
                style={[styles.textInput, { color: tc.textPrimary }]}
              />
            </ThemedView>
            {showStateList && stateQuery.length > 0 && (
              <View style={styles.stateDropdown}>
                {filteredStates.map((s) => (
                  <Pressable
                    key={s.code}
                    onPress={() => { setStateCode(s.code); setStateQuery(''); setShowStateList(false); }}
                    style={styles.stateOption}>
                    <ThemedText style={styles.stateOptionCode}>{s.code}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{s.name}</ThemedText>
                    {s.militaryExempt && (
                      <ThemedText type="small" style={{ color: Brand.primary, marginLeft: 'auto' as any }}>NO TAX</ThemedText>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>SPOUSE / DOMESTIC PARTNER</ThemedText>
        <View style={styles.toggle}>
          {([false, true] as const).map((val) => (
            <Pressable
              key={String(val)}
              onPress={() => setHasSpouse(val)}
              style={[styles.toggleBtn, hasSpouse === val && styles.toggleBtnActive]}>
              <ThemedText style={[styles.toggleText, hasSpouse === val && styles.toggleTextActive]}>
                {val ? 'Yes' : 'No'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <NumberStepper label="Dependent children" value={numChildren} min={0} max={8} onChange={setNumChildren} />
      </View>

      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(station?.mhaZip ?? '', hasSpouse, numChildren, stateCode)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable onPress={() => onNext('', false, 0, '')} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Step 4: Notifications ──────────────────────────────────────────────────────
function NotificationsStep({ onFinish }: { onFinish: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const setNotifications = useUserStore((s) => s.setNotifications);
  const notificationHour = useUserStore((s) => s.notificationHour);
  const notificationMinute = useUserStore((s) => s.notificationMinute);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setNotifications(true);
        scheduleDailyTip(notificationHour, notificationMinute);
        schedulePayDayReminders();
      } else {
        setEnabled(false);
      }
    } else {
      setNotifications(false);
      cancelDailyTip();
      cancelPayDayReminders();
    }
  };

  return (
    <View style={styles.step}>
      <View style={styles.heroArea}>
        <ThemedText style={styles.heroEmoji}>✅</ThemedText>
        <ThemedText style={styles.stepTitle}>You're set!</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
          Your financial dashboard is ready. Get daily tips delivered every morning.
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.toggleRow}>
          <View>
            <ThemedText style={styles.toggleLabel}>Daily tip reminder</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">8:00 AM each morning</ThemedText>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ true: Brand.primary }}
            thumbColor="#FFFFFF"
          />
        </ThemedView>
      </View>
      <View style={styles.btnGroup}>
        <Pressable
          onPress={onFinish}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Enter MilBudgetBuddy</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main Flow ──────────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const [step, setStep] = useState<Step>(0);
  const [pendingBranch, setPendingBranch] = useState<MilitaryBranch | undefined>();
  const [pendingStatus, setPendingStatus] = useState<'active' | 'reserve' | 'retired' | undefined>();
  const { user } = useAuthStore();
  const setBranch = useUserStore((s) => s.setBranch);
  const setServiceStatus = useUserStore((s) => s.setServiceStatus);
  const setFinancialGoal = useUserStore((s) => s.setFinancialGoal);
  const setOnboarded = useUserStore((s) => s.setOnboarded);
  const setServiceInfo = useUserStore((s) => s.setServiceInfo);
  const setLocationFamily = useUserStore((s) => s.setLocationFamily);
  const setStateResidence = useUserStore((s) => s.setStateResidence);
  const setQuickAccessIds = useUserStore((s) => s.setQuickAccessIds);
  const setRankVariant = useUserStore((s) => s.setRankVariant);

  // Auto-advance past auth step when user signs in / returns from auth screen
  useEffect(() => {
    if (user && step === 0) setStep(1);
  }, [user]);

  const handleBranch = (branch?: MilitaryBranch) => {
    if (branch) { setBranch(branch); setPendingBranch(branch); }
    setStep(3);
  };

  const handleServiceStatus = (status?: ServiceStatus) => {
    if (status) { setServiceStatus(status); setPendingStatus(status); }
    setStep(4);
  };

  const handleServiceInfo = (grade: PayGrade | undefined, lastName: string, nickname: string, yos: number, variant: RankVariant) => {
    if (grade) {
      setServiceInfo(grade, lastName, nickname, yos);
      setRankVariant(variant);
    }
    setStep(5);
  };

  const handleLocationFamily = (mhaZip: string, hasSpouse: boolean, numChildren: number, stateCode: string) => {
    setLocationFamily(mhaZip, hasSpouse, numChildren);
    if (stateCode) setStateResidence(stateCode);
    setStep(6);
  };

  const handleFinancialGoal = (goal?: FinancialGoal) => {
    if (goal) {
      setFinancialGoal(goal);
      setQuickAccessIds(getDefaultQuickAccessIds(pendingStatus, goal));
    }
    setStep(7);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeArea}>
          <StepDots current={step} total={8} />
          {step === 0 && <AuthStep onSkip={() => setStep(1)} />}
          {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
          {step === 2 && <BranchStep onNext={handleBranch} />}
          {step === 3 && <ServiceStatusStep onNext={handleServiceStatus} />}
          {step === 4 && <ServiceInfoStep branch={pendingBranch} onNext={handleServiceInfo} />}
          {step === 5 && <LocationFamilyStep onNext={handleLocationFamily} />}
          {step === 6 && <FinancialGoalStep onNext={handleFinancialGoal} />}
          {step === 7 && <NotificationsStep onFinish={setOnboarded} />}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.3)' },
  dotActive: { backgroundColor: Brand.primary, width: 18 },
  step: { flex: 1, justifyContent: 'space-between', paddingVertical: Spacing.four },
  scrollStep: { gap: Spacing.three, paddingVertical: Spacing.two },
  heroArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.two },
  topArea: { flex: 1, gap: Spacing.three, paddingHorizontal: Spacing.two },
  heroEmoji: { fontSize: 60, lineHeight: 80 },
  heroTitle: { fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroSub: { textAlign: 'center', fontWeight: '600', fontSize: 16 },
  heroSlogan: { textAlign: 'center', fontWeight: '700', fontSize: 15, color: Brand.primary, letterSpacing: 0.3 },
  heroBody: { textAlign: 'center', lineHeight: 22 },
  stepTitle: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  stepSub: { lineHeight: 20 },
  selectorWrap: { marginTop: Spacing.two },
  fieldBlock: { gap: Spacing.two },
  fieldLabel: { fontSize: 10, letterSpacing: 0.8 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  inputWrap: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two },
  textInput: { fontSize: 16, paddingVertical: Spacing.two + 4, fontWeight: '600' },
  toggle: { flexDirection: 'row', gap: Spacing.one },
  toggleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 99,
    backgroundColor: 'rgba(128,128,128,0.12)',
    minWidth: 52,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Brand.primary },
  toggleText: { fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
    width: '100%',
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', marginBottom: Spacing.half },
  btnGroup: { gap: Spacing.two, alignItems: 'center', paddingTop: Spacing.three },
  primaryBtn: {
    backgroundColor: Brand.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    width: '100%',
  },
  btnPressed: { opacity: 0.8 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Brand.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: { color: Brand.primary, fontSize: 16, fontWeight: '700' },
  skipBtn: { paddingVertical: Spacing.two },
  stateDropdown: {
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
    borderRadius: Spacing.two,
    overflow: 'hidden',
    marginTop: -Spacing.one,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    gap: Spacing.two,
  },
  stateOptionCode: { fontSize: 13, fontWeight: '800', width: 36 },

  // ServiceStatus / FinancialGoal step styles
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(128,128,128,0.06)',
  },
  optionCardActive: { borderColor: Brand.primary, backgroundColor: Brand.primary + '15' },
  optionEmoji: { fontSize: 26, lineHeight: 32 },
  optionLabel: { fontSize: 15, fontWeight: '700' },
  optionLabelActive: { color: Brand.primary },
  optionSub: { fontSize: 12, marginTop: 2 },
  optionCheck: { color: Brand.primary, fontSize: 18, fontWeight: '900' },

  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  goalCard: {
    width: '47%',
    padding: Spacing.two + 2,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(128,128,128,0.06)',
    alignItems: 'center',
    gap: Spacing.one,
  },
  goalCardActive: { borderColor: Brand.primary, backgroundColor: Brand.primary + '15' },
  goalEmoji: { fontSize: 28, lineHeight: 36 },
  goalLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  goalLabelActive: { color: Brand.primary },
});
