import React, { useEffect, useState } from 'react';
import {
  Alert,
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
  cancelPayDayReminders,
  cancelWeeklyTip,
  requestNotificationPermissions,
  scheduleWeeklyTip,
  schedulePayDayReminders,
} from '@/services/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';
import {
  FINANCIAL_GOAL_ICONS,
  FINANCIAL_GOAL_LABELS,
  FinancialGoal,
  HOUSING_STATUS_DESCRIPTIONS,
  HOUSING_STATUS_LABELS,
  HousingStatus,
  MilitaryBranch,
  ServiceStatus,
} from '@/types/user.types';

const HOUSING_STATUS_ORDER: HousingStatus[] = ['off_base', 'barracks', 'on_base_family_housing'];
import { RankVariant, getDualVariants } from '@/data/rank-insignia';
import { VALID_RATINGS } from '@/features/va/utils/vaDisabilityCalc';
import { getDefaultQuickAccessIds } from '@/data/quick-actions';
import { Installation } from '@/data/installations';

import { BranchSelector } from './BranchSelector';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

function isCivilianBranch(b?: MilitaryBranch) {
  return b === 'other';
}

function fmtDate(iso: string) {
  if (!iso || iso.length < 10) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function yearsAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 864e5));
}

// Years of service AS OF a fixed date (retirement), not as of today — a
// retiree's YOS must stay frozen at whatever it was the day they retired,
// since it directly drives their retired-pay percentage (see
// retiredPayMultiplier in lesCalc.ts). Using yearsAgo() here would keep
// inflating a retiree's pay every year they stay retired.
function yearsBetween(startIso: string, endIso: string): number {
  return Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / (365.25 * 864e5));
}

function fmtMonthYear(iso: string) {
  if (!iso || iso.length < 7) return '';
  const [y, m] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

// ── Step Header (dots + back button) ──────────────────────────────────────────

function StepHeader({
  current,
  total,
  onBack,
}: {
  current: Step;
  total: number;
  onBack?: () => void;
}) {
  return (
    <View style={styles.stepHeader}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <ThemedText style={styles.backText}>‹ Back</ThemedText>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.backPlaceholder} />
    </View>
  );
}

// ── Step 0: Auth ───────────────────────────────────────────────────────────────
//
// Sign-in/sign-up render as a modal INSIDE this step rather than navigating to
// the /auth/sign-in or /auth/sign-up routes. Those routes only exist inside the
// root Stack navigator, which RootLayout does not mount at all while onboarding
// is showing (see src/app/_layout.tsx) — a router.push() here has no navigator
// to push onto, so it silently does nothing. Every brand-new install hits this
// exact step, which is why testers reported "Create Account" doing nothing.

