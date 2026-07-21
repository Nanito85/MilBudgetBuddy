import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { TIPS } from '@/data/tips';
import { CategoryBadge } from '@/features/daily-tip/components/CategoryBadge';
import { useWeeklyTip } from '@/features/daily-tip/hooks/useWeeklyTip';
import { useThemeColors } from '@/hooks/use-theme';
import { useTipsStore } from '@/store/tips.store';
import { CATEGORY_LABELS, Tip, TipCategory } from '@/types/tip.types';

const CATEGORY_ORDER: TipCategory[] = ['tsp', 'credit', 'investing', 'budgeting', 'housing', 'insurance'];

type FilterValue = 'all' | 'saved' | TipCategory;

function TipRow({ tip, featured, onPress }: { tip: Tip; featured?: boolean; onPress: () => void }) {
  const tc = useThemeColors();
  const saved = useTipsStore((s) => s.savedTipIds.includes(tip.id));
  const toggleSave = useTipsStore((s) => s.toggleSave);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tipRow,
        { backgroundColor: tc.surface, borderColor: featured ? Brand.accent + '80' : tc.borderColor },
        pressed && { opacity: 0.75 },
      ]}>
      <View style={styles.tipRowTop}>
        <CategoryBadge category={tip.category} size="sm" />
        {featured && (
          <View style={styles.featuredBadge}>
            <ThemedText style={styles.featuredBadgeText}>THIS WEEK</ThemedText>
          </View>
        )}
        <Pressable onPress={() => toggleSave(tip.id)} hitSlop={10} style={styles.heartBtn}>
          <ThemedText style={[styles.heart, { color: tc.textMuted }, saved && { color: Brand.accent }]}>
            {saved ? '♥' : '♡'}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText style={[styles.tipTitle, { color: tc.textPrimary }]}>{tip.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.tipBody} numberOfLines={2}>
        {tip.body}
      </ThemedText>
    </Pressable>
  );
}

export default function TipLibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const featuredTip = useWeeklyTip();
  const savedTipIds = useTipsStore((s) => s.savedTipIds);

  const [filter, setFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let pool = TIPS;
    if (filter === 'saved') pool = pool.filter((t) => savedTipIds.includes(t.id));
    else if (filter !== 'all') pool = pool.filter((t) => t.category === filter);

    const q = query.trim().toLowerCase();
    if (q) {
      pool = pool.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return pool;
  }, [filter, query, savedTipIds]);

  const filterChips: { value: FilterValue; label: string }[] = [
    { value: 'all', label: `All (${TIPS.length})` },
    { value: 'saved', label: `Saved (${savedTipIds.length})` },
    ...CATEGORY_ORDER.map((c) => ({ value: c as FilterValue, label: CATEGORY_LABELS[c] })),
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two, borderBottomColor: tc.borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ThemedText style={styles.backText}>‹ Back</ThemedText>
        </Pressable>
        <ThemedText style={[styles.title, { color: tc.textPrimary }]}>TIP LIBRARY</ThemedText>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tips..."
          placeholderTextColor={tc.textMuted}
          style={[styles.searchInput, { color: tc.textPrimary }]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}>
        {filterChips.map((c) => {
          const active = filter === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setFilter(c.value)}
              style={[styles.chip, { borderColor: tc.borderColor }, active && { backgroundColor: Brand.accent, borderColor: Brand.accent }]}>
              <ThemedText style={[styles.chipText, { color: tc.textSecondary }, active && styles.chipTextActive]}>
                {c.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            {filter === 'saved' ? 'No saved tips yet — tap the ♡ on any tip to save it.' : 'No tips match your search.'}
          </ThemedText>
        ) : (
          filtered.map((tip) => (
            <TipRow
              key={tip.id}
              tip={tip}
              featured={tip.id === featuredTip.id && filter === 'all' && !query}
              onPress={() => router.push(`/tip/${tip.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { color: Brand.tactical, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },

  searchWrap: {
    marginHorizontal: Spacing.three, marginTop: Spacing.three,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: Spacing.three,
  },
  searchInput: { fontSize: 15, paddingVertical: Spacing.two + 2 },

  chipsScroll: { marginTop: Spacing.two, flexGrow: 0 },
  chipsRow: { paddingHorizontal: Spacing.three, gap: Spacing.one + 2, paddingVertical: 2 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.one + 2 },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#1A1A1A' },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.two },
  emptyText: { textAlign: 'center', paddingVertical: Spacing.five, lineHeight: 20 },

  tipRow: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, gap: Spacing.one + 2 },
  tipRowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  featuredBadge: { backgroundColor: Brand.accent + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  featuredBadgeText: { fontSize: 9, fontWeight: '900', color: Brand.accent, letterSpacing: 0.5 },
  heartBtn: { marginLeft: 'auto', padding: 2 },
  heart: { fontSize: 18 },
  tipTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  tipBody: { lineHeight: 18 },
});
