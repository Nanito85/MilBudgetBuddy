import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { OnboardingFlow } from '@/features/profile/components/OnboardingFlow';
import { Brand } from '@/constants/theme';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';

export default function TabLayout() {
  const hydrated = useUserStore((s) => s.hydrated);
  const onboarded = useUserStore((s) => s.onboarded);
  const appTheme = useUserStore((s) => s.appTheme ?? 'dark');

  useEffect(() => {
    useTipsStore.getState().hydrate();
    useUserStore.getState().hydrate();
  }, []);

  if (!hydrated) return null;

  if (!onboarded) return <OnboardingFlow />;

  return (
    <ThemeProvider value={appTheme === 'light' ? DefaultTheme : DarkTheme}>
      <AnimatedSplashOverlay />
      <DisclaimerModal />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Brand.accent,
          tabBarInactiveTintColor: '#3D6080',
          tabBarStyle: {
            backgroundColor: '#04080F',
            borderTopColor: '#0D1E2E',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1,
          },
          headerShown: false,
        }}>
        {/* ── Tab screens ───────────────────────────── */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'BUDGET',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: 'KIDS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'TOOLS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="apps-outline" size={size} color={color} />
            ),
          }}
        />
        {/* ── Non-tab screens (hidden from tab bar) ──── */}
        <Tabs.Screen name="chat"                  options={{ href: null }} />
        <Tabs.Screen name="category/[slug]"       options={{ href: null }} />
        <Tabs.Screen name="kids/[id]"             options={{ href: null }} />
        <Tabs.Screen name="tip/[id]"              options={{ href: null }} />
        <Tabs.Screen name="credit-score"          options={{ href: null }} />
        <Tabs.Screen name="dity-calculator"       options={{ href: null }} />
        <Tabs.Screen name="explore"               options={{ href: null }} />
        <Tabs.Screen name="invest-101"            options={{ href: null }} />
        <Tabs.Screen name="pcs-calculator"        options={{ href: null }} />
        <Tabs.Screen name="profile"               options={{ href: null }} />
        <Tabs.Screen name="retirement-calculator" options={{ href: null }} />
        <Tabs.Screen name="tle-calculator"        options={{ href: null }} />
        <Tabs.Screen name="va-loan-calculator"      options={{ href: null }} />
        <Tabs.Screen name="deployment-calculator"  options={{ href: null }} />
        <Tabs.Screen name="leave-calculator"       options={{ href: null }} />
        <Tabs.Screen name="schools-finder"         options={{ href: null }} />
        <Tabs.Screen name="les-decoder"            options={{ href: null }} />
        <Tabs.Screen name="tricare-estimator"     options={{ href: null }} />
        <Tabs.Screen name="settings"               options={{ href: null }} />
        <Tabs.Screen name="scra-guide"             options={{ href: null }} />
        <Tabs.Screen name="net-worth"              options={{ href: null }} />
        <Tabs.Screen name="ets-checklist"          options={{ href: null }} />
        <Tabs.Screen name="tsp-calculator"         options={{ href: null }} />
        <Tabs.Screen name="va-disability"          options={{ href: null }} />
        <Tabs.Screen name="gi-bill-calculator"     options={{ href: null }} />
        <Tabs.Screen name="debt-payoff"            options={{ href: null }} />
        <Tabs.Screen name="pay-chart"              options={{ href: null }} />
        <Tabs.Screen name="tax-guide"              options={{ href: null }} />
        <Tabs.Screen name="sbp-calculator"         options={{ href: null }} />
        <Tabs.Screen name="car-loan"               options={{ href: null }} />
        <Tabs.Screen name="offbase-calculator"     options={{ href: null }} />
        <Tabs.Screen name="money-flowchart"        options={{ href: null }} />
        <Tabs.Screen name="roth-ira"               options={{ href: null }} />
        <Tabs.Screen name="deployment-savings"     options={{ href: null }} />
        <Tabs.Screen name="tdy-optimizer"          options={{ href: null }} />
        <Tabs.Screen name="savings-rate"           options={{ href: null }} />
        <Tabs.Screen name="bah-guide"              options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}
