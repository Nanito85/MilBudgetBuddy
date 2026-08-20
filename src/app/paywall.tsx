import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActiveSubscriptions, getAvailablePurchases, useIAP } from 'expo-iap';
import type { Purchase } from 'expo-iap';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useIsPro } from '@/hooks/use-is-pro';
import { captureError } from '@/services/sentry';
import {
  ANDROID_BASE_PLAN_ANNUAL,
  ANDROID_BASE_PLAN_MONTHLY,
  ANDROID_PRODUCT_ID,
  IOS_ANNUAL_SKU,
  IOS_MONTHLY_SKU,
  PRO_SKUS,
  verifyPurchaseWithServer,
} from '@/services/iap';
import { useAuthStore } from '@/store/auth.store';
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
  const authUser = useAuthStore((s) => s.user);
  const proExpiresAt = useUserStore((s) => s.proExpiresAt);
  const setProEntitlement = useUserStore((s) => s.setProEntitlement);

  const [selected, setSelected] = useState<Plan>('annual');
  const [verifying, setVerifying] = useState(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (!purchase.purchaseToken) {
        captureError(new Error('Purchase succeeded but no purchaseToken was returned'), {
          stage: 'purchase-success-no-token',
          platform: Platform.OS,
          productId: purchase.productId,
        });
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
        captureError(e, { stage: 'verify-purchase', platform: Platform.OS, productId: purchase.productId });
        Alert.alert('Verification Failed', e?.message ?? 'Could not verify your purchase. Try Restore Purchases, or contact support.');
      } finally {
        setVerifying(false);
      }
    },
    onPurchaseError: (error) => {
      if (error.code !== 'user-cancelled') {
        captureError(error, { stage: 'purchase-error', platform: Platform.OS, code: error.code ?? 'unknown' });
        Alert.alert('Purchase Error', error.message);
      }
    },
    // Fires for failures inside fetchProducts/restorePurchases/etc. — without
    // this, a silent product-load failure (e.g. Paid Apps Agreement not active,
    // product not cleared for the reviewed build) left no trace anywhere; the
    // UI just fell back to hardcoded placeholder prices and the purchase button
    // dead-ended on the generic "Not Available" alert below with no diagnostics.
    onError: (error) => {
      captureError(error, { stage: 'iap-hook-error', platform: Platform.OS });
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

  // Appends a truncated stack trace to an error message so a failure is
  // diagnosable directly from the on-screen Alert — Sentry is currently a
  // no-op in this build (EXPO_PUBLIC_SENTRY_DSN unset in EAS env), so a bare
  // "undefined is not a function" with no file/line info has proven
  // impossible to actually pin down across several rounds of otherwise-solid
  // fixes. Grab this text and share it verbatim; it names the real culprit.
  const withDebugInfo = (e: any, fallback: string): string => {
    const base = e?.message || fallback;
    const stack = typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 4).join('\n') : null;
    return stack ? `${base}\n\n[debug]\n${stack}` : base;
  };

  // If the product genuinely never loaded (not just "still loading" — connected
  // is true and fetchProducts already resolved, one way or another), tapping
  // Purchase would otherwise silently no-op against a stale/missing product.
  // Log it so this is diagnosable from Sentry instead of just an App Store
  // Connect config guess next time a review (or a real user) hits it.
  const notAvailable = (sku: string) => {
    captureError(new Error('IAP product not loaded at purchase time'), {
      stage: 'purchase-not-available',
      platform: Platform.OS,
      sku,
      connected: String(connected),
      subscriptionsLoaded: String(subscriptions.length),
    });
    Alert.alert(
      'Not Available',
      connected
        ? "This subscription isn't available right now. Please try again later or contact support."
        : 'Still connecting to the store — try again in a moment.',
    );
  };

  // Purchase verification always requires an auth token (see
  // verifyPurchaseWithServer) — a signed-out member could still open the
  // store's buy sheet and pay, but the app could never verify or acknowledge
  // it afterward, landing them in exactly the "paid but not unlocked, and
  // Google now blocks retrying" state this was built to prevent. Send them
  // to sign in first instead of letting that happen.
  const requireSignIn = (): boolean => {
    if (authUser) return false;
    router.push('/auth/sign-in' as any);
    return true;
  };

  // getAvailablePurchases() and getActiveSubscriptions() call two genuinely
  // different native bridge methods (ExpoIapModule.getAvailableItems vs.
  // ExpoIapModule.getActiveSubscriptions — confirmed from expo-iap's own
  // source, not a guess). If one is missing from whatever native binary is
  // actually installed (a real possibility: OTA ships JS only, so a JS-side
  // library update can reference a native method that predates the last
  // actual app-store build), the other may still work. Try the richer one
  // first, fall back to the other, and only give up if BOTH fail — and even
  // then, surface real diagnostics instead of the raw, undiagnosable error,
  // since Sentry (captureError) is currently a no-op in this build
  // (EXPO_PUBLIC_SENTRY_DSN isn't set in EAS env).
  //
  // finishTransaction() on Android only actually reads purchase.purchaseToken
  // (confirmed from source) — the minimal shape below is genuinely enough
  // for verify + acknowledge to work even via the getActiveSubscriptions
  // fallback, which doesn't return a full Purchase object.
  const fetchOwnedProPurchases = async (): Promise<Pick<Purchase, 'purchaseToken' | 'productId'>[]> => {
    const errors: string[] = [];

    try {
      const purchases = await getAvailablePurchases();
      return purchases.filter((p) => PRO_SKUS.includes(p.productId) && p.purchaseToken);
    } catch (e: any) {
      errors.push(`getAvailablePurchases: ${e?.name ?? 'Error'}: ${e?.message ?? String(e)}`);
      captureError(e, { stage: 'get-available-purchases', platform: Platform.OS });
    }

    try {
      const subs = await getActiveSubscriptions(PRO_SKUS);
      const owned = subs.filter((s) => s.purchaseToken).map((s) => ({ purchaseToken: s.purchaseToken!, productId: s.productId }));
      if (owned.length > 0) return owned;
    } catch (e: any) {
      errors.push(`getActiveSubscriptions: ${e?.name ?? 'Error'}: ${e?.message ?? String(e)}`);
      captureError(e, { stage: 'get-active-subscriptions', platform: Platform.OS });
    }

    if (errors.length > 0) {
      throw new Error(`Could not query purchases — ${errors.join(' | ')}`);
    }
    return [];
  };

  // Shared by purchase()'s already-owned guard below and handleRestore().
  // Verifies + acknowledges every available purchase matching this app's
  // SKUs. Returns how many were successfully restored so callers can tailor
  // their own messaging (a plain "restore" vs. an "you already own this,
  // restoring instead of re-buying" redirect read very differently).
  const verifyAndAcknowledgeAvailable = async (): Promise<{ restoredCount: number; lastError: any }> => {
    const proPurchases = await fetchOwnedProPurchases();

    let restoredCount = 0;
    let lastError: any = null;
    for (const p of proPurchases) {
      try {
        const result = await verifyPurchaseWithServer(p.purchaseToken!, p.productId);
        // verifyPurchaseWithServer succeeding means our backend independently
        // confirmed this purchase with Google's own server API AND already
        // acknowledged it server-side via the Play Developer API (see
        // milbudgetbuddy-api's /api/iap/verify) — that's what actually
        // clears Google's "unacknowledged purchase" block. The entitlement
        // is real and granted at this point, full stop.
        setProEntitlement(result.proExpiresAt, 'purchase');
        restoredCount++;

        // finishTransaction() here is now just a best-effort client-side
        // cleanup (clears Play Billing's on-device transaction queue) — NOT
        // what fixes the Google block anymore, since the server already
        // handled that above. So a failure here must not undo the restore
        // that already genuinely succeeded, or show "Restore Failed" for
        // something that didn't actually fail. p may only carry
        // { purchaseToken, productId } when it came from the
        // getActiveSubscriptions() fallback rather than a full Purchase —
        // finishTransaction on Android only reads those two fields anyway
        // (confirmed from source), so the cast is safe.
        try {
          await finishTransaction({ purchase: p as unknown as Purchase, isConsumable: false });
        } catch (ackErr: any) {
          captureError(ackErr, { stage: 'restore-finish-transaction', platform: Platform.OS, productId: p.productId });
        }
      } catch (e: any) {
        lastError = e;
        captureError(e, { stage: 'restore-verify-one', platform: Platform.OS, productId: p.productId });
      }
    }
    return { restoredCount, lastError };
  };

  // Google (and Apple) reject launching a brand-new purchase flow for a
  // subscription the store already thinks you own — including one that's
  // just stuck unacknowledged from an earlier attempt — with a flat
  // DEVELOPER_ERROR ("Invalid arguments provided to the API"). That error
  // gives the member zero indication of what actually went wrong or what to
  // do about it. Check for an existing owned purchase first and restore
  // (verify + acknowledge) it instead of ever launching a doomed new
  // purchase — this is exactly the state a purchase that failed to
  // acknowledge the first time leaves someone in.
  const restoreIfAlreadyOwned = async (): Promise<boolean> => {
    const owned = await fetchOwnedProPurchases();
    if (owned.length === 0) return false;

    Alert.alert(
      'Already Purchased',
      "You already have a MilBudgetBuddy Pro purchase on this account — restoring it now instead of starting a new one.",
    );
    const { restoredCount, lastError } = await verifyAndAcknowledgeAvailable();
    if (restoredCount === 0 && lastError) {
      captureError(lastError, { stage: 'purchase-already-owned-restore', platform: Platform.OS });
      Alert.alert('Restore Failed', withDebugInfo(lastError, 'Could not verify your existing purchase. Try Restore Purchases, or contact support.'));
    }
    return true;
  };

  const purchase = async () => {
    if (requireSignIn()) return;
    setVerifying(true);
    try {
      if (await restoreIfAlreadyOwned()) return;
    } catch (e: any) {
      // Couldn't determine ownership at all (both native queries failed) —
      // stop here rather than attempt a new purchase blind. If they really
      // do already own this and we just couldn't see it, launching a new
      // purchase now would hit Google's DEVELOPER_ERROR again anyway.
      captureError(e, { stage: 'purchase-ownership-check', platform: Platform.OS });
      Alert.alert('Could Not Continue', withDebugInfo(e, 'Could not check your purchase history. Try again, or contact support.'));
      return;
    } finally {
      setVerifying(false);
    }
    if (Platform.OS === 'ios') {
      const sku = selected === 'monthly' ? IOS_MONTHLY_SKU : IOS_ANNUAL_SKU;
      const sub = subscriptions.find((s) => s.id === sku);
      if (!sub) {
        notAvailable(sku);
        return;
      }
      await requestPurchase({ type: 'subs', request: { apple: { sku } } });
      return;
    }

    const offer = selected === 'monthly' ? androidMonthlyOffer : androidAnnualOffer;
    if (!offer?.offerTokenAndroid) {
      notAvailable(ANDROID_PRODUCT_ID);
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

  const handleRestore = async () => {
    if (requireSignIn()) return;
    setVerifying(true);
    try {
      // restorePurchases() only triggers the native refresh (iOS sync /
      // Android re-query) — it does NOT return the purchases and does NOT
      // verify or acknowledge anything itself. The old version of this
      // function stopped right there and always claimed success, which was
      // a no-op: it never called verifyPurchaseWithServer (so proExpiresAt
      // never got set) and never called finishTransaction (so a purchase
      // that failed to acknowledge the first time — e.g. a transient
      // network drop right after buying — stayed unacknowledged forever,
      // which is exactly what produces Google's "Developer hasn't
      // acknowledged your purchase" error on any future purchase attempt).
      //
      // On Android this call is a pure passthrough to getAvailablePurchases()
      // internally (confirmed from expo-iap's own source) — i.e. it does
      // nothing that verifyAndAcknowledgeAvailable() below doesn't already
      // do via fetchOwnedProPurchases(), except throw the SAME native
      // failure with a generic, undiagnosable message and no fallback to
      // getActiveSubscriptions(). Skip it on Android so any failure surfaces
      // through the wrapped call instead. Kept on iOS since it also runs
      // syncIOS() first.
      if (Platform.OS === 'ios') {
        await restorePurchases();
      }
      const { restoredCount, lastError } = await verifyAndAcknowledgeAvailable();

      if (restoredCount > 0) {
        Alert.alert('Restore Complete', 'Your subscription has been restored and acknowledged.');
      } else if (lastError) {
        throw lastError;
      } else {
        Alert.alert('Nothing to Restore', 'No active MilBudgetBuddy Pro purchase was found for this account.');
      }
    } catch (e: any) {
      captureError(e, { stage: 'restore-purchases', platform: Platform.OS });
      Alert.alert('Restore Failed', withDebugInfo(e, 'Could not restore purchases.'));
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
          {/* The Pro gate dims and disables the ENTIRE app below it while
              gated — including the bottom tab bar, since that renders inside
              the same gated region. Paywall is one of the few always-allowed
              screens, but "back" from here just returns to the dimmed tab
              content, not to Settings specifically — so without this link, a
              signed-in non-Pro member had literally no way to reach Settings
              (sign out, account, etc.) at all once gated. */}
          <Pressable onPress={() => router.push('/settings' as any)} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { textAlign: 'right' }]}>Settings</ThemedText>
          </Pressable>
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

              {!authUser && (
                <ThemedText type="small" style={[styles.signInNotice, { color: Brand.tactical }]}>
                  You'll need to sign in first — purchases are tied to your account so they sync
                  across devices and can be verified.
                </ThemedText>
              )}

              <Pressable
                onPress={purchase}
                disabled={verifying}
                style={({ pressed }) => [styles.ctaBtn, (pressed || verifying) && { opacity: 0.7 }]}>
                {verifying ? <ActivityIndicator color="#04080F" /> : (
                  <ThemedText style={styles.ctaBtnText}>
                    {authUser ? 'START 7-DAY FREE TRIAL' : 'SIGN IN TO CONTINUE'}
                  </ThemedText>
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
  signInNotice: { textAlign: 'center', lineHeight: 17, fontWeight: '600' },
  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  restoreText: { fontSize: 13, fontWeight: '700' },

  activeCard: { borderWidth: 1.5, borderRadius: Spacing.two, padding: Spacing.four, alignItems: 'center', gap: 4 },
  activeTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  activeSub: { fontSize: 13 },
});
