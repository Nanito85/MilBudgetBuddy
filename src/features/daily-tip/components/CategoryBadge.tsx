import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CATEGORY_COLORS, CATEGORY_LABELS, TipCategory } from '@/types/tip.types';

interface CategoryBadgeProps {
  category: TipCategory;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const { bg, text } = CATEGORY_COLORS[category];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      {/* Was a raw RN Text — the only spot in the app not using ThemedText,
          so this label didn't scale with the in-app Normal/Large/X-Large/
          XX-Large text-size setting like everything else, and wasn't
          protected from the OS's own Dynamic Type setting either (see
          ThemedText's allowFontScaling comment). */}
      <ThemedText style={[styles.label, { color: text }, isSmall && styles.labelSm]}>
        {CATEGORY_LABELS[category]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 99,
    paddingVertical: Spacing.half + 2,
    paddingHorizontal: Spacing.two,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.one + Spacing.half,
  },
  // Explicit lineHeight so it scales with Settings > Text Size — a bare
  // fontSize alone doesn't, so at larger sizes the badge's fixed padding
  // stopped being enough room and its rounded border clipped the letters.
  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 10,
    lineHeight: 13,
  },
});
