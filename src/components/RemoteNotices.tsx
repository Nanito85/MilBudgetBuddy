import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { compareVersions, useRemoteConfig } from '@/services/remote-config';

const STORE_URL = Platform.OS === 'ios'
  ? 'https://apps.apple.com/app/id6773172742'
  : 'https://play.google.com/store/apps/details?id=com.nanito85.MilBudgetBuddy';
const DISMISSED_KEY = 'mbb_dismissed_announcements';
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/**
 * Server-driven notices from /api/config, the fallback for problems an OTA
 * update can't fix fast enough:
 * - minAppVersion above this build → blocking "update required" screen;
 * - a route listed in disabledRoutes → that tool is covered with a
 *   "temporarily unavailable" card (e.g. while it's showing wrong numbers);
 * - announcements → one dismissible banner at a time.
 * With no server overrides (the default) this renders nothing.
 */
export function RemoteNotices() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const config = useRemoteConfig((s) => s.config);
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((raw) => setDismissed(raw ? JSON.parse(raw) : []))
      .catch(() => setDismissed([]));
  }, []);

  if (compareVersions(APP_VERSION, config.minAppVersion) < 0) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: tc.background }]}>
        <ThemedText style={[styles.title, { color: tc.textPrimary }]}>UPDATE REQUIRED</ThemedText>
        <ThemedText style={[styles.body, { color: tc.textSecondary }]}>
          This version of MilBudgetBuddy is no longer supported. Please update to keep your pay estimates accurate.
        </ThemedText>
        <Pressable onPress={() => Linking.openURL(STORE_URL)} style={styles.primaryBtn} accessibilityRole="button">
          <ThemedText style={styles.primaryBtnText}>UPDATE NOW</ThemedText>
        </Pressable>
      </View>
    );
  }

  const disabled = config.disabledRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const now = new Date().toISOString();
  const announcement = dismissed
    ? config.announcements.find((a) => !dismissed.includes(a.id) && (!a.expiresAt || a.expiresAt > now))
    : undefined;

  const dismiss = (id: string) => {
    const next = [...(dismissed ?? []), id].slice(-50);
    setDismissed(next);
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
  };

  return (
    <>
      {disabled && (
        <View style={[styles.fullscreen, { backgroundColor: tc.background }]}>
          <ThemedText style={[styles.title, { color: tc.textPrimary }]}>TEMPORARILY UNAVAILABLE</ThemedText>
          <ThemedText style={[styles.body, { color: tc.textSecondary }]}>
            We&apos;ve switched this tool off while we fix an issue with it. It&apos;ll be back shortly — the rest of the app works normally.
          </ThemedText>
          <Pressable onPress={() => router.back()} style={styles.primaryBtn} accessibilityRole="button">
            <ThemedText style={styles.primaryBtnText}>GO BACK</ThemedText>
          </Pressable>
        </View>
      )}
      {announcement && !disabled && (
        <View style={[styles.banner, { top: insets.top + Spacing.one, backgroundColor: tc.surface, borderColor: Brand.accent }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.bannerTitle, { color: tc.textPrimary }]}>{announcement.title}</ThemedText>
            <ThemedText style={[styles.bannerBody, { color: tc.textSecondary }]}>{announcement.body}</ThemedText>
          </View>
          <Pressable onPress={() => dismiss(announcement.id)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss announcement">
            <ThemedText style={[styles.bannerClose, { color: tc.textMuted }]}>✕</ThemedText>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.four, gap: Spacing.three,
  },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryBtn: { backgroundColor: Brand.tactical, borderRadius: 6, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two + 4 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: 0.5 },
  banner: {
    position: 'absolute', left: Spacing.three, right: Spacing.three,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    borderWidth: 1, borderRadius: 6, padding: Spacing.three,
  },
  bannerTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  bannerBody: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  bannerClose: { fontSize: 16, lineHeight: 20 },
});