function AuthModal({
  visible,
  mode,
  onClose,
}: {
  visible: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
}) {
  const tc = useThemeColors();
  const { signIn, signUp, resetPassword, loading, error, clearError } = useAuthStore();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (visible) {
      setEmail(''); setPassword(''); setConfirm(''); setLocalError(''); clearError();
    }
  }, [visible, mode]);

  const displayError = localError || error;
  const canSubmit = mode === 'signup'
    ? email.trim().length > 0 && password.length >= 8 && confirm.length > 0 && !loading
    : email.trim().length > 0 && password.length > 0 && !loading;

  const submit = async () => {
    setLocalError('');
    clearError();
    if (!email.trim() || !password) return;
    if (mode === 'signup') {
      if (password !== confirm) { setLocalError("Passwords don't match."); return; }
      if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return; }
      await signUp(email.trim().toLowerCase(), password);
    } else {
      await signIn(email.trim().toLowerCase(), password);
    }
  };

  const forgotPassword = () => {
    if (!email.trim()) { setLocalError('Type your email above first, then tap "Forgot password?" again.'); return; }
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            setLocalError(''); clearError();
            const ok = await resetPassword(email.trim().toLowerCase());
            if (ok) Alert.alert('Check Your Email', 'If an account exists for that email, a password reset link is on its way.');
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tc.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={authModalStyles.header}>
            <Pressable onPress={onClose}><ThemedText style={[authModalStyles.cancel, { color: tc.textSecondary }]}>CANCEL</ThemedText></Pressable>
            <ThemedText style={[authModalStyles.title, { color: tc.textPrimary }]}>
              {mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </ThemedText>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={authModalStyles.content} keyboardShouldPersistTaps="handled">
            {displayError ? (
              <View style={authModalStyles.errorBox}>
                <ThemedText style={authModalStyles.errorText}>{displayError}</ThemedText>
              </View>
            ) : null}

            <ThemedText type="small" themeColor="textSecondary" style={authModalStyles.label}>EMAIL</ThemedText>
            <ThemedView type="backgroundElement" style={authModalStyles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="rgba(128,128,128,0.5)"
                autoCapitalize="none"
                keyboardType="email-address"
                style={[authModalStyles.input, { color: tc.textPrimary }]}
              />
            </ThemedView>

            <ThemedText type="small" themeColor="textSecondary" style={authModalStyles.label}>PASSWORD</ThemedText>
            <ThemedView type="backgroundElement" style={authModalStyles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                placeholderTextColor="rgba(128,128,128,0.5)"
                secureTextEntry
                onSubmitEditing={mode === 'signin' ? submit : undefined}
                returnKeyType={mode === 'signin' ? 'done' : 'next'}
                style={[authModalStyles.input, { color: tc.textPrimary }]}
              />
            </ThemedView>

            {mode === 'signin' && (
              <Pressable onPress={forgotPassword} hitSlop={8} style={authModalStyles.forgotBtn}>
                <ThemedText style={[authModalStyles.forgotText, { color: Brand.primary }]}>Forgot password?</ThemedText>
              </Pressable>
            )}

            {mode === 'signup' && (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={authModalStyles.label}>CONFIRM PASSWORD</ThemedText>
                <ThemedView type="backgroundElement" style={authModalStyles.inputWrap}>
                  <TextInput
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Re-enter password"
                    placeholderTextColor="rgba(128,128,128,0.5)"
                    secureTextEntry
                    onSubmitEditing={submit}
                    returnKeyType="done"
                    style={[authModalStyles.input, { color: tc.textPrimary }]}
                  />
                </ThemedView>
              </>
            )}

            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              style={({ pressed }) => [authModalStyles.primaryBtn, (!canSubmit || pressed) && { opacity: 0.6 }]}>
              <ThemedText style={authModalStyles.primaryBtnText}>
                {loading
                  ? (mode === 'signup' ? 'CREATING...' : 'SIGNING IN...')
                  : (mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN')}
              </ThemedText>
            </Pressable>

            {mode === 'signup' && (
              <ThemedText type="small" themeColor="textSecondary" style={authModalStyles.note}>
                🔒 Your data is private and encrypted. We never share it.
              </ThemedText>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const authModalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  cancel: { fontSize: 14, fontWeight: '600', width: 60 },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  content: { padding: Spacing.four, gap: Spacing.two },
  errorBox: { backgroundColor: Brand.classified + '15', borderWidth: 1, borderColor: Brand.classified + '40', borderRadius: 6, padding: Spacing.two + 2 },
  errorText: { color: Brand.classified, fontSize: 13, lineHeight: 18 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginTop: Spacing.one },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, fontWeight: '700' },
  inputWrap: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.two + 4, fontWeight: '600' },
  primaryBtn: { backgroundColor: Brand.primary, borderRadius: Spacing.two, paddingVertical: Spacing.two + 4, alignItems: 'center', marginTop: Spacing.two },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: Spacing.two },
});

function AuthStep({ onSkip }: { onSkip: () => void }) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  return (
    <View style={styles.step}>
      <View style={styles.heroArea}>
        <ThemedText style={styles.heroEmoji}>🪖</ThemedText>
        <ThemedText style={styles.heroTitle}>MilBudgetBuddy</ThemedText>
        <ThemedText style={styles.heroSlogan}>Your Money. Your Mission.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heroBody}>
          Sign in to sync your data across devices — or continue without an account.
        </ThemedText>
      </View>
      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => setAuthMode('signin')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Sign In  →</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setAuthMode('signup')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.secondaryBtnText}>Create Account</ThemedText>
        </Pressable>
        <Pressable onPress={onSkip} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Continue without account (local only)</ThemedText>
        </Pressable>
      </View>
      <AuthModal
        visible={authMode !== null}
        mode={authMode ?? 'signin'}
        onClose={() => setAuthMode(null)}
      />
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

// ── Step 2: Branch ─────────────────────────────────────────────────────────────

function BranchStep({
  onNext,
  onBack,
}: {
  onNext: (branch?: MilitaryBranch) => void;
  onBack: () => void;
}) {
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

// ── Step 3: Service Status ─────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ServiceStatus; label: string; sub: string; emoji: string }[] = [
  { value: 'active',   label: 'Active Duty',     sub: 'Full-time military service',    emoji: '🪖' },
  { value: 'reserve',  label: 'Reserve / Guard', sub: 'Part-time with drill weekends', emoji: '🎖️' },
  { value: 'retired',  label: 'Retired',         sub: 'Separated or drawing pension',  emoji: '⭐' },
  { value: 'civilian', label: 'Civilian',        sub: 'DoD civilian / GS employee',    emoji: '💼' },
];

function ServiceStatusStep({
  branch,
  onNext,
  onBack,
}: {
  branch?: MilitaryBranch;
  onNext: (status?: ServiceStatus) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<ServiceStatus | undefined>(
    isCivilianBranch(branch) ? 'civilian' : undefined,
  );

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

// ── Step 4: Military Service Info ──────────────────────────────────────────────

function ServiceInfoStep({
  branch,
  status,
  onNext,
}: {
  branch?: MilitaryBranch;
  status?: ServiceStatus;
  onNext: (grade: PayGrade | undefined, lastName: string, nickname: string, yos: number, variant: RankVariant, enlistDate: string, rankDate: string, drillsPerMonth: number) => void;
}) {
  // Defaults to a real grade (not undefined) so what's visually shown as
  // selected in GradePicker always matches what actually gets saved — a user
  // who taps "Continue" without touching the picker still gets a value saved.
  const [grade, setGrade]           = useState<PayGrade>('E5');
  const [rankVariant, setRankVariant] = useState<RankVariant>('default');
  const [lastName, setLastName]     = useState('');
  const [nickname, setNickname]     = useState('');
  const [yos, setYos]               = useState(4);
  const [yosManual, setYosManual]   = useState(false); // true if user overrode auto-calc
  const [enlistDate, setEnlistDate] = useState('');
  const [rankDate, setRankDate]     = useState('');
  const [drillsPerMonth, setDrillsPerMonth] = useState(4);
  const [showEnlistPicker, setShowEnlistPicker] = useState(false);
  const [showRankPicker, setShowRankPicker]     = useState(false);

  // Auto-calculate YOS from enlistment date unless manually overridden
  useEffect(() => {
    if (enlistDate && !yosManual) {
      const calculated = yearsAgo(enlistDate);
      if (calculated >= 0 && calculated <= 40) setYos(calculated);
    }
  }, [enlistDate]);
  const tc = useThemeColors();

  const isReserve = status === 'reserve';
  const variants = branch && grade ? getDualVariants(branch, grade) : null;

  const handleGradeChange = (g: PayGrade) => {
    setGrade(g);
    setRankVariant('default');
  };

  return (
    <>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollStep}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <ThemedText style={styles.stepTitle}>Your service info</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
        {isReserve
          ? 'Used to calculate your drill pay, retirement points, and TRICARE benefits.'
          : 'Used to calculate your base pay, BAH, and home screen greeting.'}
      </ThemedText>

      {/* Pay Grade */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          {isReserve ? 'RESERVE PAY GRADE' : 'PAY GRADE'}
        </ThemedText>
        <GradePicker selected={grade} onSelect={handleGradeChange} />
      </View>

      {/* Rank Variant */}
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
            {variants.find((v) => v.variant === rankVariant)?.fullName}
          </ThemedText>
        </View>
      )}

      {/* Last Name */}
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

      {/* Nickname */}
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

      {/* Date of Enlistment / Commission */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          DATE OF ENLISTMENT / COMMISSION
        </ThemedText>
        <Pressable onPress={() => setShowEnlistPicker(true)} style={styles.dateTrigger}>
          <ThemedText style={[styles.dateValue, !enlistDate && styles.datePlaceholder]}>
            {enlistDate ? fmtDate(enlistDate) : 'Tap to select date'}
          </ThemedText>
          <ThemedText style={styles.dateIcon}>📅</ThemedText>
        </Pressable>
        {enlistDate && (
          <ThemedText style={styles.dateHint}>↳ {yearsAgo(enlistDate)} years of service</ThemedText>
        )}
      </View>

      {/* Date of Current Rank */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          DATE OF CURRENT RANK
        </ThemedText>
        <Pressable onPress={() => setShowRankPicker(true)} style={styles.dateTrigger}>
          <ThemedText style={[styles.dateValue, !rankDate && styles.datePlaceholder]}>
            {rankDate ? fmtDate(rankDate) : 'Tap to select date'}
          </ThemedText>
          <ThemedText style={styles.dateIcon}>📅</ThemedText>
        </Pressable>
        {rankDate && (
          <ThemedText style={styles.dateHint}>↳ {yearsAgo(rankDate)} years in grade</ThemedText>
        )}
      </View>

      {/* Years of Service */}
      <View style={styles.fieldBlock}>
        <NumberStepper
        label={enlistDate ? `Years of Service (auto-calculated — override if needed)` : 'Years of Service'}
        value={yos}
        min={0}
        max={40}
        onChange={(v) => { setYos(v); setYosManual(true); }}
        unit="yrs"
      />
      </View>

      {/* Drills per month — Reserve/Guard only, determines drill pay */}
      {isReserve && (
        <View style={styles.fieldBlock}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
            DRILLS PER MONTH
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
            One battle assembly weekend = 4 drills. Used to estimate your monthly drill pay.
          </ThemedText>
          <NumberStepper label="Drills" value={drillsPerMonth} min={0} max={20} onChange={setDrillsPerMonth} unit="drills" />
        </View>
      )}

      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(grade, lastName, nickname, yos, rankVariant, enlistDate, rankDate, drillsPerMonth)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onNext(undefined, '', '', yos, 'default', '', '', drillsPerMonth)}
          hitSlop={8}
          style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>

    </ScrollView>

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
    </>
  );
}

// ── Step 4b: Civilian (GS) Service Info ────────────────────────────────────────

const GS_GRADES = Array.from({ length: 15 }, (_, i) => i + 1);
const GS_STEPS  = Array.from({ length: 10 }, (_, i) => i + 1);

function CivilianServiceInfoStep({
  onNext,
}: {
  onNext: (gsGrade: number, gsStep: number, lastName: string, nickname: string, startDate: string) => void;
}) {
  const [gsGrade, setGsGrade]     = useState(7);
  const [gsStep, setGsStep]       = useState(1);
  const [lastName, setLastName]   = useState('');
  const [nickname, setNickname]   = useState('');
  const [startDate, setStartDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const tc = useThemeColors();

  return (
    <>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollStep}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <ThemedText style={styles.stepTitle}>Your GS info</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
        We'll pull your General Schedule pay for the home screen and GS Pay Calculator.
      </ThemedText>

      {/* GS Grade */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>GS GRADE</ThemedText>
        <View style={styles.chipGrid}>
          {GS_GRADES.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGsGrade(g)}
              style={[styles.gradeChip, gsGrade === g && styles.gradeChipActive]}>
              <ThemedText style={[styles.gradeChipText, gsGrade === g && styles.gradeChipTextActive]}>
                GS-{g}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* GS Step */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>STEP</ThemedText>
        <View style={styles.chipGrid}>
          {GS_STEPS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setGsStep(s)}
              style={[styles.gradeChip, gsStep === s && styles.gradeChipActive]}>
              <ThemedText style={[styles.gradeChipText, gsStep === s && styles.gradeChipTextActive]}>
                {s}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Last Name */}
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

      {/* Nickname */}
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

      {/* Federal Service Start Date */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          DATE FEDERAL SERVICE BEGAN
        </ThemedText>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateTrigger}>
          <ThemedText style={[styles.dateValue, !startDate && styles.datePlaceholder]}>
            {startDate ? fmtDate(startDate) : 'Tap to select date'}
          </ThemedText>
          <ThemedText style={styles.dateIcon}>📅</ThemedText>
        </Pressable>
        {startDate && (
          <ThemedText style={styles.dateHint}>
            ↳ {yearsAgo(startDate)} years of federal service
          </ThemedText>
        )}
      </View>

      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(gsGrade, gsStep, lastName, nickname, startDate)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onNext(gsGrade, gsStep, '', '', '')}
          hitSlop={8}
          style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>

    </ScrollView>

    <DatePickerModal
      visible={showDatePicker}
      value={startDate}
      title="Date Federal Service Began"
      onConfirm={(d) => { setStartDate(d); setShowDatePicker(false); }}
      onCancel={() => setShowDatePicker(false)}
    />
    </>
  );
}

// ── Step 4c: Retired Service Info ──────────────────────────────────────────────

const VA_PERCENT_OPTIONS = [0, ...VALID_RATINGS];

function RetiredServiceInfoStep({
  branch,
  onNext,
}: {
  branch?: MilitaryBranch;
  onNext: (grade: PayGrade | undefined, lastName: string, nickname: string, retirementDate: string, vaDisabilityPercent: number, yos: number, enlistDate: string) => void;
}) {
  const [grade, setGrade]         = useState<PayGrade>('E7');
  const [rankVariant, setRankVariant] = useState<RankVariant>('default');
  const [lastName, setLastName]   = useState('');
  const [nickname, setNickname]   = useState('');
  const [enlistDate, setEnlistDate] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [vaPercent, setVaPercent] = useState(0);
  const [yos, setYos]             = useState(20); // 20 = the standard minimum-retirement point
  const [yosManual, setYosManual] = useState(false); // true if user overrode auto-calc
  const [showEnlistPicker, setShowEnlistPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const tc = useThemeColors();

  // Auto-calculate years of service AT RETIREMENT (frozen — not still
  // counting up to today) from the two dates, unless manually overridden.
  // This is what drives the retired-pay percentage shown on the Home
  // screen (50% at 20 YOS, +2.5%/year after — see lesCalc.ts), so getting
  // this right matters a lot more here than it does for an active-duty
  // profile where an inaccurate YOS just skews one BAH/pay-grade lookup.
  useEffect(() => {
    if (enlistDate && retirementDate && !yosManual) {
      const calculated = yearsBetween(enlistDate, retirementDate);
      if (calculated >= 0 && calculated <= 40) setYos(calculated);
    }
  }, [enlistDate, retirementDate]);

  const variants = branch && grade ? getDualVariants(branch, grade) : null;

  const handleGradeChange = (g: PayGrade) => {
    setGrade(g);
    setRankVariant('default');
  };

  return (
    <>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollStep}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <ThemedText style={styles.stepTitle}>Your retirement info</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.stepSub}>
        Used to show your retired rank and estimate your VA disability compensation.
      </ThemedText>

      {/* Retired Rank */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          RANK YOU RETIRED AS
        </ThemedText>
        <GradePicker selected={grade} onSelect={handleGradeChange} />
      </View>

      {/* Rank Variant */}
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
        </View>
      )}

      {/* Last Name */}
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

      {/* Nickname */}
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

      {/* Date of Enlistment / Commission */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          DATE OF ENLISTMENT / COMMISSION
        </ThemedText>
        <Pressable onPress={() => setShowEnlistPicker(true)} style={styles.dateTrigger}>
          <ThemedText style={[styles.dateValue, !enlistDate && styles.datePlaceholder]}>
            {enlistDate ? fmtDate(enlistDate) : 'Tap to select date'}
          </ThemedText>
          <ThemedText style={styles.dateIcon}>📅</ThemedText>
        </Pressable>
      </View>

      {/* Month/Year of Retirement */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          MONTH & YEAR YOU RETIRED
        </ThemedText>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateTrigger}>
          <ThemedText style={[styles.dateValue, !retirementDate && styles.datePlaceholder]}>
            {retirementDate ? fmtMonthYear(retirementDate) : 'Tap to select date'}
          </ThemedText>
          <ThemedText style={styles.dateIcon}>📅</ThemedText>
        </Pressable>
      </View>

      {/* Years of Service at Retirement — drives the retired-pay % shown on Home */}
      <View style={styles.fieldBlock}>
        <NumberStepper
          label={enlistDate && retirementDate ? 'Years of Service at Retirement (auto-calculated — override if needed)' : 'Years of Service at Retirement'}
          value={yos}
          min={0}
          max={40}
          onChange={(v) => { setYos(v); setYosManual(true); }}
          unit="yrs"
        />
        <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18, marginTop: 4 }}>
          Determines your retired pay: 50% of your High-3 average base pay at 20 years, +2.5% for every year beyond that.
        </ThemedText>
      </View>

      {/* VA Disability Percentage */}
      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
          VA DISABILITY RATING
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
          We'll estimate your monthly VA disability compensation based on this rating and your dependents.
        </ThemedText>
        <View style={styles.chipGrid}>
          {VA_PERCENT_OPTIONS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setVaPercent(p)}
              style={[styles.gradeChip, vaPercent === p && styles.gradeChipActive]}>
              <ThemedText style={[styles.gradeChipText, vaPercent === p && styles.gradeChipTextActive]}>
                {p}%
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(grade, lastName, nickname, retirementDate, vaPercent, yos, enlistDate)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onNext(undefined, '', '', '', 0, 0, '')}
          hitSlop={8}
          style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>

    </ScrollView>

    <DatePickerModal
      visible={showEnlistPicker}
      value={enlistDate}
      title="Date of Enlistment / Commission"
      onConfirm={(d) => { setEnlistDate(d); setShowEnlistPicker(false); }}
      onCancel={() => setShowEnlistPicker(false)}
    />

    <DatePickerModal
      visible={showDatePicker}
      value={retirementDate}
      title="Month & Year You Retired"
      onConfirm={(d) => { setRetirementDate(d); setShowDatePicker(false); }}
      onCancel={() => setShowDatePicker(false)}
    />
    </>
  );
}

