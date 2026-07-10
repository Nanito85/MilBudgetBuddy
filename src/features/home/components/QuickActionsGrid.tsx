import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ALL_QUICK_ACTIONS } from '@/data/quick-actions';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

export function QuickActionsGrid() {
  const router = useRouter();
  const tc = useThemeColors();
  const quickAccessIds = useUserStore((s) => s.quickAccessIds);

  const actions = quickAccessIds
    .map((id) => ALL_QUICK_ACTIONS.find((a) => a.id === id))
    .filter(Boolean) as typeof ALL_QUICK_ACTIONS;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={[styles.labelLine, { backgroundColor: tc.borderColor }]} />
        <ThemedText type="label" style={[styles.sectionLabel, { color: tc.textMuted }]}>// QUICK ACCESS</ThemedText>
        <View style={[styles.labelLine, { backgroundColor: tc.borderColor }]} />
      </View>
      <View style={styles.grid}>
        {actions.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(a.route as any)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={[styles.tileInner, { backgroundColor: tc.surface, borderColor: a.color + '40' }]}>
              <View style={[styles.iconBg, { backgroundColor: a.color + '20' }]}>
                <ThemedText style={styles.icon}>{a.icon}</ThemedText>
              </View>
              <ThemedText type="label" style={[styles.label, { color: tc.textPrimary }]}>{a.label}</ThemedText>
              <ThemedText type="label" style={[styles.sublabel, { color: tc.textMuted }]}>{a.sublabel}</ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  labelLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 9 },
  grid: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1 },
  pressed: { opacity: 0.6 },
  tileInner: {
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    gap: 3,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: { fontSize: 20, lineHeight: 28 },
  label: { fontSize: 11, letterSpacing: 0.5 },
  sublabel: { fontSize: 8 },
});
