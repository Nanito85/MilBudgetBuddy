import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import {
  ALL_TOOLS,
  BUDGET_WEALTH,
  COMMAND_TOOLS,
  DEPLOYMENT,
  PAY_ENTITLEMENTS,
  PCS_TRAVEL,
  RESOURCES,
  RETIREMENT_VA,
  ToolItem as MenuItem,
} from '@/data/tools-catalog';
import { useThemeColors } from '@/hooks/use-theme';

// ── Types ──────────────────────────────────────────────────────────────────────
// MenuItem/ALL_TOOLS/category arrays now live in data/tools-catalog.ts — see
// that file's header for why (was duplicated with data/quick-actions.ts).

const RECENTLY_USED_KEY = 'mbb_recently_used_tools';
const MAX_RECENT = 6;

// ── Category definitions ────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  eyebrow: string;
  color: string;
  // Category colors double as text (header label/count/chevron), not just
  // decoration. The original hex values were tuned for contrast on a white
  // background only — several of them (e.g. resources' #1A237E indigo) are
  // nearly unreadable as text on the app's near-black dark-mode surface,
  // and a couple of the brighter ones (gold/amber) have the opposite
  // problem on light mode. These optional overrides give each category a
  // per-theme variant that's actually readable in both; `color` remains
  // the light-mode default and is still used for the decorative dot/icon
  // tint on individual tool cards.
  colorDark?: string;
  colorLight?: string;
  items: MenuItem[];
}

const CATEGORIES: Category[] = [
  { id: 'pay',        label: 'PAY & ENTITLEMENTS',    eyebrow: '// MILITARY COMPENSATION',  color: '#00695C', colorDark: '#2FD9BE', items: PAY_ENTITLEMENTS },
  { id: 'pcs',        label: 'PCS & TRAVEL',          eyebrow: '// MOVES & REIMBURSEMENTS', color: '#1565C0', colorDark: '#5B9DFF', items: PCS_TRAVEL },
  { id: 'budget',     label: 'BUDGET & WEALTH',       eyebrow: '// PERSONAL FINANCE',       color: '#B71C1C', colorDark: '#FF6E6E', items: BUDGET_WEALTH },
  { id: 'retirement', label: 'RETIREMENT & VETERANS', eyebrow: '// LONG-TERM READINESS',    color: '#C8A800', colorLight: '#8A6D00', items: RETIREMENT_VA },
  { id: 'deployment', label: 'DEPLOYMENT',            eyebrow: '// COMBAT ZONE FINANCE',    color: '#2E7D32', colorDark: '#5FD467', items: DEPLOYMENT },
  { id: 'resources',  label: 'GUIDES & RESOURCES',    eyebrow: '// REFERENCE & EDUCATION',  color: '#1A237E', colorDark: '#8C9EFF', items: RESOURCES },
  { id: 'command',    label: 'FINANCIAL COMMAND',     eyebrow: '// READINESS & OPERATIONS', color: Brand.accent, colorLight: '#8F5C00', items: COMMAND_TOOLS },
];

// ── Quick Situations ────────────────────────────────────────────────────────────

// Same per-theme readability issue as CATEGORIES above — colorDark/colorLight
// give each situation title a variant that's actually readable in that theme.
const SITUATIONS = [
  { id: 'pcs',     icon: '🚚', title: 'Moving / PCS',       subtitle: 'Compare pay, housing & schools', route: '/pcs-calculator',     color: '#1565C0', colorDark: '#5B9DFF' },
  { id: 'deploy',  icon: '🪖', title: 'Deploying',           subtitle: 'Extra pay, tax savings & goals', route: '/deployment-calculator', color: '#2E7D32', colorDark: '#5FD467' },
  { id: 'ets',     icon: '🎖️', title: 'Getting Out',         subtitle: 'Separation checklist & leave',   route: '/ets-checklist',      color: '#C8A800', colorLight: '#8A6D00' },
  { id: 'housing', icon: '🏠', title: 'Housing Decision',    subtitle: 'BAH lookup, on vs off-base',     route: '/bah-guide',          color: '#00695C', colorDark: '#2FD9BE' },
];

// ── Components ─────────────────────────────────────────────────────────────────

