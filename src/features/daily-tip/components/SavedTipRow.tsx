import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useTipsStore } from '@/store/tips.store';
import { Tip } from '@/types/tip.types';

import { CategoryBadge } from './CategoryBadge';

interface SavedTipRowProps {
  tip: Tip;
}

export function SavedTipRow({ tip }: SavedTipRowProps) {
  const tc = useThemeColors();
  const { toggleSave } = useTipsStore();

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.left}>
        <CategoryBadge category={tip.category} size="sm" />
        <ThemedText type="small" style={styles.title} numberOfLines={2}>
          {tip.title}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => toggleSave(tip.id)} hitSlop={8} style={styles.iconBtn}>
          <ThemedText type="small" style={[styles.removeText, { color: tc.textMuted }]}>Remove</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  left: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  iconBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  removeText: {},
});
