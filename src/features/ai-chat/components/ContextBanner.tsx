import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { TIPS } from '@/data/tips';
import { useChatStore } from '@/store/chat.store';

export function ContextBanner() {
  const contextTipId = useChatStore((s) => s.contextTipId);
  const setContextTip = useChatStore((s) => s.setContextTip);

  if (!contextTipId) return null;

  const tip = TIPS.find((t) => t.id === contextTipId);
  if (!tip) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <ThemedText type="small" style={styles.text} numberOfLines={1}>
        Tip context: {tip.title}
      </ThemedText>
      <Pressable
        onPress={() => setContextTip(null)}
        hitSlop={12}
        accessibilityLabel="Clear tip context">
        <ThemedText style={styles.close}>×</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: `${Brand.primary}18`,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${Brand.primary}40`,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.accent,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    color: Brand.primary,
    fontWeight: '600',
  },
  close: {
    fontSize: 18,
    color: Brand.primary,
    fontWeight: '400',
    lineHeight: 20,
  },
});
