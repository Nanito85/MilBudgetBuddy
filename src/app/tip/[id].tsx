import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CategoryBadge } from '@/features/daily-tip/components/CategoryBadge';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { TIPS } from '@/data/tips';
import { useChatStore } from '@/store/chat.store';
import { useTipsStore } from '@/store/tips.store';

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tip = TIPS.find((t) => t.id === id);
  const saved = useTipsStore((s) => s.savedTipIds.includes(id ?? ''));
  const toggleSave = useTipsStore((s) => s.toggleSave);
  const setContextTip = useChatStore((s) => s.setContextTip);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push('/browse');
  };

  const handleAskAI = () => {
    if (tip) setContextTip(tip.id);
    router.push('/chat');
  };

  if (!tip) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.notFound}>Tip not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <ThemedText style={styles.backText}>← Back</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.metaRow}>
          <CategoryBadge category={tip.category} />
          <Pressable
            onPress={() => toggleSave(tip.id)}
            hitSlop={12}
            style={styles.saveBtn}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save tip'}>
            <ThemedText style={[styles.heart, saved && styles.heartSaved]}>
              {saved ? '♥' : '♡'}
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.title}>{tip.title}</ThemedText>

        <ThemedText type="default" themeColor="textSecondary" style={styles.body}>
          {tip.body}
        </ThemedText>

        <View style={styles.tagRow}>
          {tip.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <ThemedText type="small" themeColor="textSecondary">
                {tag}
              </ThemedText>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleAskAI}
          style={({ pressed }) => [styles.aiButton, pressed && styles.aiButtonPressed]}>
          <ThemedText style={styles.aiButtonText}>Ask AI about this  →</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  backText: {
    color: Brand.primaryLight,
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    padding: Spacing.one,
  },
  heart: {
    fontSize: 26,
    color: '#94A3B8',
  },
  heartSaved: {
    color: Brand.accent,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    fontSize: 17,
    lineHeight: 28,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tag: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 99,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  aiButton: {
    backgroundColor: Brand.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  aiButtonPressed: {
    opacity: 0.8,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  notFound: {
    padding: Spacing.four,
  },
});
