import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { Chore, ChoreFrequency, Goal } from '@/types/kids.types';

interface Props {
  chores: Chore[];
  goals: Goal[];
  kidId: string;
  accentColor: string;
  onComplete: (choreId: string, goalId: string) => void;
  onUncomplete: (choreId: string, goalId?: string) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function isDoneInPeriod(completedDates: string[], frequency: ChoreFrequency): boolean {
  const t = today();
  switch (frequency) {
    case 'daily': return completedDates.includes(t);
    case 'weekly': { const ws = weekStart(t); return completedDates.some((d) => weekStart(d) === ws); }
    case 'monthly': return completedDates.some((d) => d.slice(0, 7) === t.slice(0, 7));
  }
}

export function ChoresList({ chores, goals, accentColor, onComplete, onUncomplete }: Props) {
  const primaryGoal = goals[0];
  const tc = useThemeColors();

  if (chores.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={[styles.emptyText, { color: tc.textSecondary }]}>
          No chores yet. Ask a parent to add some!
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chores.map((chore) => {
        const done = isDoneInPeriod(chore.completedDates, chore.frequency ?? 'daily');
        return (
          <Pressable
            key={chore.id}
            onPress={() => {
              if (done) {
                onUncomplete(chore.id, primaryGoal?.id);
              } else if (primaryGoal) {
                onComplete(chore.id, primaryGoal.id);
              }
            }}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: tc.surface + 'CC', borderColor: accentColor + '40' },
              done && styles.rowDone,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.checkbox, { borderColor: accentColor }, done && { backgroundColor: accentColor }]}>
              {done && <ThemedText style={styles.checkmark}>✓</ThemedText>}
            </View>
            <View style={styles.info}>
              <ThemedText style={[styles.choreName, { color: tc.textPrimary }, done && styles.doneText]}>
                {chore.name}
              </ThemedText>
            </View>
            <View style={[styles.badge, { borderColor: accentColor, backgroundColor: accentColor + '20' }]}>
              <ThemedText style={[styles.badgeText, { color: accentColor }]}>
                +${chore.value.toFixed(2)}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  empty: { alignItems: 'center', paddingVertical: Spacing.four },
  emptyText: { fontSize: 14, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
  },
  rowDone: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  info: { flex: 1 },
  choreName: { fontSize: 15, fontWeight: '600' },
  doneText: { textDecorationLine: 'line-through', opacity: 0.7 },
  badge: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
});
