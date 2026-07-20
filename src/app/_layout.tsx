import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { KidModeScreen } from '@/components/KidModeScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OnboardingFlow } from '@/features/profile/components/OnboardingFlow';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth.store';
import { useKidModeStore } from '@/store/kid-mode.store';
import { useLifeEventsStore } from '@/store/life-events.store';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';
import { pullFromCloud, pushToCloud, startSync, stopSync } from '@/services/firestore-sync';
import { useKidsStore } from '@/store/kids.store';
import { initRemoteConfig } from '@/services/remote-config';
import { initSentry, setUserContext } from '@/services/sentry';
import { startAnalytics, stopAnalytics, trackEvent } from '@/services/analytics';

// Init Sentry at module load time — before any component renders
initSentry();

export default function RootLayout() {
  const appTheme = useAppTheme();
  const hydrated = useUserStore((s) => s.hydrated);
  const onboarded = useUserStore((s) => s.onboarded);
  const kidModeActive = useKidModeStore((s) => s.active);
  const { user, initialized, init: initAuth } = useAuthStore();

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
    const unsubAuth = initAuth();
    return () => {
      unsubAuth();
      stopSync();
      stopAnalytics();
    };
  }, []);

  // When a user signs in/out, sync data
  useEffect(() => {
    if (!initialized) return;
    if (user) {
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
  if (!onboarded && !user) {
    // Let onboarding handle it — OnboardingFlow will offer sign-up at the end
    return <OnboardingFlow />;
  }

  if (!onboarded) return <OnboardingFlow />;

  return (
    <ErrorBoundary>
    <ThemeProvider value={appTheme === 'light' ? DefaultTheme : DarkTheme}>
      <AnimatedSplashOverlay />
      <DisclaimerModal />
      <Stack screenOptions={{ headerShown: false }}>
        {/* ── Tab group (Home/Budget/Kids/Tools/Settings) — the only screen
            with a bottom tab bar. Everything below is pushed on top of it,
            so router.back() returns to whatever screen actually launched it
            (e.g. Tools), not always Home. ── */}
        <Stack.Screen name="(tabs)" />

        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="category/[slug]" />
        <Stack.Screen name="kids/[id]" />
        <Stack.Screen name="tip/[id]" />
        <Stack.Screen name="credit-score" />
        <Stack.Screen name="dity-calculator" />
        <Stack.Screen name="explore" />
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
        <Stack.Screen name="command-mode" />
        <Stack.Screen name="gs-pay-calculator" />
        <Stack.Screen name="promotion-calculator" />
        <Stack.Screen name="privacy-center" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="admin" />
      </Stack>
      <OfflineBanner />
      {kidModeActive && <KidModeScreen />}
    </ThemeProvider>
    </ErrorBoundary>
  );
}
