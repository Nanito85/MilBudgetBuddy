import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getCompletedDateInPeriod } from '@/store/kids.store';
import { Chore, Goal } from '@/types/kids.types';

interface Props {
  chores: Chore[];
  goals: Goal[];
  kidId: string;
  accentColor: string;
  onComplete: (choreId: string, goalId: string) => void;
  onUncomplete: (choreId: string, goalId?: string) => void;
}

export function ChoresList({ chores, goals, accentColor, onComplete, onUncomplete }: Props) {
  const primaryGoal = goals[0];

  if (chores.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={styles.emptyText}>
          No chores yet. Ask a parent to add some!
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chores.map((chore) => {
        const done = getCompletedDateInPeriod(chore.completedDates, chore.frequency ?? 'daily') !== null;
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
              { borderColor: accentColor + '40' },
              done && styles.rowDone,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.checkbox, { borderColor: accentColor }, done && { backgroundColor: accentColor }]}>
              {done && <ThemedText style={styles.checkmark}>✓</ThemedText>}
            </View>
            <View style={styles.info}>
              <ThemedText style={[styles.choreName, done && styles.doneText]}>
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

// This list only ever renders on the Kids feature's fixed dark "space
// command" background (kids/[id].tsx sets backgroundColor: theme.bg
// regardless of the app's own light/dark setting) — so these colors are
// intentionally fixed rather than pulled from useThemeColors(). Using the
// adaptive theme here previously meant a parent in Light Mode saw a
// near-white translucent row with dark-on-dark text floating on the fixed
// dark kid background.
const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  empty: { alignItems: 'center', paddingVertical: Spacing.four },
  emptyText: { fontSize: 14, textAlign: 'center', color: 'rgba(255,255,255,0.5)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
  choreName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  doneText: { textDecorationLine: 'line-through', opacity: 0.7 },
  badge: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
});
