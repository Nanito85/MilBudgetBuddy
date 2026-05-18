import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TipListItem } from '@/features/browse/components/TipListItem';
import { useTipsByCategory } from '@/features/browse/hooks/useCategories';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { CATEGORY_COLORS, CATEGORY_LABELS, TipCategory } from '@/types/tip.types';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const category = slug as TipCategory;
  const tips = useTipsByCategory(category);
  const label = CATEGORY_LABELS[category] ?? slug;
  const { bg } = CATEGORY_COLORS[category] ?? { bg: Brand.primary };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push('/browse');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <ThemedText style={styles.backText}>← Back</ThemedText>
        </Pressable>
        <View style={styles.titleRow}>
          <View style={[styles.categoryDot, { backgroundColor: bg }]} />
          <ThemedText type="subtitle" style={styles.title}>
            {label}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {tips.length} tips
        </ThemedText>
      </View>

      <FlatList
        data={tips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TipListItem
            tip={item}
            onPress={() => router.push(`/tip/${item.id}`)}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
});
