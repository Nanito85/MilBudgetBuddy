import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { Installation, searchInstallations } from '@/data/installations';

interface Props {
  label: string;
  selected: Installation | null;
  onSelect: (inst: Installation) => void;
  conusOnly?: boolean;
}

export function StationPicker({ label, selected, onSelect, conusOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const results = conusOnly
    ? searchInstallations(query).filter((i) => !i.oconus && !!i.mhaZip)
    : searchInstallations(query);

  const handleSelect = (inst: Installation) => {
    onSelect(inst);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.trigger}>
          <View style={styles.triggerContent}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.triggerLabel}>
              {label}
            </ThemedText>
            <ThemedText style={[styles.triggerValue, !selected && styles.placeholder]} numberOfLines={1}>
              {selected ? selected.name : 'Select installation'}
            </ThemedText>
            {selected && (
              <ThemedText type="small" themeColor="textSecondary">
                {selected.city}, {selected.state}
              </ThemedText>
            )}
          </View>
          <ThemedText themeColor="textSecondary" style={styles.chevron}>›</ThemedText>
        </ThemedView>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>{label}</ThemedText>
            <Pressable onPress={() => { setOpen(false); setQuery(''); }}>
              <ThemedText style={styles.closeBtn}>Done</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search installation or city..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.backgroundElement }]} />}
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                  <View style={styles.rowMain}>
                    <ThemedText style={styles.rowName}>{item.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.city}, {item.state} · {item.branch}
                      {item.oconus ? ' · OCONUS' : ''}
                    </ThemedText>
                  </View>
                  {item.oconus && (
                    <View style={styles.oconusBadge}>
                      <ThemedText style={styles.oconusBadgeText}>OCONUS</ThemedText>
                    </View>
                  )}
                </Pressable>
              </>
            )}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                No installations found
              </ThemedText>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  trigger: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  triggerContent: { flex: 1, gap: 2 },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  triggerValue: { fontSize: 16, fontWeight: '600' },
  placeholder: { opacity: 0.4 },
  chevron: { fontSize: 22, fontWeight: '300' },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { color: Brand.primary, fontWeight: '600', fontSize: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.two,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600' },
  oconusBadge: {
    backgroundColor: 'rgba(230,126,34,0.15)',
    borderRadius: 99,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 2,
  },
  oconusBadgeText: { fontSize: 9, fontWeight: '700', color: Brand.warning, letterSpacing: 0.4 },
  empty: { textAlign: 'center', padding: Spacing.five },
});
