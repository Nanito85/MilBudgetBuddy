import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useTipsStore } from '@/store/tips.store';
import { Tip } from '@/types/tip.types';

import { CategoryBadge } from './CategoryBadge';

interface TipCardProps {
  tip: Tip;
}

export function TipCard({ tip }: TipCardProps) {
  const tc = useThemeColors();
  const toggleSave = useTipsStore((s) => s.toggleSave);
  const saved = useTipsStore((s) => s.savedTipIds.includes(tip.id));

  return (
    <TacticalCard accentColor={tc.borderColor} cornerSize={10} style={styles.card}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.topRow}>
        <CategoryBadge category={tip.category} />
        <Pressable onPress={() => toggleSave(tip.id)} hitSlop={12} style={styles.bookmarkBtn}>
          <ThemedText style={[styles.bookmarkIcon, { color: tc.textMuted }, saved && { color: Brand.accent }]}>
            {saved ? '♥' : '♡'}
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.title, { color: tc.textPrimary }]}>{tip.title}</ThemedText>
      <ThemedText style={[styles.body, { color: tc.textSecondary }]}>{tip.body}</ThemedText>
    </TacticalCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    padding: Spacing.three,
    paddingLeft: Spacing.three + 6,
    gap: Spacing.two,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Brand.accent,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookmarkBtn: { padding: Spacing.one },
  bookmarkIcon: { fontSize: 20 },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});
