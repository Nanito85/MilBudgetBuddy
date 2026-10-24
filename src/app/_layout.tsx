import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import React, { useEffect } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { KidModeScreen } from '@/components/KidModeScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ProGateOverlay } from '@/components/ProGateOverlay';
import { OnboardingFlow } from '@/features/profile/components/OnboardingFlow';
import { useAppTheme } from '@/hooks/use-theme';
import { useEntitlementRefresh } from '@/hooks/use-entitlement-refresh';
import { useAuthStore } from '@/store/auth.store';
import { useKidModeStore } from '@/store/kid-mode.store';
import { useLifeEventsStore } from '@/store/life-events.store';
import { useTipsStore } from '@/store/tips.store';
import { useVaClaimsStore } from '@/store/va-claims.store';
import { useUserStore } from '@/store/user.store';
import { pullFromCloud, pushToCloud, startSync, stopSync } from '@/services/firestore-sync';
import { useKidsStore } from '@/store/kids.store';
import { useBudgetStore } from '@/store/budget.store';
import { useDebtStore } from '@/store/debt.store';
import { useExpensesStore } from '@/store/expenses.store';
import { useNetWorthStore } from '@/store/networth.store';
import { useNwSnapshotsStore } from '@/store/networth-snapshots.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { initRemoteConfig } from '@/services/remote-config';
import { schedulePayDayReminders } from '@/services/notifications';
import { initSentry, setUserContext } from '@/services/sentry';
import { startAnalytics, stopAnalytics, trackEvent, trackScreen } from '@/services/analytics';

// Init Sentry at module load time — before any component renders
initSentry();

// Track every screen/tool navigation — powers the admin "Tool Usage" chart.
// Fires on the actual route (e.g. "/bah-guide", "/(tabs)/budget"), not the
// label shown in the UI, so it stays accurate as screens are added/renamed.
// Its own component so the pathname subscription only re-renders this,
// not RootLayout: reading usePathname() in RootLayout itself re-rendered the
// whole app shell (Stack, overlays, banners) on every single navigation.
function ScreenTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) trackScreen(pathname);
  }, [pathname]);
  return null;
}