// ── Step 5: Location & Family ──────────────────────────────────────────────────

function LocationFamilyStep({
  onNext,
}: {
  onNext: (mhaZip: string, installName: string, hasSpouse: boolean, numChildren: number, stateCode: string, housingStatus: HousingStatus, dutyStationId: string) => void;
}) {
  const [station, setStation]         = useState<Installation | null>(null);
  const [hasSpouse, setHasSpouse]     = useState(false);
  const [numChildren, setNumChildren] = useState(0);
  const [housingStatus, setHousingStatus] = useState<HousingStatus>('off_base');
  const [stateCode, setStateCode]     = useState('');
  const [stateQuery, setStateQuery]   = useState('');
  const [showStateList, setShowStateList] = useState(false);
  const tc = useThemeColors();

  const filteredStates = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(stateQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(stateQuery.toLowerCase()),
  ).slice(0, 8);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollStep}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

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
              {US_STATES.find((s) => s.code === stateCode)?.name} ({stateCode}) ✕
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
              <View style={[styles.stateDropdown, { backgroundColor: tc.surface }]}>
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

      <View style={styles.fieldBlock}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>CURRENT HOUSING</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
          This determines your actual BAH entitlement — full BAH, Partial BAH, or none.
        </ThemedText>
        <View style={{ gap: Spacing.one }}>
          {HOUSING_STATUS_ORDER.map((hs) => (
            <Pressable
              key={hs}
              onPress={() => setHousingStatus(hs)}
              style={[styles.housingOption, housingStatus === hs && styles.housingOptionActive]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <ThemedText style={{ fontSize: 16, color: housingStatus === hs ? Brand.primary : tc.textSecondary }}>
                  {housingStatus === hs ? '●' : '○'}
                </ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.housingLabel}>{HOUSING_STATUS_LABELS[hs]}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 16 }}>
                    {HOUSING_STATUS_DESCRIPTIONS[hs]}
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.btnGroup}>
        <Pressable
          onPress={() => onNext(station?.mhaZip ?? '', station?.name ?? '', hasSpouse, numChildren, stateCode, housingStatus, station?.id ?? '')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
          <ThemedText style={styles.primaryBtnText}>Continue  →</ThemedText>
        </Pressable>
        <Pressable onPress={() => onNext('', '', false, 0, '', 'off_base', '')} hitSlop={8} style={styles.skipBtn}>
          <ThemedText type="small" themeColor="textSecondary">Skip for now</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Step 6: Financial Goal ─────────────────────────────────────────────────────

const GOAL_ORDER: FinancialGoal[] = [
  'save_money', 'pay_debt', 'pcs_planning', 'retirement', 'family_budgeting', 'emergency_fund',
];

function FinancialGoalStep({
  onNext,
}: {
  onNext: (goal?: FinancialGoal) => void;
}) {
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

// ── Step 7: Notifications ──────────────────────────────────────────────────────

function NotificationsStep({ onFinish }: { onFinish: () => void }) {
  const [enabled, setEnabled]       = useState(false);
  const setNotifications            = useUserStore((s) => s.setNotifications);
  const notificationHour            = useUserStore((s) => s.notificationHour);
  const notificationMinute          = useUserStore((s) => s.notificationMinute);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setNotifications(true);
        scheduleWeeklyTip(notificationHour, notificationMinute);
        schedulePayDayReminders();
      } else {
        setEnabled(false);
      }
    } else {
      setNotifications(false);
      cancelWeeklyTip();
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
            <ThemedText style={styles.toggleLabel}>Weekly tip reminder</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Mondays at 8:00 AM</ThemedText>
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
  const [step, setStep]               = useState<Step>(0);
  const [pendingBranch, setPendingBranch] = useState<MilitaryBranch | undefined>();
  const [pendingStatus, setPendingStatus] = useState<ServiceStatus | undefined>();
  const { user }                      = useAuthStore();

  const setBranch         = useUserStore((s) => s.setBranch);
  const setServiceStatus  = useUserStore((s) => s.setServiceStatus);
  const setFinancialGoal  = useUserStore((s) => s.setFinancialGoal);
  const setOnboarded      = useUserStore((s) => s.setOnboarded);
  const setServiceInfo    = useUserStore((s) => s.setServiceInfo);
  const setGSInfo         = useUserStore((s) => s.setGSInfo);
  const setReserveInfo    = useUserStore((s) => s.setReserveInfo);
  const setRetiredInfo    = useUserStore((s) => s.setRetiredInfo);
  const setLocationFamily = useUserStore((s) => s.setLocationFamily);
  const setStateResidence = useUserStore((s) => s.setStateResidence);
  const setQuickAccessIds = useUserStore((s) => s.setQuickAccessIds);
  const setRankVariant    = useUserStore((s) => s.setRankVariant);

  useEffect(() => {
    if (user && step === 0) setStep(1);
  }, [user]);

  const isCivilian = isCivilianBranch(pendingBranch) || pendingStatus === 'civilian';

  const handleBranch = (branch?: MilitaryBranch) => {
    if (branch) { setBranch(branch); setPendingBranch(branch); }
    setStep(3);
  };

  const handleServiceStatus = (status?: ServiceStatus) => {
    if (status) { setServiceStatus(status); setPendingStatus(status); }
    setStep(4);
  };

  const handleServiceInfo = (
    grade: PayGrade | undefined,
    lastName: string,
    nickname: string,
    yos: number,
    variant: RankVariant,
    enlistDate: string,
    rankDate: string,
    drillsPerMonth: number,
  ) => {
    if (grade) {
      setServiceInfo(grade, lastName, nickname, yos, enlistDate || undefined, rankDate || undefined);
      setRankVariant(variant);
    }
    if (pendingStatus === 'reserve') setReserveInfo(drillsPerMonth);
    setStep(5);
  };

  const handleCivilianInfo = (
    gsGrade: number,
    gsStep: number,
    lastName: string,
    nickname: string,
    startDate: string,
  ) => {
    setGSInfo(gsGrade, gsStep, lastName, nickname, startDate || undefined);
    setStep(5);
  };

  const handleRetiredInfo = (
    grade: PayGrade | undefined,
    lastName: string,
    nickname: string,
    retirementDate: string,
    vaDisabilityPercent: number,
    yos: number,
    enlistDate: string,
  ) => {
    if (grade) {
      // yos here is years of service AS OF RETIREMENT (frozen), not years
      // since enlistment to today — see yearsBetween's doc comment. This is
      // what lesCalc.ts's retiredPayMultiplier uses to compute retired pay,
      // so a retired member who skips this no longer silently gets yos=0
      // (and therefore $0 retired pay) on the Home screen.
      setServiceInfo(grade, lastName, nickname, yos, enlistDate || undefined, undefined);
    }
    setRetiredInfo(retirementDate || undefined, vaDisabilityPercent);
    setStep(5);
  };

  const handleLocationFamily = (
    mhaZip: string,
    installName: string,
    hasSpouse: boolean,
    numChildren: number,
    stateCode: string,
    housingStatus: HousingStatus,
    dutyStationId: string,
  ) => {
    setLocationFamily(mhaZip, hasSpouse, numChildren, housingStatus, installName || undefined, dutyStationId || undefined);
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

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeArea}>
          <StepHeader current={step} total={8} onBack={step > 1 ? goBack : undefined} />

          {step === 0 && <AuthStep onSkip={() => setStep(1)} />}
          {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
          {step === 2 && <BranchStep onNext={handleBranch} onBack={goBack} />}
          {step === 3 && (
            <ServiceStatusStep
              branch={pendingBranch}
              onNext={handleServiceStatus}
              onBack={goBack}
            />
          )}
          {step === 4 && (isCivilian
            ? <CivilianServiceInfoStep onNext={handleCivilianInfo} />
            : pendingStatus === 'retired'
              ? <RetiredServiceInfoStep branch={pendingBranch} onNext={handleRetiredInfo} />
              : <ServiceInfoStep branch={pendingBranch} status={pendingStatus} onNext={handleServiceInfo} />
          )}
          {step === 5 && <LocationFamilyStep onNext={handleLocationFamily} />}
          {step === 6 && <FinancialGoalStep onNext={handleFinancialGoal} />}
          {step === 7 && <NotificationsStep onFinish={setOnboarded} />}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  backBtn: { width: 60 },
  backText: { color: Brand.primary, fontSize: 14, fontWeight: '600' },
  backPlaceholder: { width: 60 },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.3)' },
  dotActive: { backgroundColor: Brand.primary, width: 18 },

  step: { flex: 1, justifyContent: 'space-between', paddingVertical: Spacing.four },
  scrollStep: { gap: Spacing.three, paddingVertical: Spacing.two },
  heroArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.two },
  topArea: { flex: 1, gap: Spacing.three, paddingHorizontal: Spacing.two },
  heroEmoji: { fontSize: 60, lineHeight: 80 },
  heroTitle: { fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroSlogan: { textAlign: 'center', fontWeight: '700', fontSize: 15, color: Brand.primary, letterSpacing: 0.3 },
  heroBody: { textAlign: 'center', lineHeight: 22 },
  stepTitle: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  stepSub: { lineHeight: 20 },
  selectorWrap: { marginTop: Spacing.two },

  fieldBlock: { gap: Spacing.two },
  fieldLabel: { fontSize: 10, letterSpacing: 0.8 },
  inputWrap: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two },
  textInput: { fontSize: 16, paddingVertical: Spacing.two + 4, fontWeight: '600' },

  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 4,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  dateValue: { fontSize: 15, fontWeight: '600' },
  datePlaceholder: { color: 'rgba(128,128,128,0.45)', fontWeight: '500' },

  housingOption: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(128,128,128,0.06)',
    padding: Spacing.two,
  },
  housingOptionActive: { borderColor: Brand.primary, backgroundColor: `${Brand.primary}12` },
  housingLabel: { fontSize: 14, fontWeight: '600' },
  dateIcon: { fontSize: 18 },
  dateHint: { color: Brand.tactical, fontSize: 11, marginTop: -Spacing.one },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  gradeChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  gradeChipActive: { backgroundColor: Brand.primary + '20', borderColor: Brand.primary },
  gradeChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(128,128,128,0.8)' },
  gradeChipTextActive: { color: Brand.primary },

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
  toggleLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },

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

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
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