function MenuCard({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: tc.surface, borderBottomColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
      <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
      <View style={[styles.iconWrap, { backgroundColor: item.color + '20' }]}>
        <ThemedText style={styles.cardIcon}>{item.icon}</ThemedText>
      </View>
      <View style={styles.cardText}>
        <ThemedText style={[styles.cardTitle, { color: tc.textPrimary }]}>{item.title}</ThemedText>
        <ThemedText type="small" style={[styles.cardDesc, { color: tc.textSecondary }]}>{item.description}</ThemedText>
      </View>
      {item.badge && (
        <View style={[styles.badge, item.badge === 'New' ? styles.badgeNew : { backgroundColor: tc.borderColor }]}>
          <ThemedText type="label" style={[styles.badgeText, item.badge === 'New' ? styles.badgeTextNew : { color: tc.textSecondary }]}>
            {item.badge.toUpperCase()}
          </ThemedText>
        </View>
      )}
      <ThemedText style={styles.chevron}>›</ThemedText>
    </Pressable>
  );
}

function CategorySection({
  category, onPress,
}: {
  category: Category;
  onPress: (item: MenuItem) => void;
}) {
  const tc = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  // Pick the theme-appropriate readable variant (see the Category type
  // comment) instead of always using the light-tuned base color.
  const labelColor = (tc.isLight ? category.colorLight : category.colorDark) ?? category.color;
  return (
    <View style={[styles.categoryBlock, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
      <Pressable onPress={() => setExpanded(v => !v)} style={styles.categoryHeader} hitSlop={8}>
        <View style={[styles.categoryDot, { backgroundColor: labelColor }]} />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.categoryEyebrow, { color: tc.textMuted }]}>{category.eyebrow}</ThemedText>
          <ThemedText style={[styles.categoryLabel, { color: labelColor }]}>{category.label}</ThemedText>
        </View>
        <ThemedText style={[styles.categoryCount, { color: labelColor }]}>{category.items.length}</ThemedText>
        <ThemedText style={[styles.categoryChevron, { color: labelColor }]}>{expanded ? '▲' : '▼'}</ThemedText>
      </Pressable>
      {expanded && (
        <View style={[styles.categoryItems, { borderTopColor: tc.borderColor }]}>
          {category.items.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => onPress(item)} />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENTLY_USED_KEY).then((raw) => {
      if (!raw) return;
      try {
        setRecentIds(JSON.parse(raw));
      } catch {
        // Corrupted entry — ignore, recently-used list just stays empty.
      }
    });
  }, []);

  const recentTools = useMemo(
    () => recentIds.map((id) => ALL_TOOLS.find((t) => t.id === id)).filter(Boolean) as MenuItem[],
    [recentIds],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.includes(q)),
    );
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const handlePress = (item: MenuItem) => {
    if (!item.available) return;
    // Track recently used
    const updated = [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, MAX_RECENT);
    setRecentIds(updated);
    AsyncStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
    router.push(item.route as any);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <SafeAreaView>
          <ThemedText type="label" style={styles.eyebrow}>// FINANCE OPERATIONS CENTER</ThemedText>
          <ThemedText style={[styles.heading, { color: tc.textPrimary }]}>OPS TOOLKIT</ThemedText>
          <ThemedText type="label" style={[styles.subhead, { color: tc.textSecondary }]}>{ALL_TOOLS.length} TOOLS · CALCULATORS · INTEL</ThemedText>
        </SafeAreaView>

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all tools..."
            placeholderTextColor={tc.textMuted}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <ThemedText style={[styles.searchClear, { color: tc.textMuted }]}>✕</ThemedText>
            </Pressable>
          )}
        </View>

        {/* ── SEARCH RESULTS ── */}
        {isSearching ? (
          <View style={styles.list}>
            {searchResults.length === 0 ? (
              <ThemedText style={[styles.searchEmpty, { color: tc.textMuted }]}>No tools match "{searchQuery}"</ThemedText>
            ) : (
              searchResults.map((item) => (
                <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
              ))
            )}
          </View>
        ) : (
          <>
            {/* Quick Situations */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
              <ThemedText style={[styles.sectionLabelText, { color: tc.textSecondary }]}>I WILL BE...</ThemedText>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
            </View>
            <View style={styles.situationGrid}>
              {SITUATIONS.map((s) => {
                const titleColor = (tc.isLight ? s.colorLight : s.colorDark) ?? s.color;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push(s.route as any)}
                    style={({ pressed }) => [styles.situationCard, { backgroundColor: tc.surface, borderColor: s.color + '40' }, pressed && { opacity: 0.7 }]}>
                    <View style={[styles.situationIconWrap, { backgroundColor: s.color + '20' }]}>
                      <ThemedText style={styles.situationIcon}>{s.icon}</ThemedText>
                    </View>
                    <ThemedText style={[styles.situationTitle, { color: titleColor }]}>{s.title.toUpperCase()}</ThemedText>
                    <ThemedText type="small" style={[styles.situationSub, { color: tc.textSecondary }]}>{s.subtitle}</ThemedText>
                  </Pressable>
                );
              })}
            </View>


            {/* Recently Used */}
            {recentTools.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
                  <ThemedText style={[styles.sectionLabelText, { color: tc.textSecondary }]}>RECENTLY USED</ThemedText>
                  <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
                </View>
                <View style={styles.list}>
                  {recentTools.map((item) => (
                    <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
                  ))}
                </View>
              </>
            )}

            {/* Categories */}
            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                onPress={handlePress}
              />
            ))}

            {/* Settings */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
              <ThemedText style={[styles.sectionLabelText, { color: tc.textSecondary }]}>APP</ThemedText>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
            </View>
            <Pressable
              onPress={() => router.push('/settings' as any)}
              style={({ pressed }) => [styles.shortcutRow, { backgroundColor: tc.surface }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={styles.shortcutIcon}>⚙️</ThemedText>
              <View style={styles.shortcutText}>
                <ThemedText style={[styles.shortcutTitle, { color: tc.textPrimary }]}>SETTINGS</ThemedText>
                <ThemedText type="small" style={[styles.shortcutDesc, { color: tc.textSecondary }]}>Profile, text size, notifications, quick-access tiles</ThemedText>
              </View>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },

  eyebrow: { color: Brand.tactical, fontSize: 10, marginTop: Spacing.two },
  heading: { fontSize: 22, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  subhead: { fontSize: 10, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 8, paddingHorizontal: Spacing.three, paddingVertical: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  searchClear: { fontSize: 14, paddingHorizontal: 4 },
  searchEmpty: { fontSize: 13, textAlign: 'center', paddingVertical: Spacing.four },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabelText: { fontSize: 10, letterSpacing: 0.5, fontWeight: '700' },

  situationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  situationCard: {
    width: '47.5%',
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 6,
    padding: Spacing.two, gap: Spacing.one,
  },
  situationIconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  situationIcon: { fontSize: 18 },
  situationTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  situationSub: { fontSize: 12, lineHeight: 16 },

  // Category section
  categoryBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  categoryDot: { width: 4, height: 32, borderRadius: 2 },
  categoryEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  categoryLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginTop: 1 },
  categoryCount: { fontSize: 11, fontWeight: '700', opacity: 0.7, marginRight: 4 },
  categoryChevron: { fontSize: 12, fontWeight: '700' },
  categoryItems: { gap: 1, borderTopWidth: StyleSheet.hairlineWidth },

  list: { gap: Spacing.two },
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    overflow: 'hidden',
  },
  cardAccent: { width: 3, alignSelf: 'stretch' },
  iconWrap: { width: 44, height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.two },
  cardIcon: { fontSize: 22 },
  cardText: { flex: 1, gap: 2, paddingVertical: Spacing.two },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, marginRight: Spacing.one },
  badgeNew: { backgroundColor: Brand.accent + '20' },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextNew: { color: Brand.accent },
  chevron: { color: Brand.accent, fontSize: 20, paddingRight: Spacing.two },

  shortcutRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.tactical + '30', borderRadius: 6,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three,
  },
  shortcutIcon: { fontSize: 24, lineHeight: 30 },
  shortcutText: { flex: 1, gap: 2 },
  shortcutTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  shortcutDesc: { fontSize: 12 },
});
