import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

const ACTIONS = [
  { icon: '💰', label: 'BUDGET',    sublabel: 'MANAGE',    route: '/budget',              color: '#00C8A8' },
  { icon: '📊', label: 'CREDIT',    sublabel: 'SCORE',     route: '/credit-score',        color: '#C8A800' },
  { icon: '🚚', label: 'PCS',       sublabel: 'TRANSFER',  route: '/pcs-calculator',      color: '#1565C0' },
  { icon: '🏠', label: 'VA LOAN',   sublabel: 'CALC',      route: '/va-loan-calculator',  color: '#B71C1C' },
] as const;

export function QuickActionsGrid() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <ThemedText type="label" style={styles.sectionLabel}>// QUICK ACCESS</ThemedText>
        <View style={styles.labelLine} />
      </View>
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => router.push(a.route as any)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={[styles.tileInner, { borderColor: a.color + '40' }]}>
              <View style={[styles.iconBg, { backgroundColor: a.color + '20' }]}>
                <ThemedText style={styles.icon}>{a.icon}</ThemedText>
              </View>
              <ThemedText type="label" style={[styles.label, { color: '#C8D8E8' }]}>{a.label}</ThemedText>
              <ThemedText type="label" style={styles.sublabel}>{a.sublabel}</ThemedText>
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
  labelLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  sectionLabel: { color: '#3D6080', fontSize: 9 },
  grid: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1 },
  pressed: { opacity: 0.6 },
  tileInner: {
    backgroundColor: '#080E1C',
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
  icon: { fontSize: 20 },
  label: { fontSize: 11, letterSpacing: 0.5 },
  sublabel: { fontSize: 8, color: '#3D6080' },
});
