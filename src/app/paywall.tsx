import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIAP } from 'expo-iap';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useIsPro } from '@/hooks/use-is-pro';
import {
  ANDROID_BASE_PLAN_ANNUAL,
  ANDROID_BASE_PLAN_MONTHLY,
  ANDROID_PRODUCT_ID,
  IOS_ANNUAL_SKU,
  IOS_MONTHLY_SKU,
  PRO_SKUS,
  redeemPromoCode,
  verifyPurchaseWithServer,
} from '@/services/iap';
import { useUserStore } from '@/store/user.store';

type Plan = 'monthly' | 'annual';

const FEATURES = [
  'Full pay & entitlements suite — BAH, BAS, special pays, LES decoder',
  'PCS, DITY, and TLE/TLA calculators',
  'Retirement, TSP, and VA benefit projections',
  'Budget, debt payoff, and net worth tracking',
  'Cloud sync across all your devices',
];

export default function PaywallScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const isPro = useIsPro();
  const proExpiresAt = useUserStore((s) => s.proExpiresAt);
  const setProEntitlement = useUserStore((s) => s.setProEntitlement);

  const [selected, setSelected] = useState<Plan>('annual');
  const [verifying, setVerifying] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
    getActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (!purchase.purchaseToken) {
        Alert.alert('Purchase Error', 'No purchase token was returned. Please contact support.');
        return;
      }
      setVerifying(true);
      try {
        const result = await verifyPurchaseWithServer(purchase.purchaseToken, purchase.productId);
        setProEntitlement(result.proExpiresAt, 'purchase');
        await finishTransaction({ purchase, isConsumable: false });
        Alert.alert('Welcome to Pro', 'Your subscription is active.');
        router.back();
      } catch (e: any) {
        // Do NOT grant access on a verification failure — the purchase stays
        // in the platform queue unfinished so it can be retried (e.g. via
        // Restore Purchases) rather than silently trusting the client.
        Alert.alert('Verification Failed', e?.message ?? 'Could not verify your purchase. Try Restore Purchases, or contact support.');
      } finally {
        setVerifying(false);
      }
    },
    onPurchaseError: (error) => {
      if (error.code !== 'user-cancelled') {
        Alert.alert('Purchase Error', error.message);
      }
    },
  });

  useEffect(() => {
    if (connected) fetchProducts({ skus: PRO_SKUS, type: 'subs' });
  }, [connected]);

  // Android: one product ("mbb_pro_monthly") with two base-plan offers under it.
  const androidProduct = subscriptions.find((s) => s.id === ANDROID_PRODUCT_ID) as
    | (typeof subscriptions[number] & { subscriptionOffers?: { basePlanIdAndroid?: string | null; offerTokenAndroid?: string | null; displayPrice?: string }[] })
    | undefined;
  const androidMonthlyOffer = androidProduct?.subscriptionOffers?.find((o) => o.basePlanIdAndroid === ANDROID_BASE_PLAN_MONTHLY);
  const androidAnnualOffer  = androidProduct?.subscriptionOffers?.find((o) => o.basePlanIdAndroid === ANDROID_BASE_PLAN_ANNUAL);

  // iOS: each billing period is its own product.
  const iosMonthly = subscriptions.find((s) => s.id === IOS_MONTHLY_SKU);
  const iosAnnual  = subscriptions.find((s) => s.id === IOS_ANNUAL_SKU);

  const monthlyDisplayPrice = Platform.OS === 'ios' ? iosMonthly?.displayPrice : androidMonthlyOffer?.displayPrice;
  const annualDisplayPrice  = Platform.OS === 'ios' ? iosAnnual?.displayPrice  : androidAnnualOffer?.displayPrice;

  const purchase = async () => {
    if (Platform.OS === 'ios') {
      const sku = selected === 'monthly' ? IOS_MONTHLY_SKU : IOS_ANNUAL_SKU;
      const sub = subscriptions.find((s) => s.id === sku);
      if (!sub) {
        Alert.alert('Not Available', 'Pricing is still loading — try again in a moment.');
        return;
      }
      await requestPurchase({ type: 'subs', request: { apple: { sku } } });
      return;
    }

    const offer = selected === 'monthly' ? androidMonthlyOffer : androidAnnualOffer;
    if (!offer?.offerTokenAndroid) {
      Alert.alert('Not Available', 'Pricing is still loading — try again in a moment.');
      return;
    }
    await requestPurchase({
      type: 'subs',
      request: {
        google: {
          skus: [ANDROID_PRODUCT_ID],
          subscriptionOffers: [{ sku: ANDROID_PRODUCT_ID, offerToken: offer.offerTokenAndroid }],
        },
      },
    });
  };

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemPromoCode(promoCode);
      setProEntitlement(result.proExpiresAt, 'admin_code');
      setPromoCode('');
      Alert.alert('Code Applied', 'Your Pro access has been activated.');
      router.back();
    } catch (e: any) {
      Alert.alert('Invalid Code', e?.message ?? 'Could not redeem that code.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleRestore = async () => {
    setVerifying(true);
    try {
      await restorePurchases();
      await getActiveSubscriptions(PRO_SKUS);
      Alert.alert('Restore Complete', 'If you had an active subscription, it has been restored.');
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'Could not restore purchases.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: tc.borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[styles.title, { color: tc.textPrimary }]}>MILBUDGETBUDDY PRO</ThemedText>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isPro ? (
            <View style={[styles.activeCard, { backgroundColor: tc.surface, borderColor: Brand.tactical }]}>
              <ThemedText style={[styles.activeTitle, { color: Brand.tactical }]}>✓ PRO ACTIVE</ThemedText>
              <ThemedText style={[styles.activeSub, { color: tc.textSecondary }]}>
                {proExpiresAt ? `Renews or expires ${new Date(proExpiresAt).toLocaleDateString()}` : ''}
              </ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={[styles.eyebrow]}>// UNLOCK EVERYTHING</ThemedText>
              <ThemedText style={[styles.heading, { color: tc.textPrimary }]}>7 days free, then $4.99/mo</ThemedText>

              <View style={styles.featureList}>
                {FEATURES.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <ThemedText style={[styles.featureCheck, { color: Brand.tactical }]}>✓</ThemedText>
                    <ThemedText style={[styles.featureText, { color: tc.textSecondary }]}>{f}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.planRow}>
                <Pressable
                  onPress={() => setSelected('monthly')}
                  style={[styles.planCard, { borderColor: tc.borderColor }, selected === 'monthly' && styles.planCardActive]}>
                  <ThemedText style={[styles.planLabel, { color: tc.textPrimary }]}>Monthly</ThemedText>
                  <ThemedText style={[styles.planPrice, { color: tc.textPrimary }]}>{monthlyDisplayPrice ?? '$4.99'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">per month</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setSelected('annual')}
                  style={[styles.planCard, { borderColor: tc.borderColor }, selected === 'annual' && styles.planCardActive]}>
                  <View style={styles.bestValueBadge}>
                    <ThemedText style={styles.bestValueText}>BEST VALUE</ThemedText>
                  </View>
                  <ThemedText style={[styles.planLabel, { color: tc.textPrimary }]}>Annual</ThemedText>
                  <ThemedText style={[styles.planPrice, { color: tc.textPrimary }]}>{annualDisplayPrice ?? '$49.99'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">per year</ThemedText>
                </Pressable>
              </View>

              <Pressable
                onPress={purchase}
                disabled={verifying}
                style={({ pressed }) => [styles.ctaBtn, (pressed || verifying) && { opacity: 0.7 }]}>
                {verifying ? <ActivityIndicator color="#04080F" /> : (
                  <ThemedText style={styles.ctaBtnText}>START 7-DAY FREE TRIAL</ThemedText>
                )}
              </Pressable>

              <ThemedText type="small" themeColor="textSecondary" style={styles.legalNote}>
                7-day free trial, then billed at the price shown above. Cancel anytime in your
                {' '}{Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account settings —
                you keep access through the end of the period you've already paid for.
              </ThemedText>

              <Pressable onPress={handleRestore} disabled={verifying} style={styles.restoreBtn}>
                <ThemedText style={[styles.restoreText, { color: Brand.tactical }]}>Restore Purchases</ThemedText>
              </Pressable>

              <View style={[styles.promoRow, { borderTopColor: tc.borderColor }]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.promoLabel}>Have a promo code?</ThemedText>
                <View style={styles.promoInputRow}>
                  <TextInput
                    value={promoCode}
                    onChangeText={(t) => setPromoCode(t.toUpperCase())}
                    placeholder="ENTER CODE"
                    placeholderTextColor={tc.textHint}
                    autoCapitalize="characters"
                    style={[styles.promoInput, { color: tc.textPrimary, borderColor: tc.borderColor, backgroundColor: tc.inputBg }]}
                  />
                  <Pressable
                    onPress={handleRedeemCode}
                    disabled={redeeming || !promoCode.trim()}
                    style={({ pressed }) => [styles.promoBtn, (redeeming || !promoCode.trim()) && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}>
                    {redeeming ? <ActivityIndicator color={Brand.tactical} size="small" /> : (
                      <ThemedText style={[styles.promoBtnText, { color: Brand.tactical }]}>APPLY</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  eyebrow: { color: Brand.tactical, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  heading: { fontSize: 26, fontWeight: '900', letterSpacing: 0.3, lineHeight: 32 },

  featureList: { gap: Spacing.two, marginTop: Spacing.two },
  featureRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  featureCheck: { fontSize: 15, fontWeight: '900' },
  featureText: { flex: 1, fontSize: 14, lineHeight: 20 },

  planRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  planCard: {
    flex: 1, borderWidth: 1.5, borderRadius: Spacing.two, padding: Spacing.three,
    alignItems: 'center', gap: 2,
  },
  planCardActive: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '10' },
  bestValueBadge: {
    position: 'absolute', top: -10, backgroundColor: Brand.accent,
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2,
  },
  bestValueText: { fontSize: 8, fontWeight: '900', color: '#04080F', letterSpacing: 0.5 },
  planLabel: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  planPrice: { fontSize: 20, fontWeight: '900' },

  ctaBtn: {
    backgroundColor: Brand.tactical, borderRadius: Spacing.two,
    paddingVertical: Spacing.three, alignItems: 'center', marginTop: Spacing.two,
  },
  ctaBtnText: { color: '#04080F', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  legalNote: { textAlign: 'center', lineHeight: 17, marginTop: Spacing.one },
  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  restoreText: { fontSize: 13, fontWeight: '700' },

  promoRow: { marginTop: Spacing.two, paddingTop: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.one + 2 },
  promoLabel: { textAlign: 'center' },
  promoInputRow: { flexDirection: 'row', gap: Spacing.two },
  promoInput: {
    flex: 1, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two, fontSize: 14, fontWeight: '700', letterSpacing: 1,
  },
  promoBtn: { borderRadius: Spacing.two, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  promoBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  activeCard: { borderWidth: 1.5, borderRadius: Spacing.two, padding: Spacing.four, alignItems: 'center', gap: 4 },
  activeTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  activeSub: { fontSize: 13 },
});
