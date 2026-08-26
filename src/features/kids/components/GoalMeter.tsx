import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Goal } from '@/types/kids.types';

interface Props {
  goal: Goal;
  accentColor: string;
}

export function GoalMeter({ goal, accentColor }: Props) {
  const pct = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0;
  const done = goal.currentAmount >= goal.targetAmount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>{goal.emoji}</ThemedText>
        <View style={styles.info}>
          <ThemedText style={styles.name}>{goal.name}</ThemedText>
          <ThemedText style={[styles.amount, { color: accentColor }]}>
            ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
          </ThemedText>
        </View>
        {done && <ThemedText style={styles.check}>✅</ThemedText>}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: accentColor }]} />
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.pctLabel}>{Math.round(pct)}% COMPLETE</ThemedText>
        {!done && (
          <ThemedText style={styles.remaining}>
            ${(goal.targetAmount - goal.currentAmount).toFixed(2)} to go
          </ThemedText>
        )}
        {done && <ThemedText style={[styles.remaining, { color: accentColor }]}>MISSION ACCOMPLISHED!</ThemedText>}
      </View>
    </View>
  );
}

// Same fixed-color rationale as ChoresList.tsx — this only ever renders on
// the Kids feature's fixed dark background, never the app's adaptive theme.
const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  emoji: { fontSize: 32, lineHeight: 38 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  amount: { fontSize: 13, fontWeight: '600' },
  check: { fontSize: 22 },
  track: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: { height: '100%', borderRadius: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pctLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' },
  remaining: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
});
