import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { deepLinkToSubscriptions } from 'expo-iap';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedbackModal } from '@/components/FeedbackModal';
import { TutorialModal } from '@/components/TutorialModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { ALL_QUICK_ACTIONS } from '@/data/quick-actions';
import { useThemeColors } from '@/hooks/use-theme';
import { useIsAdmin } from '@/hooks/use-admin';
import { useIsPro } from '@/hooks/use-is-pro';
import { ANDROID_PRODUCT_ID } from '@/services/iap';
import { useAuthStore } from '@/store/auth.store';
import { useBudgetStore } from '@/store/budget.store';
import { useDebtStore } from '@/store/debt.store';
import { useExpensesStore } from '@/store/expenses.store';
import { useKidModeStore } from '@/store/kid-mode.store';
import { useKidsStore } from '@/store/kids.store';
import { useLifeEventsStore } from '@/store/life-events.store';
import { useNetWorthStore } from '@/store/networth.store';
import { useNwSnapshotsStore } from '@/store/networth-snapshots.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';

const MAX_TILES = 4;

const ANDROID_PACKAGE = 'com.nanito85.MilBudgetBuddy';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
// TODO: replace with the real numeric App Store ID once the iOS app is live
// (App Store Connect > App Information), e.g. `https://apps.apple.com/app/id1234567890?action=write-review`.
const IOS_APP_STORE_ID = '';
const IOS_STORE_URL = IOS_APP_STORE_ID
  ? `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`
  : 'https://apps.apple.com/search?term=milbudgetbuddy';

const FONT_SCALE_OPTIONS: { label: string; sublabel: string; value: number }[] = [
  { label: 'Normal',     sublabel: 'Default text size',        value: 1.0 },
  { label: 'Large',      sublabel: 'Slightly bigger text',     value: 1.2 },
  { label: 'X-Large',   sublabel: 'Easier to read',           value: 1.4 },
  { label: 'XX-Large',  sublabel: 'Maximum accessibility',    value: 1.6 },
];

// ── PIN Management Modal ────────────────────────────────────────────────────────

function PINManageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const currentPin = useKidModeStore((s) => s.pin);
  const setPin = useKidModeStore((s) => s.setPin);
  const clearPin = useKidModeStore((s) => s.clearPin);

  const [step, setStep] = useState<'menu' | 'new' | 'confirm'>('menu');
  const [newPin, setNewPin] = useState('');
  const [digits, setDigits] = useState('');

  const reset = () => { setStep('menu'); setNewPin(''); setDigits(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleDigit = (d: string) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (step === 'new') { setNewPin(next); setDigits(''); setStep('confirm'); }
        else if (step === 'confirm') {
          if (next === newPin) {
            setPin(next).then(() => {
              Alert.alert('PIN Updated', 'Your Kids Mode PIN has been set.');
              handleClose();
            });
          } else {
            Alert.alert('Mismatch', 'PINs do not match. Try again.');
            setDigits(''); setStep('new'); setNewPin('');
          }
        }
      }, 150);
    }
  };
  const handleDel = () => setDigits((d) => d.slice(0, -1));

  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0',''];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={pinModalStyles.bg}>
        <SafeAreaView style={pinModalStyles.safe}>
          <View style={pinModalStyles.header}>
            <Pressable onPress={handleClose}><ThemedText style={pinModalStyles.cancel}>CANCEL</ThemedText></Pressable>
            <ThemedText style={pinModalStyles.title}>// KIDS MODE PIN</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          {step === 'menu' && (
            <View style={pinModalStyles.menuContent}>
              <ThemedText style={pinModalStyles.menuIcon}>🔐</ThemedText>
              <ThemedText style={pinModalStyles.menuHeading}>
                {currentPin ? 'PIN IS SET' : 'NO PIN SET'}
              </ThemedText>
              <ThemedText style={pinModalStyles.menuSub}>
                {currentPin
                  ? 'A PIN is required to exit Kids Mode back to the parent view.'
                  : 'Without a PIN, anyone can exit Kids Mode. Set one to keep your kids in their view.'}
              </ThemedText>

              <Pressable onPress={() => { setStep('new'); setDigits(''); }} style={pinModalStyles.primaryBtn}>
                <ThemedText style={pinModalStyles.primaryBtnText}>
                  {currentPin ? 'CHANGE PIN' : 'SET NEW PIN'}
                </ThemedText>
              </Pressable>

              {currentPin && (
                <Pressable
                  onPress={() => Alert.alert('Remove PIN', 'Kids will be able to exit Kids Mode without a PIN.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => { clearPin().then(handleClose); } },
                  ])}
                  style={pinModalStyles.dangerBtn}>
                  <ThemedText style={pinModalStyles.dangerBtnText}>REMOVE PIN</ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {(step === 'new' || step === 'confirm') && (
            <View style={pinModalStyles.padContent}>
              <ThemedText style={pinModalStyles.padTitle}>
                {step === 'new' ? 'ENTER NEW PIN' : 'CONFIRM PIN'}
              </ThemedText>
              <ThemedText style={pinModalStyles.padSub}>
                {step === 'new' ? 'Choose a 4-digit PIN' : 'Re-enter the same PIN to confirm'}
              </ThemedText>
              <View style={pinModalStyles.dots}>
                {[0,1,2,3].map((i) => (
                  <View key={i} style={[pinModalStyles.dot, digits.length > i && pinModalStyles.dotFilled]} />
                ))}
              </View>
              <View style={pinModalStyles.grid}>
                {keys.map((k, idx) => (
                  <Pressable key={idx}
                    onPress={() => { if (k === '⌫') handleDel(); else if (k !== '') handleDigit(k); }}
                    style={({ pressed }) => [pinModalStyles.key, k === '' && { opacity: 0 }, pressed && k !== '' && { backgroundColor: Brand.accent + '20' }]}>
                    <ThemedText style={[pinModalStyles.keyText, k === '⌫' && { fontSize: 22 }]}>{k}</ThemedText>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => { setStep('menu'); setDigits(''); setNewPin(''); }}>
                <ThemedText style={pinModalStyles.back}>← BACK</ThemedText>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const pinModalStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#04080F' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: '#C8D8E8' },
  cancel: { fontSize: 12, fontWeight: '700', color: '#3D6080', letterSpacing: 0.5, width: 60 },
  menuContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  menuIcon: { fontSize: 54, lineHeight: 64 },
  menuHeading: { fontSize: 18, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8' },
  menuSub: { fontSize: 13, color: '#6B92B0', textAlign: 'center', lineHeight: 20 },
  primaryBtn: { backgroundColor: Brand.tactical, borderRadius: 8, paddingHorizontal: Spacing.five, paddingVertical: Spacing.two + 4, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  dangerBtn: { borderWidth: 1, borderColor: Brand.classified + '50', borderRadius: 8, paddingHorizontal: Spacing.five, paddingVertical: Spacing.two + 4, width: '100%', alignItems: 'center' },
  dangerBtnText: { color: Brand.classified, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  padContent: { flex: 1, alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  padTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, color: '#C8D8E8' },
  padSub: { fontSize: 12, color: '#6B92B0' },
  dots: { flexDirection: 'row', gap: 20, marginVertical: Spacing.three },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Brand.tactical, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: Brand.tactical },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 240 },
  key: { width: 80, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  keyText: { fontSize: 26, fontWeight: '600', color: '#C8D8E8' },
  back: { fontSize: 13, fontWeight: '700', color: '#3D6080', marginTop: Spacing.two, letterSpacing: 0.5 },
});

// ── Main Settings Screen ─────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const savedIds      = useUserStore((s) => s.quickAccessIds);
  const resetAll      = useUserStore((s) => s.resetAll);
  const fontScale     = useUserStore((s) => s.fontScale ?? 1.0);
  const appTheme      = useUserStore((s) => s.appTheme ?? 'dark');
  const setQuickAccessIds = useUserStore((s) => s.setQuickAccessIds);
  const setFontScale  = useUserStore((s) => s.setFontScale);
  const setAppTheme   = useUserStore((s) => s.setAppTheme);

  const kidPin = useKidModeStore((s) => s.pin);

  const [selected, setSelected]       = useState<string[]>(savedIds.slice(0, MAX_TILES));
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPINManage, setShowPINManage] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isAdmin, resolving: adminResolving } = useIsAdmin();
  const isPro = useIsPro();
  const proExpiresAt = useUserStore((s) => s.proExpiresAt);

  const { user, signOut: signOutUser, deleteAccount } = useAuthStore();

  const bg     = tc.background;
  const card   = tc.surface;
  const text   = tc.textPrimary;
  const textDim= tc.textMuted;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_TILES) return prev;
      return [...prev, id];
    });
  };

  const save = () => {
    setQuickAccessIds(selected);
    router.back();
  };

  const handleManageSubscription = async () => {
    try {
      await deepLinkToSubscriptions({ skuAndroid: ANDROID_PRODUCT_ID, packageNameAndroid: ANDROID_PACKAGE });
    } catch {
      Alert.alert('Unavailable', 'Could not open subscription management. Check your device\'s App Store or Play Store settings directly.');
    }
  };

  const handleRateApp = () => {
    Linking.openURL(Platform.OS === 'ios' ? IOS_STORE_URL : PLAY_STORE_URL).catch(() => {});
  };

  const handleShareApp = () => {
    Share.share({
      message: `I've been using MilBudgetBuddy to manage my military pay and budget — thought you might find it useful too. ${Platform.OS === 'ios' ? IOS_STORE_URL : PLAY_STORE_URL}`,
    }).catch(() => {});
  };

  return (
    <ThemedView style={styles.container}>
      <TutorialModal visible={showTutorial} onDismiss={() => setShowTutorial(false)} />
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: tc.borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[styles.title, { color: text }]}>SETTINGS</ThemedText>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* ── PROFILE ────────────────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push('/profile' as any)}
          style={({ pressed }) => [
            styles.profileNavRow,
            { backgroundColor: card, borderColor: tc.borderColor },
            pressed && { opacity: 0.7 },
          ]}>
          <ThemedText style={styles.profileNavIcon}>🪖</ThemedText>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText style={[styles.profileNavTitle, { color: text }]}>PERSONNEL FILE</ThemedText>
            <ThemedText type="small" style={[styles.profileNavSub, { color: textDim }]}>Branch, pay grade, family, special pays</ThemedText>
          </View>
          <ThemedText style={[styles.profileNavChevron, { color: Brand.tactical }]}>›</ThemedText>
        </Pressable>

        {/* ── APPEARANCE ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// APPEARANCE</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>THEME</ThemedText>
          <ThemedText type="small" style={[styles.sectionDesc, { color: textDim }]}>
            Choose how the app looks.
          </ThemedText>
        </View>

        <View style={styles.fontGrid}>
          {(['dark', 'light'] as const).map((opt) => {
            const isSelected = appTheme === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setAppTheme(opt)}
                style={({ pressed }) => [
                  styles.fontTile,
                  { backgroundColor: card, borderColor: isSelected ? Brand.accent : tc.borderColor },
                  isSelected && { backgroundColor: Brand.accent + '12' },
                  pressed && { opacity: 0.7 },
                ]}>
                <ThemedText style={[styles.fontTileLabel, { color: isSelected ? Brand.accent : text }]}>
                  {opt === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </ThemedText>
                <ThemedText style={[styles.fontTileSub, { color: isSelected ? Brand.accent + 'CC' : textDim }]}>
                  {opt === 'dark' ? 'Tactical, low-glare' : 'Bright, high-contrast'}
                </ThemedText>
                {isSelected && (
                  <View style={styles.fontTileCheck}>
                    <ThemedText style={styles.fontTileCheckMark}>✓</ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── FONT SIZE ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// ACCESSIBILITY</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>TEXT SIZE</ThemedText>
          <ThemedText type="small" style={[styles.sectionDesc, { color: textDim }]}>
            Increase text size for easier reading. Layouts adjust automatically.
          </ThemedText>
        </View>

        <View style={styles.fontGrid}>
          {FONT_SCALE_OPTIONS.map((opt) => {
            const isSelected = Math.abs(fontScale - opt.value) < 0.05;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFontScale(opt.value)}
                style={({ pressed }) => [
                  styles.fontTile,
                  { backgroundColor: card, borderColor: isSelected ? Brand.accent : tc.borderColor },
                  isSelected && { backgroundColor: Brand.accent + '12' },
                  pressed && { opacity: 0.7 },
                ]}>
                <ThemedText style={[styles.fontTileLabel, { color: isSelected ? Brand.accent : text, fontSize: 15 * opt.value }]}>
                  {opt.label}
                </ThemedText>
                <ThemedText style={[styles.fontTileSub, { color: isSelected ? Brand.accent + 'CC' : textDim, fontSize: 9 }]}>
                  {opt.sublabel}
                </ThemedText>
                {isSelected && (
                  <View style={styles.fontTileCheck}>
                    <ThemedText style={styles.fontTileCheckMark}>✓</ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── HOME SCREEN TILES ──────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// HOME SCREEN</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>QUICK ACCESS TILES</ThemedText>
          <ThemedText type="small" style={[styles.sectionDesc, { color: textDim }]}>
            Select up to {MAX_TILES} tools to show on your home screen.
          </ThemedText>
        </View>

        {/* ON HOME SCREEN */}
        <ThemedText type="label" style={[styles.tileGroupLabel, { color: Brand.tactical }]}>
          ON HOME SCREEN — {selected.length}/{MAX_TILES}
        </ThemedText>
        <View style={styles.tilesGrid}>
          {ALL_QUICK_ACTIONS.filter((a) => selected.includes(a.id)).map((action) => (
            <Pressable
              key={action.id}
              onPress={() => toggle(action.id)}
              style={({ pressed }) => [
                styles.tileCube,
                { backgroundColor: action.color + '18', borderColor: action.color + '70' },
                pressed && { opacity: 0.7 },
              ]}>
              <ThemedText style={styles.tileCubeIcon}>{action.icon}</ThemedText>
              <ThemedText style={[styles.tileCubeLabel, { color: action.color }]} numberOfLines={2}>
                {action.label}
              </ThemedText>
              <ThemedText style={[styles.tileCubeRemove, { color: action.color }]}>✕</ThemedText>
            </Pressable>
          ))}
          {selected.length < MAX_TILES && Array.from({ length: MAX_TILES - selected.length }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.tileCube, styles.tileCubeEmpty, { borderColor: tc.borderColor, backgroundColor: card }]}>
              <ThemedText style={[styles.tileCubeEmptyText, { color: textDim }]}>+</ThemedText>
            </View>
          ))}
        </View>

        {/* Separator */}
        <View style={[styles.tilesDivider, { borderColor: tc.borderColor }]}>
          <View style={[styles.tilesDividerLine, { backgroundColor: tc.borderColor }]} />
          <ThemedText type="label" style={[styles.tilesDividerLabel, { color: textDim }]}>
            AVAILABLE — TAP TO ADD
          </ThemedText>
          <View style={[styles.tilesDividerLine, { backgroundColor: tc.borderColor }]} />
        </View>

        {/* NOT ON HOME SCREEN */}
        <View style={styles.tilesGrid}>
          {ALL_QUICK_ACTIONS.filter((a) => !selected.includes(a.id)).map((action) => {
            const isDisabled = selected.length >= MAX_TILES;
            return (
              <Pressable
                key={action.id}
                onPress={() => toggle(action.id)}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.tileCube,
                  { backgroundColor: card, borderColor: tc.borderColor },
                  isDisabled && { opacity: 0.35 },
                  pressed && !isDisabled && { opacity: 0.7 },
                ]}>
                <ThemedText style={styles.tileCubeIcon}>{action.icon}</ThemedText>
                <ThemedText style={[styles.tileCubeLabel, { color: textDim }]} numberOfLines={2}>
                  {action.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* ── ACCOUNT ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// SYNC & BACKUP</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>ACCOUNT</ThemedText>
        </View>

        {user ? (
          <View style={[settingsProStyles.statusCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }]}>
            <ThemedText style={settingsProStyles.proIcon}>☁️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>SYNCED — DATA BACKED UP</ThemedText>
              <ThemedText style={[settingsProStyles.proSub, { color: textDim }]} numberOfLines={1}>{user.email}</ThemedText>
            </View>
            <View style={{ gap: 6 }}>
              <Pressable
                onPress={() => signOutUser()}
                style={[settingsProStyles.upgradeBtn, { backgroundColor: tc.surfaceInner }]}>
                <ThemedText style={[settingsProStyles.upgradeBtnText, { color: tc.textSecondary }]}>SIGN OUT</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/auth/sign-in' as any)}
            style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={settingsProStyles.proIcon}>☁️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>SIGN IN TO SYNC</ThemedText>
              <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Access your data from any device.</ThemedText>
            </View>
            <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
          </Pressable>
        )}

        {/* ── PRO ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// SUBSCRIPTION</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>PRO</ThemedText>
        </View>

        {isPro ? (
          <Pressable
            onPress={() => router.push('/paywall' as any)}
            style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={settingsProStyles.proIcon}>✓</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>PRO ACTIVE</ThemedText>
              <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>
                {proExpiresAt ? `Renews/expires ${new Date(proExpiresAt).toLocaleDateString()}` : 'Manage your subscription'}
              </ThemedText>
            </View>
            <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
          </Pressable>
        ) : null}

        {isPro && (
          <Pressable
            onPress={handleManageSubscription}
            style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={settingsProStyles.proIcon}>⚙️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={[settingsProStyles.proTitle, { color: text }]}>MANAGE SUBSCRIPTION</ThemedText>
              <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Change plan or cancel via {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}.</ThemedText>
            </View>
            <ThemedText style={[settingsProStyles.chevron, { color: textDim }]}>›</ThemedText>
          </Pressable>
        )}

        {!isPro && (
          <Pressable
            onPress={() => router.push('/paywall' as any)}
            style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.accent + '40' }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={settingsProStyles.proIcon}>🎖️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={[settingsProStyles.proTitle, { color: Brand.accent }]}>UPGRADE TO PRO</ThemedText>
              <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>7-day free trial, then $4.99/mo or $49.99/yr.</ThemedText>
            </View>
            <ThemedText style={[settingsProStyles.chevron, { color: Brand.accent }]}>›</ThemedText>
          </Pressable>
        )}

        {/* ── TUTORIAL ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// ORIENTATION</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>TUTORIAL</ThemedText>
        </View>

        <Pressable
          onPress={() => setShowTutorial(true)}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.accent + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>🎖️</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: Brand.accent }]}>APP TUTORIAL</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Review the app orientation and feature overview.</ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: Brand.accent }]}>›</ThemedText>
        </Pressable>

        {/* ── FEEDBACK ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// HELP US IMPROVE</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>FEEDBACK</ThemedText>
        </View>

        <Pressable
          onPress={() => setShowFeedback(true)}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>💬</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>SEND FEEDBACK</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Report a bug, request a feature, or share a thought.</ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
        </Pressable>

        {/* ── SUPPORT THE APP ───────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// SPREAD THE WORD</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>SUPPORT MILBUDGETBUDDY</ThemedText>
        </View>

        <Pressable
          onPress={handleRateApp}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>⭐</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>RATE MILBUDGETBUDDY</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Leave a review on the {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}.</ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleShareApp}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>📤</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>SHARE WITH A FRIEND</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Know someone who could use this? Send them the link.</ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
        </Pressable>

        {/* ── KIDS MODE ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// PARENTAL CONTROLS</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>KIDS MODE PIN</ThemedText>
        </View>

        <Pressable
          onPress={() => setShowPINManage(true)}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>🔐</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>
              {kidPin ? 'CHANGE KIDS MODE PIN' : 'SET KIDS MODE PIN'}
            </ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>
              {kidPin ? 'PIN is active — tap to change or remove it.' : 'No PIN set — kids can freely exit Kids Mode.'}
            </ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
        </Pressable>

        {/* ── DATA ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// DATA MANAGEMENT</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>RESET OPTIONS</ThemedText>
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Reset All Data',
              'This will wipe your profile, budget, debts, goals, kids, and all other saved data. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset Everything',
                  style: 'destructive',
                  onPress: async () => {
                    resetAll();
                    useTipsStore.setState({ savedTipIds: [] }, false);
                    useBudgetStore.getState().resetAll();
                    useDebtStore.getState().resetAll();
                    useNetWorthStore.getState().resetAll();
                    useNwSnapshotsStore.getState().clearHistory();
                    useSavingsGoalsStore.getState().resetAll();
                    useExpensesStore.getState().resetAll();
                    useKidsStore.getState().resetAll();
                    useLifeEventsStore.getState().resetAll();
                    await useKidModeStore.getState().resetAll();
                    await AsyncStorage.clear();
                    router.replace('/' as any);
                  },
                },
              ],
            )
          }
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: '#E74C3C40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>🗑️</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: '#E74C3C' }]}>RESET ALL DATA</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Wipe profile, budget, and settings. Starts fresh.</ThemedText>
          </View>
        </Pressable>

        {/* ── PRIVACY & LEGAL ────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// COMPLIANCE</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>PRIVACY & LEGAL</ThemedText>
        </View>

        <Pressable
          onPress={() => router.push('/privacy-center' as any)}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>🔐</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: Brand.tactical }]}>PRIVACY CENTER</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>What data we collect, how it's protected, your rights.</ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: Brand.tactical }]}>›</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/terms' as any)}
          style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={settingsProStyles.proIcon}>📄</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[settingsProStyles.proTitle, { color: text }]}>TERMS OF SERVICE</ThemedText>
            <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Disclaimer and user agreement.</ThemedText>
          </View>
          <ThemedText style={[settingsProStyles.chevron, { color: textDim }]}>›</ThemedText>
        </Pressable>

        {!adminResolving && isAdmin && (
          <>
            <Pressable
              onPress={() => router.push('/admin/feedback' as any)}
              style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: '#8B5CF640' }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={settingsProStyles.proIcon}>🔐</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[settingsProStyles.proTitle, { color: '#8B5CF6' }]}>ADMIN — FEEDBACK DASHBOARD</ThemedText>
                <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>View, filter, and respond to all user feedback.</ThemedText>
              </View>
              <ThemedText style={[settingsProStyles.chevron, { color: '#8B5CF6' }]}>›</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/admin/reports' as any)}
              style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: '#8B5CF640' }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={settingsProStyles.proIcon}>📊</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[settingsProStyles.proTitle, { color: '#8B5CF6' }]}>ADMIN — AI REPORTS</ThemedText>
                <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Generate daily/weekly AI summaries and view past reports.</ThemedText>
              </View>
              <ThemedText style={[settingsProStyles.chevron, { color: '#8B5CF6' }]}>›</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/admin/codes' as any)}
              style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: '#8B5CF640' }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={settingsProStyles.proIcon}>🎟️</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[settingsProStyles.proTitle, { color: '#8B5CF6' }]}>ADMIN — DISCOUNT CODES</ThemedText>
                <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Create and manage promo codes for Pro access.</ThemedText>
              </View>
              <ThemedText style={[settingsProStyles.chevron, { color: '#8B5CF6' }]}>›</ThemedText>
            </Pressable>
          </>
        )}

        {/* ── DELETE ACCOUNT (bottom) ─────────────────────────────────── */}
        {user && (
          <>
            <View style={styles.section}>
              <ThemedText type="label" style={styles.eyebrow}>// DANGER ZONE</ThemedText>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Delete Account',
                  'This permanently deletes your account and all synced data. Local data on this device will remain until you reset the app. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete Account',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteAccount();
                        } catch {
                          Alert.alert('Error', 'Could not delete account. You may need to sign out and sign back in first, then try again.');
                        }
                      },
                    },
                  ],
                )
              }
              style={({ pressed }) => [settingsProStyles.upgradeCard, { backgroundColor: card, borderColor: Brand.danger + '30' }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={settingsProStyles.proIcon}>🗑️</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[settingsProStyles.proTitle, { color: Brand.danger }]}>DELETE ACCOUNT</ThemedText>
                <ThemedText style={[settingsProStyles.proSub, { color: textDim }]}>Permanently remove your account and all synced data.</ThemedText>
              </View>
            </Pressable>
          </>
        )}

        <ThemedText type="small" themeColor="textMuted" style={styles.versionText}>
          MilBudgetBuddy v{Constants.expoConfig?.version ?? '1.0.0'}
        </ThemedText>

      </ScrollView>

      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
      <PINManageModal visible={showPINManage} onClose={() => setShowPINManage(false)} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, backgroundColor: bg, borderTopColor: tc.borderColor }]}>
        <Pressable onPress={save} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}>
          <ThemedText style={styles.saveBtnText}>SAVE CHANGES</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical, lineHeight: 22 },
  title: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', letterSpacing: 2 },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.three, paddingTop: Spacing.three },
  section: { gap: Spacing.one },
  versionText: { textAlign: 'center', marginTop: Spacing.three, marginBottom: Spacing.two },
  eyebrow: { color: Brand.tactical, fontSize: 9 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  sectionDesc: { fontSize: 13, lineHeight: 18 },

  profileNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: Spacing.three,
  },
  profileNavIcon: { fontSize: 22, lineHeight: 26 },
  profileNavTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  profileNavSub: { fontSize: 12 },
  profileNavChevron: { fontSize: 22, fontWeight: '300' },

  tileCube: {
    width: '18%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: Spacing.one,
  },
  tileCubeIcon: { fontSize: 18, lineHeight: 22 },
  tileCubeLabel: { fontSize: 7, fontWeight: '700', textAlign: 'center', letterSpacing: 0.1, lineHeight: 10 },

  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  fontTile: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: 4,
    minHeight: 72,
    justifyContent: 'center',
  },
  fontTileLabel: { fontWeight: '800', letterSpacing: 0.3 },
  fontTileSub: { lineHeight: 13 },
  fontTileCheck: {
    position: 'absolute',
    top: Spacing.one + 2,
    right: Spacing.two,
  },
  fontTileCheckMark: { color: Brand.accent, fontSize: 14, fontWeight: '900' },

  tileGroupLabel: { fontSize: 9, letterSpacing: 0.8 },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tileCubeEmpty: { borderStyle: 'dashed' },
  tileCubeEmptyText: { fontSize: 18, fontWeight: '300' },
  tilesDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tilesDividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  tilesDividerLabel: { fontSize: 9, letterSpacing: 0.5 },
  tileCubeRemove: { fontSize: 8, fontWeight: '700', marginTop: -2 },

  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    backgroundColor: Brand.tactical,
    borderRadius: 4,
    padding: Spacing.three,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});

const settingsProStyles = StyleSheet.create({
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 6,
    padding: Spacing.three,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 6,
    padding: Spacing.three,
  },
  proIcon: { fontSize: 22, lineHeight: 26 },
  proTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, marginBottom: 2 },
  proSub: { fontSize: 11, lineHeight: 15 },
  upgradeBtn: {
    backgroundColor: Brand.accent,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
  upgradeBtnText: { color: '#04080F', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  chevron: { fontSize: 22, fontWeight: '300' },
});
