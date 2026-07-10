import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import {
  IAP_PRICE_MONTHLY,
  IAP_PRICE_ANNUAL,
  IAP_PRICE_ANNUAL_MONTHLY,
  PROMO_DAYS,
} from '@/constants/features';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useEntitlementStore } from '@/store/entitlement.store';
import { purchaseSubscription, restorePurchases } from '@/services/iap';
import { auth } from '@/services/firebase';
import { useThemeColors } from '@/hooks/use-theme';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// ── Feature lists ───────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { label: 'Pay Chart lookup', included: true },
  { label: 'BAH Guide (FY2026 rates)', included: true },
  { label: 'LES Pay Statement Decoder', included: true },
  { label: 'PCS Calculator', included: true },
  { label: '3 budget categories', included: true },
  { label: '1 kid profile', included: true },
  { label: '20+ calculators & guides', included: false },
  { label: 'Full budget (all categories)', included: false },
  { label: 'Multiple kid profiles', included: false },
  { label: 'Net Worth Tracker', included: false },
  { label: 'Savings Goals', included: false },
];

const PRO_FEATURES = [
  { label: '24+ calculators & tools', icon: '💰' },
  { label: 'All budget categories + custom', icon: '📊' },
  { label: 'Multiple kids profiles', icon: '👨‍👩‍👧‍👦' },
  { label: 'Net Worth Tracker', icon: '📈' },
  { label: 'Savings Goals', icon: '🎯' },
  { label: 'Deployment & TSP planning', icon: '🪖' },
  { label: 'VA Disability & GI Bill', icon: '🎖️' },
  { label: 'Cloud sync across devices', icon: '☁️' },
];

// ── Plan Selector Card ──────────────────────────────────────────────────────────

type Plan = 'monthly' | 'annual';

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAnnual = plan === 'annual';
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onSelect}
      style={[s.planCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }, selected && s.planCardSelected]}>
      {isAnnual && (
        <View style={s.savingsBadge}>
          <ThemedText style={s.savingsBadgeText}>SAVE 17%</ThemedText>
        </View>
      )}
      <ThemedText style={[s.planTitle, { color: tc.textMuted }, selected && { color: Brand.accent }]}>
        {isAnnual ? 'ANNUAL' : 'MONTHLY'}
      </ThemedText>
      <ThemedText style={[s.planPrice, { color: tc.textSecondary }, selected && { color: tc.textPrimary }]}>
        {isAnnual ? IAP_PRICE_ANNUAL : IAP_PRICE_MONTHLY}
      </ThemedText>
      <ThemedText style={[s.planSub, { color: tc.textMuted }]}>
        {isAnnual ? `${IAP_PRICE_ANNUAL_MONTHLY}/mo · billed annually` : 'billed monthly'}
      </ThemedText>
    </Pressable>
  );
}

// ── Promo Code Redeemer ─────────────────────────────────────────────────────────

