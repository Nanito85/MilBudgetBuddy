import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  CATEGORY_COLORS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  TipCategory,
} from '@/types/tip.types';

interface CategoryCardProps {
  category: TipCategory;
  count: number;
  onPress: () => void;
}

export function CategoryCard({ category, count, onPress }: CategoryCardProps) {
  const { bg, text } = CATEGORY_COLORS[category];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={[styles.topBand, { backgroundColor: bg }]}>
          <ThemedText style={[styles.categoryName, { color: text }]}>
            {CATEGORY_LABELS[category]}
          </ThemedText>
        </View>
        <View style={styles.body}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {CATEGORY_DESCRIPTIONS[category]}
          </ThemedText>
          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              {count} tips
            </ThemedText>
            <ThemedText style={[styles.arrow, { color: bg }]}>→</ThemedText>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topBand: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  description: {
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  arrow: {
    fontSize: 16,
    fontWeight: '700',
  },
});