export default function RootLayout() {
  const appTheme = useAppTheme();
  const hydrated = useUserStore((s) => s.hydrated);
  const onboarded = useUserStore((s) => s.onboarded);
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const serviceStatus = useUserStore((s) => s.serviceStatus);
  const kidModeActive = useKidModeStore((s) => s.active);
  // Individual selectors, not a bare useAuthStore() — that subscribed to the
  // whole store, so every loading/error toggle during sign-in/sign-up also
  // re-rendered the entire app shell.
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const initAuth = useAuthStore((s) => s.init);

  useEntitlementRefresh();

  // Hydrate local stores on mount + initialize Firebase auth listener
  useEffect(() => {
    initRemoteConfig().catch(() => {}); // non-blocking; falls back to cached/default
    startAnalytics();
    trackEvent('app_launch');
    useTipsStore.getState().hydrate();
    useUserStore.getState().hydrate();
    useKidModeStore.getState().hydrate();
    useKidsStore.getState().hydrate();
    useLifeEventsStore.getState().hydrate();
    useVaClaimsStore.getState().hydrate();
    // Every synced store loads from disk once, here, before cloud sync starts.
    // These used to hydrate only when their screens opened, which re-read the
    // older on-device copy after a newer cloud snapshot had already arrived.
    useBudgetStore.getState().hydrate();
    useDebtStore.getState().hydrate();
    useExpensesStore.getState().hydrate();
    useSavingsGoalsStore.getState().hydrate();
    useNetWorthStore.getState().hydrate();
    useNwSnapshotsStore.getState().hydrate();
    const unsubAuth = initAuth();
    return () => {
      unsubAuth();
      stopSync();
      stopAnalytics();
    };
  }, []);

  // schedulePayDayReminders() only ever schedules the NEXT 6 months of
  // one-shot date-based notifications (unlike scheduleWeeklyTip's native
  // WEEKLY-repeating trigger, which never needs refreshing) — and it used to
  // only be called once, from Profile's notification toggle or onboarding.
  // A member who enabled it and then just kept using the app normally would
  // silently stop getting pay day reminders once that 6-month window ran
  // out, with the Settings toggle still showing "on" the whole time and no
  // indication anything had lapsed. Re-running it here on every app launch
  // (once hydration confirms the setting is actually on) keeps the rolling
  // window fresh — it's idempotent (cancels + replaces the same identifiers
  // each time), so this is safe to call on every launch, not just the first.
  useEffect(() => {
    if (hydrated && notificationsEnabled) {
      schedulePayDayReminders(undefined, serviceStatus === 'retired');
    }
  }, [hydrated, notificationsEnabled, serviceStatus]);

  // When a user signs in/out, sync data. Anonymous sessions (created
  // silently by the paywall so a purchase never has to force a real
  // sign-up screen first — see auth.store.ts's ensureSignedIn) are
  // deliberately treated the same as signed-out here: they exist purely so
  // IAP verification has a uid/ID token to call the backend with, and must
  // NOT silently turn on full cloud sync for someone who never asked for an
  // account. Only a real (non-anonymous) sign-in starts sync.
  useEffect(() => {
    if (!initialized) return;
    if (user && !user.isAnonymous) {
      setUserContext(user.uid);
      trackEvent('user_signed_in');
      // Signed in — pull cloud data (if exists) then start real-time sync
      pullFromCloud(user.uid).then((hadData) => {
        if (!hadData) {
          // First time on cloud — push local data up
          pushToCloud(user.uid).catch(() => {});
        }
        startSync(user.uid);
      }).catch(() => {
        startSync(user.uid);
      });
    } else {
      setUserContext(null);
      stopSync();
    }
  }, [user, initialized]);

  // Not yet resolved — show nothing while Firebase checks session
  if (!initialized || !hydrated) return null;

  // Not signed in — show sign-in screen (optional; user can skip and use locally)
  // We route to sign-in but the sign-in screen itself has a "Use without account" skip option
  // So we only gate if they haven't onboarded yet AND aren't signed in
  // Onboarding gets the same crash-recovery screen as the rest of the app —
  // it used to render outside the ErrorBoundary, so a throw there (where
  // earlier data-loss bugs lived) left a blank screen with no way out.
  // OnboardingFlow offers sign-up at the end for anyone not signed in.
  if (!onboarded) {
    return (
      <ErrorBoundary>
        <OnboardingFlow />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <ThemeProvider value={appTheme === 'light' ? DefaultTheme : DarkTheme}>
      <AnimatedSplashOverlay />
      <DisclaimerModal />
      <ScreenTracker />
      {/* freezeOnBlur: a screen covered by another one (e.g. the whole tab
          group while a calculator is open) stops re-rendering until it's
          visible again, instead of recomputing on every store change —
          cloud sync, profile edits, etc. — while nobody can see it. */}
      <ProGateOverlay>
      <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
        {/* ── Tab group (Home/Budget/Kids/Tools/Settings) — the only screen
            with a bottom tab bar. Everything below is pushed on top of it,
            so router.back() returns to whatever screen actually launched it
            (e.g. Tools), not always Home. ── */}
        <Stack.Screen name="(tabs)" />

        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="category/[slug]" />
        <Stack.Screen name="kids/[id]" />
        <Stack.Screen name="tip/[id]" />
        <Stack.Screen name="tip-library" />
        <Stack.Screen name="credit-score" />
        <Stack.Screen name="dity-calculator" />
        <Stack.Screen name="invest-101" />
        <Stack.Screen name="pcs-calculator" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="retirement-calculator" />
        <Stack.Screen name="tle-calculator" />
        <Stack.Screen name="va-loan-calculator" />
        <Stack.Screen name="deployment-calculator" />
        <Stack.Screen name="leave-calculator" />
        <Stack.Screen name="schools-finder" />
        <Stack.Screen name="les-decoder" />
        <Stack.Screen name="tricare-estimator" />
        <Stack.Screen name="scra-guide" />
        <Stack.Screen name="net-worth" />
        <Stack.Screen name="ets-checklist" />
        <Stack.Screen name="tsp-calculator" />
        <Stack.Screen name="va-disability" />
        <Stack.Screen name="gi-bill-calculator" />
        <Stack.Screen name="debt-payoff" />
        <Stack.Screen name="pay-chart" />
        <Stack.Screen name="tax-guide" />
        <Stack.Screen name="sbp-calculator" />
        <Stack.Screen name="car-loan" />
        <Stack.Screen name="offbase-calculator" />
        <Stack.Screen name="money-flowchart" />
        <Stack.Screen name="roth-ira" />
        <Stack.Screen name="deployment-savings" />
        <Stack.Screen name="tdy-optimizer" />
        <Stack.Screen name="savings-rate" />
        <Stack.Screen name="bah-guide" />
        <Stack.Screen name="reserves" />
        <Stack.Screen name="life-events" />
        <Stack.Screen name="va-claims-tracker" />
        <Stack.Screen name="command-mode" />
        <Stack.Screen name="gs-pay-calculator" />
        <Stack.Screen name="promotion-calculator" />
        <Stack.Screen name="privacy-center" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="admin" />
      </Stack>
      </ProGateOverlay>
      <OfflineBanner />
      {kidModeActive && <KidModeScreen />}
    </ThemeProvider>
    </ErrorBoundary>
  );
}