function PromoCodeField() {
  const tc = useThemeColors();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken() ?? null;
      const res = await fetch(`${API_BASE}/api/codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: trimmed }),
        signal: AbortSignal.timeout(8000),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Invalid Code', body.error ?? `Error ${res.status}`);
      } else {
        const until: string = body.proGrantedUntil;
        useEntitlementStore.getState().redeemCodeGrant(until);
        Alert.alert('Code Applied!', `Pro access granted until ${until.slice(0, 10)}.`);
        setCode('');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.promoSection}>
      <ThemedText style={s.sectionLabel}>// HAVE A PROMO CODE?</ThemedText>
      <View style={s.promoRow}>
        <View style={[s.promoInput, { flex: 1, backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="Enter code"
            placeholderTextColor={tc.textHint}
            style={[s.promoInputText, { color: tc.textPrimary }]}
            autoCapitalize="characters"
            maxLength={20}
            editable={!loading}
          />
        </View>
        <Pressable
          onPress={handleRedeem}
          disabled={loading || !code.trim()}
          style={[s.applyBtn, (!code.trim() || loading) && { opacity: 0.4 }]}>
          {loading
            ? <ActivityIndicator size="small" color="#04080F" />
            : <ThemedText style={s.applyBtnText}>APPLY</ThemedText>}
        </Pressable>
      </View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const { isPro, isTrial, isCodeGrant, status, daysLeft, subscriptionPlan } = useEntitlement();
  const proGrantedUntil = useEntitlementStore((s) => s.proGrantedUntil);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [purchasing,   setPurchasing]   = useState(false);
  const [restoring,    setRestoring]    = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseSubscription(selectedPlan);
      if (success) router.back();
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchases();
    setRestoring(false);
  };

  const showPurchaseUI = !isPro || isTrial;

  return (
    <ThemedView style={s.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <ThemedText style={s.backText}>‹ Back</ThemedText>
          </Pressable>

          <View style={s.heroSection}>
            <ThemedText style={s.eyebrow}>// MILBUDGETBUDDY</ThemedText>
            <ThemedText style={[s.heroTitle, { color: tc.textPrimary }]}>UPGRADE TO PRO</ThemedText>
            <ThemedText style={[s.heroSub, { color: tc.textSecondary }]}>
              Unlock the full military finance toolkit — every calculator, every guide, unlimited budgeting.
            </ThemedText>
          </View>

          {/* Status banners */}
          {isTrial && daysLeft > 0 && (
            <View style={s.banner}>
              <ThemedText style={s.bannerIcon}>⏳</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={s.bannerTitle}>
                  FREE TRIAL — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                </ThemedText>
                <ThemedText style={[s.bannerBody, { color: tc.textSecondary }]}>
                  You're in your {PROMO_DAYS}-day free trial. Subscribe before it ends to keep full access.
                </ThemedText>
              </View>
            </View>
          )}

          {isPro && isCodeGrant && proGrantedUntil && (
            <View style={[s.banner, { borderColor: Brand.tactical + '40', backgroundColor: Brand.tactical + '10' }]}>
              <ThemedText style={s.bannerIcon}>🎟️</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[s.bannerTitle, { color: Brand.tactical }]}>
                  PROMO CODE ACTIVE
                </ThemedText>
                <ThemedText style={[s.bannerBody, { color: tc.textSecondary }]}>
                  Pro access granted until {proGrantedUntil.slice(0, 10)}.
                </ThemedText>
              </View>
            </View>
          )}

          {isPro && !isCodeGrant && (
            <View style={[s.banner, { borderColor: Brand.success + '40', backgroundColor: Brand.success + '10' }]}>
              <ThemedText style={s.bannerIcon}>✅</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[s.bannerTitle, { color: Brand.success }]}>
                  YOU'RE PRO — ALL FEATURES UNLOCKED
                </ThemedText>
                <ThemedText style={[s.bannerBody, { color: tc.textSecondary }]}>
                  {subscriptionPlan === 'annual' ? 'Annual subscription active.' : 'Monthly subscription active.'}{' '}
                  Manage in Google Play → Subscriptions.
                </ThemedText>
              </View>
            </View>
          )}

          {/* Pro features grid */}
          <View style={s.section}>
            <ThemedText style={s.sectionLabel}>// WHAT YOU GET WITH PRO</ThemedText>
            <View style={s.proGrid}>
              {PRO_FEATURES.map((f) => (
                <View key={f.label} style={[s.proFeatureCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
                  <ThemedText style={s.proFeatureIcon}>{f.icon}</ThemedText>
                  <ThemedText style={[s.proFeatureLabel, { color: tc.textPrimary }]}>{f.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Free vs Pro comparison */}
          <View style={s.section}>
            <ThemedText style={s.sectionLabel}>// FREE VS PRO</ThemedText>
            <View style={[s.compareTable, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              {FREE_FEATURES.map((f) => (
                <View key={f.label} style={[s.compareRow, { borderBottomColor: tc.borderColor }]}>
                  <ThemedText style={[s.compareCheck, { color: f.included ? Brand.tactical : tc.textMuted }]}>
                    {f.included ? '✓' : '✗'}
                  </ThemedText>
                  <ThemedText style={[s.compareLabel, { color: tc.textPrimary }, !f.included && [s.compareLocked, { color: tc.textSecondary }]]}>
                    {f.label}
                  </ThemedText>
                  {!f.included && (
                    <View style={s.proBadge}>
                      <ThemedText style={s.proBadgeText}>PRO</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Plan selector + purchase */}
          {showPurchaseUI && (
            <>
              <View style={s.section}>
                <ThemedText style={s.sectionLabel}>// CHOOSE YOUR PLAN</ThemedText>
                <View style={s.planRow}>
                  <PlanCard plan="monthly" selected={selectedPlan === 'monthly'} onSelect={() => setSelectedPlan('monthly')} />
                  <PlanCard plan="annual"  selected={selectedPlan === 'annual'}  onSelect={() => setSelectedPlan('annual')}  />
                </View>
              </View>

              <Pressable
                onPress={handlePurchase}
                disabled={purchasing}
                style={({ pressed }) => [s.purchaseBtn, (purchasing || pressed) && { opacity: 0.7 }]}>
                <ThemedText style={s.purchaseBtnText}>
                  {purchasing
                    ? 'PROCESSING...'
                    : `START PRO · ${selectedPlan === 'annual' ? IAP_PRICE_ANNUAL + '/yr' : IAP_PRICE_MONTHLY + '/mo'}`}
                </ThemedText>
              </Pressable>

              <Pressable onPress={handleRestore} disabled={restoring} style={s.restoreBtn}>
                <ThemedText style={s.restoreBtnText}>
                  {restoring ? 'Restoring...' : 'Already subscribed? Restore'}
                </ThemedText>
              </Pressable>
            </>
          )}

          {/* Promo code */}
          <PromoCodeField />

          {/* Footer notes */}
          <ThemedText style={[s.footerNote, { color: tc.textMuted }]}>
            All your data is saved regardless of plan. Upgrading unlocks features — it never deletes anything.
          </ThemedText>

          {/* Subscription disclosure — required by Google Play */}
          <ThemedText style={[s.disclosureNote, { color: tc.textMuted }]}>
            MilBudgetBuddy Pro is an auto-renewing subscription. Monthly plan: {IAP_PRICE_MONTHLY}/month.
            Annual plan: {IAP_PRICE_ANNUAL}/year (equivalent to {IAP_PRICE_ANNUAL_MONTHLY}/month).
            Payment is charged to your Google Play account at confirmation of purchase. Subscription
            automatically renews unless auto-renewal is turned off at least 24 hours before the end
            of the current period. You can manage and cancel your subscription at any time in
            Google Play → Subscriptions. No refund is provided for the unused portion of the
            current subscription period. Prices may vary by region.
          </ThemedText>

          <Pressable onPress={() => router.push('/legal' as any)} style={s.legalLink}>
            <ThemedText style={[s.legalLinkText, { color: tc.textMuted }]}>Privacy Policy & Terms of Service</ThemedText>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },

  backBtn:  { paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical, lineHeight: 22 },

  heroSection: { gap: Spacing.one, paddingBottom: Spacing.two },
  eyebrow:     { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle:   { fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  heroSub:     { fontSize: 13, lineHeight: 20, marginTop: 4 },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    backgroundColor: Brand.accent + '10', borderWidth: 1, borderColor: Brand.accent + '40',
    borderRadius: 6, padding: Spacing.three,
  },
  bannerIcon:  { fontSize: 20, lineHeight: 24 },
  bannerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: Brand.accent, marginBottom: 2 },
  bannerBody:  { fontSize: 11, lineHeight: 16 },

  section:      { gap: Spacing.two },
  sectionLabel: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  proGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  proFeatureCard: {
    width: '47.5%', borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6, padding: Spacing.two + 2, gap: 4,
  },
  proFeatureIcon:  { fontSize: 20, lineHeight: 26 },
  proFeatureLabel: { fontSize: 11, fontWeight: '700', lineHeight: 15 },

  compareTable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6, overflow: 'hidden',
  },
  compareRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.two,
  },
  compareCheck:  { fontSize: 14, fontWeight: '800', width: 16, textAlign: 'center' },
  compareLabel:  { flex: 1, fontSize: 13 },
  compareLocked: {},
  proBadge:      { backgroundColor: Brand.accent + '20', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  proBadgeText:  { color: Brand.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  planRow: { flexDirection: 'row', gap: Spacing.two },
  planCard: {
    flex: 1, borderWidth: 1,
    borderRadius: 8, padding: Spacing.three, gap: 4, alignItems: 'center', position: 'relative',
  },
  planCardSelected: { borderColor: Brand.accent, backgroundColor: Brand.accent + '10' },
  savingsBadge: {
    position: 'absolute', top: -10, alignSelf: 'center',
    backgroundColor: Brand.accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  savingsBadgeText: { fontSize: 9, fontWeight: '900', color: '#04080F', letterSpacing: 0.5 },
  planTitle:  { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  planPrice:  { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  planSub:    { fontSize: 9, textAlign: 'center' },

  purchaseBtn: {
    backgroundColor: Brand.accent, borderRadius: 6,
    padding: Spacing.three + 2, alignItems: 'center',
  },
  purchaseBtnText: { color: '#04080F', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  restoreBtn:     { alignItems: 'center', paddingVertical: Spacing.two },
  restoreBtnText: { color: Brand.tactical, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  promoSection: { gap: Spacing.two },
  promoRow:     { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  promoInput:   {
    borderWidth: 1,
    borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 4,
  },
  promoInputText: { fontSize: 15, fontWeight: '700' },
  applyBtn: {
    backgroundColor: Brand.accent, borderRadius: 6,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 6, alignItems: 'center',
  },
  applyBtnText: { color: '#04080F', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  footerNote: {
    fontSize: 11, textAlign: 'center',
    lineHeight: 16, paddingHorizontal: Spacing.three,
  },
  disclosureNote: {
    fontSize: 10, textAlign: 'center',
    lineHeight: 15, paddingHorizontal: Spacing.two,
  },
  legalLink:     { alignItems: 'center', paddingVertical: 4 },
  legalLinkText: { fontSize: 10, textDecorationLine: 'underline' },
});
