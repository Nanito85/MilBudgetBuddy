import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { ALL_QUICK_ACTIONS } from '@/data/quick-actions';
import { useAppTheme, useTheme } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

const MAX_TILES = 4;

const FONT_SCALE_OPTIONS: { label: string; sublabel: string; value: number }[] = [
  { label: 'Normal',     sublabel: 'Default text size',        value: 1.0 },
  { label: 'Large',      sublabel: 'Slightly bigger text',     value: 1.2 },
  { label: 'X-Large',   sublabel: 'Easier to read',           value: 1.4 },
  { label: 'XX-Large',  sublabel: 'Maximum accessibility',    value: 1.6 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const appTheme = useAppTheme();

  const savedIds      = useUserStore((s) => s.quickAccessIds);
  const fontScale     = useUserStore((s) => s.fontScale ?? 1.0);
  const setQuickAccessIds = useUserStore((s) => s.setQuickAccessIds);
  const setAppTheme   = useUserStore((s) => s.setAppTheme);
  const setFontScale  = useUserStore((s) => s.setFontScale);

  const [selected, setSelected] = useState<string[]>(savedIds.slice(0, MAX_TILES));

  const isDark = appTheme === 'dark';
  const bg     = isDark ? '#04080F' : '#F0F4F8';
  const card   = isDark ? '#080E1C' : '#FFFFFF';
  const text   = isDark ? '#C8D8E8' : '#0D1E2E';
  const textDim= isDark ? '#4D7A9A' : '#4A6A84';

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_TILES) return prev;
      return [...prev, id];
    });
  };

  const save = () => {
    setQuickAccessIds(selected);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: Brand.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[styles.title, { color: text }]}>SETTINGS</ThemedText>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* ── APPEARANCE ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// APPEARANCE</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>DISPLAY MODE</ThemedText>
          <ThemedText type="label" style={[styles.sectionDesc, { color: textDim }]}>
            CHOOSE DARK OR LIGHT MODE FOR THE APP.
          </ThemedText>
        </View>

        <View style={[styles.themeRow]}>
          {[
            { value: 'dark' as const,  emoji: '🌙', label: 'Dark Mode',  sub: 'Military HUD aesthetic' },
            { value: 'light' as const, emoji: '☀️', label: 'Light Mode', sub: 'High-contrast readability' },
          ].map((opt) => {
            const isSelected = appTheme === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setAppTheme(opt.value)}
                style={({ pressed }) => [
                  styles.themeCard,
                  { backgroundColor: card, borderColor: isSelected ? Brand.tactical : Brand.border },
                  isSelected && { backgroundColor: Brand.tactical + '12' },
                  pressed && { opacity: 0.75 },
                ]}>
                <ThemedText style={styles.themeEmoji}>{opt.emoji}</ThemedText>
                <ThemedText style={[styles.themeLabel, { color: isSelected ? Brand.tactical : text }]}>
                  {opt.label}
                </ThemedText>
                <ThemedText style={[styles.themeSub, { color: textDim }]}>{opt.sub}</ThemedText>
                {isSelected && (
                  <View style={[styles.themeCheck, { backgroundColor: Brand.tactical }]}>
                    <ThemedText style={styles.themeCheckMark}>✓</ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── FONT SIZE ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// ACCESSIBILITY</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>TEXT SIZE</ThemedText>
          <ThemedText type="label" style={[styles.sectionDesc, { color: textDim }]}>
            INCREASE TEXT SIZE FOR EASIER READING. LAYOUTS ADJUST AUTOMATICALLY.
          </ThemedText>
        </View>

        <View style={styles.fontList}>
          {FONT_SCALE_OPTIONS.map((opt) => {
            const isSelected = Math.abs(fontScale - opt.value) < 0.05;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFontScale(opt.value)}
                style={({ pressed }) => [
                  styles.fontRow,
                  { backgroundColor: card, borderColor: isSelected ? Brand.accent : Brand.border },
                  isSelected && { backgroundColor: Brand.accent + '10' },
                  pressed && { opacity: 0.7 },
                ]}>
                <View style={styles.fontRowLeft}>
                  <ThemedText style={[styles.fontLabel, { color: isSelected ? Brand.accent : text, fontSize: 14 * opt.value }]}>
                    {opt.label}
                  </ThemedText>
                  <ThemedText style={[styles.fontSub, { color: textDim, fontSize: 10 * opt.value }]}>
                    {opt.sublabel}
                  </ThemedText>
                </View>
                <View style={[
                  styles.fontRadio,
                  isSelected && { backgroundColor: Brand.accent, borderColor: Brand.accent },
                ]}>
                  {isSelected && <ThemedText style={styles.fontRadioMark}>✓</ThemedText>}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── HOME SCREEN TILES ──────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// HOME SCREEN</ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>QUICK ACCESS TILES</ThemedText>
          <ThemedText type="label" style={[styles.sectionDesc, { color: textDim }]}>
            SELECT UP TO {MAX_TILES} TOOLS TO SHOW ON YOUR HOME SCREEN.
            {'\n'}{selected.length}/{MAX_TILES} SELECTED.
          </ThemedText>
        </View>

        <View style={styles.list}>
          {ALL_QUICK_ACTIONS.map((action) => {
            const isSelected = selected.includes(action.id);
            const isDisabled = !isSelected && selected.length >= MAX_TILES;
            return (
              <Pressable
                key={action.id}
                onPress={() => toggle(action.id)}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: card, borderColor: Brand.border },
                  isSelected && { borderColor: Brand.tactical + '60', backgroundColor: Brand.tactical + '08' },
                  isDisabled && styles.rowDisabled,
                  pressed && !isDisabled && { opacity: 0.7 },
                ]}>
                <View style={[styles.colorDot, { backgroundColor: action.color }]} />
                <View style={[styles.iconWrap, { backgroundColor: action.color + '20' }]}>
                  <ThemedText style={styles.rowIcon}>{action.icon}</ThemedText>
                </View>
                <View style={styles.rowText}>
                  <ThemedText style={[styles.rowTitle, { color: isDisabled ? textDim : text }]}>
                    {action.label}
                  </ThemedText>
                  <ThemedText type="label" style={[styles.rowSub, { color: textDim }]}>{action.sublabel}</ThemedText>
                </View>
                <View style={[styles.checkbox, isSelected && { backgroundColor: Brand.tactical, borderColor: Brand.tactical }]}>
                  {isSelected && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, backgroundColor: bg, borderTopColor: Brand.border }]}>
        <Pressable onPress={save} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}>
          <ThemedText style={styles.saveBtnText}>SAVE CHANGES</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical, lineHeight: 22 },
  title: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', letterSpacing: 2 },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.three, paddingTop: Spacing.three },
  section: { gap: Spacing.one },
  eyebrow: { color: Brand.tactical, fontSize: 9 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  sectionDesc: { fontSize: 9, lineHeight: 14 },

  themeRow: { flexDirection: 'row', gap: Spacing.two },
  themeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  themeEmoji: { fontSize: 28, lineHeight: 34 },
  themeLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  themeSub:   { fontSize: 9, textAlign: 'center', lineHeight: 13 },
  themeCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  themeCheckMark: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  fontList: { gap: Spacing.two },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  fontRowLeft: { flex: 1, gap: 3 },
  fontLabel: { fontWeight: '800', letterSpacing: 0.5 },
  fontSub:   { lineHeight: 14 },
  fontRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontRadioMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rowDisabled: { opacity: 0.35 },
  colorDot: { width: 3, alignSelf: 'stretch' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  rowIcon: { fontSize: 20 },
  rowText: { flex: 1, gap: 2, paddingVertical: Spacing.two },
  rowTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  rowSub: { fontSize: 9 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    backgroundColor: Brand.tactical,
    borderRadius: 4,
    padding: Spacing.three,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
