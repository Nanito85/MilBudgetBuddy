import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

// Only the 5 primary tab screens live here. Every other screen (calculators,
// guides, settings sub-pages, auth, etc.) is registered as a Stack.Screen one
// level up in the root layout, so pushing into them creates a real navigation
// history entry — router.back() returns to whichever tab screen launched it,
// not always Home. See src/app/_layout.tsx.
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.accent,
        tabBarInactiveTintColor: tc.textMuted,
        tabBarStyle: {
          backgroundColor: tc.surface,
          borderTopColor: tc.borderColor,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: 8 + insets.bottom,
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
