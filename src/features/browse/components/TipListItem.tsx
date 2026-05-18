import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTipsStore } from '@/store/tips.store';
import { Tip } from '@/types/tip.types';

interface TipListItemProps {
  tip: Tip;
  onPress: () => void;
}

export function TipListItem({ tip, onPress }: TipListItemProps) {
  const saved = useTipsStore((s) => s.savedTipIds.includes(tip.id));
  const toggleSave = useTipsStore((s) => s.toggleSave);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={styles.textBlock}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {tip.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.preview}>
            {tip.body}
          </ThemedText>
        </View>
        <View style={styles.right}>
          <Pressable
            onPress={() => toggleSave(tip.id)}
            hitSlop={12}
            style={styles.saveBtn}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save tip'}>
            <ThemedText style={[styles.heart, saved && styles.heartSaved]}>
              {saved ? '♥' : '♡'}
            </ThemedText>
          </Pressable>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  row: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  preview: {
    lineHeight: 18,
  },
  right: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  saveBtn: {
    padding: Spacing.one,
  },
  heart: {
    fontSize: 18,
    color: '#94A3B8',
  },
  heartSaved: {
    color: Brand.accent,
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '300',
  },
});
