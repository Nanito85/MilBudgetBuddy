import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useChatStore } from '@/store/chat.store';
import { useTipsStore } from '@/store/tips.store';
import { Tip } from '@/types/tip.types';

import { CategoryBadge } from './CategoryBadge';

interface TipCardProps {
  tip: Tip;
}

export function TipCard({ tip }: TipCardProps) {
  const router = useRouter();
  const toggleSave = useTipsStore((s) => s.toggleSave);
  const saved = useTipsStore((s) => s.savedTipIds.includes(tip.id));
  const setContextTip = useChatStore((s) => s.setContextTip);

  const handleAskAI = () => {
    setContextTip(tip.id);
    router.push('/chat');
  };

  return (
    <TacticalCard accentColor={Brand.border} cornerSize={10} style={styles.card}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.topRow}>
        <CategoryBadge category={tip.category} />
        <Pressable onPress={() => toggleSave(tip.id)} hitSlop={12} style={styles.bookmarkBtn}>
          <ThemedText style={[styles.bookmarkIcon, saved && { color: Brand.accent }]}>
            {saved ? '♥' : '♡'}
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText style={styles.title}>{tip.title}</ThemedText>
      <ThemedText style={styles.body}>{tip.body}</ThemedText>

      <Pressable
        onPress={handleAskAI}
        style={({ pressed }) => [styles.aiButton, pressed && { opacity: 0.7 }]}>
        <ThemedText type="label" style={styles.aiButtonText}>ASK AI ABOUT THIS  ›</ThemedText>
      </Pressable>
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
  bookmarkIcon: { fontSize: 20, color: '#3D6080' },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#C8D8E8',
    lineHeight: 24,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5580A0',
    letterSpacing: 0.2,
  },
  aiButton: {
    backgroundColor: 'rgba(21,101,192,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.4)',
    borderRadius: 3,
    paddingVertical: Spacing.one + 4,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  aiButtonText: { color: Brand.primaryLight, fontSize: 10 },
});
