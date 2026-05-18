import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useChatStore } from '@/store/chat.store';
import { useTipsStore } from '@/store/tips.store';
import { Tip } from '@/types/tip.types';

import { CategoryBadge } from './CategoryBadge';

interface SavedTipRowProps {
  tip: Tip;
}

export function SavedTipRow({ tip }: SavedTipRowProps) {
  const router = useRouter();
  const { toggleSave } = useTipsStore();
  const { setContextTip } = useChatStore();

  const handleAskAI = () => {
    setContextTip(tip.id);
    router.push('/chat');
  };

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
          <ThemedText type="small" style={styles.removeText}>Remove</ThemedText>
        </Pressable>
        <Pressable onPress={handleAskAI} hitSlop={8} style={styles.iconBtn}>
          <ThemedText type="small" style={styles.askText}>Ask AI →</ThemedText>
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
  removeText: {
    color: '#94A3B8',
  },
  askText: {
    color: '#2E5FA3',
    fontWeight: '600',
  },
});
