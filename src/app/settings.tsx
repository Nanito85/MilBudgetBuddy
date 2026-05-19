import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { ALL_QUICK_ACTIONS } from '@/data/quick-actions';
import { useUserStore } from '@/store/user.store';

const MAX_TILES = 4;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedIds = useUserStore((s) => s.quickAccessIds);
  const setQuickAccessIds = useUserStore((s) => s.setQuickAccessIds);

  const [selected, setSelected] = useState<string[]>(savedIds.slice(0, MAX_TILES));

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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>SETTINGS</ThemedText>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <ThemedText type="label" style={styles.eyebrow}>// HOME SCREEN</ThemedText>
          <ThemedText style={styles.sectionTitle}>QUICK ACCESS TILES</ThemedText>
          <ThemedText type="label" style={styles.sectionDesc}>
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
                  isSelected && styles.rowSelected,
                  isDisabled && styles.rowDisabled,
                  pressed && !isDisabled && { opacity: 0.7 },
                ]}>
                <View style={[styles.colorDot, { backgroundColor: action.color }]} />
                <View style={[styles.iconWrap, { backgroundColor: action.color + '20' }]}>
                  <ThemedText style={styles.rowIcon}>{action.icon}</ThemedText>
                </View>
                <View style={styles.rowText}>
                  <ThemedText style={[styles.rowTitle, isDisabled && styles.rowTitleDim]}>
                    {action.label}
                  </ThemedText>
                  <ThemedText type="label" style={styles.rowSub}>{action.sublabel}</ThemedText>
                </View>
                <View style={[styles.checkbox, isSelected && { backgroundColor: Brand.tactical, borderColor: Brand.tactical }]}>
                  {isSelected && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two }]}>
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
    borderBottomColor: Brand.border,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical },
  title: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', letterSpacing: 2, color: '#C8D8E8' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.three, paddingTop: Spacing.three },
  section: { gap: Spacing.one },
  eyebrow: { color: Brand.tactical, fontSize: 9 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8' },
  sectionDesc: { color: '#3D6080', fontSize: 9, lineHeight: 14 },

  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rowSelected: { borderColor: Brand.tactical + '60', backgroundColor: Brand.tactical + '08' },
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
  rowTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: '#C8D8E8' },
  rowTitleDim: { color: '#3D6080' },
  rowSub: { color: '#4D7A9A', fontSize: 9 },
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
    borderTopColor: Brand.border,
    backgroundColor: '#04080F',
  },
  saveBtn: {
    backgroundColor: Brand.tactical,
    borderRadius: 4,
    padding: Spacing.three,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
