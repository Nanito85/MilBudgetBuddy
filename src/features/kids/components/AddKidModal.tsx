import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { KidGender, getKidTheme } from '@/types/kids.types';

// The single "Add Kid" screen — used from both PROFILE > (kids section) and
// the KIDS TAB > "+ Add Kid" button. Previously these were two separately
// written modals (different field label, hardcoded vs. theme-driven colors,
// different button styling) — same fix as EditPayModal: one shared
// component so the screen is identical no matter which door you came in.

export function AddKidModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (nickname: string, gender: KidGender) => void;
}) {
  const tc = useThemeColors();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<KidGender>('boy');

  const submit = () => {
    if (!nickname.trim()) return;
    onAdd(nickname.trim(), gender);
    setNickname('');
    setGender('boy');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.bg, { backgroundColor: tc.background }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: tc.textPrimary }]}>// NEW CADET</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={[styles.cancel, { color: tc.textMuted }]}>CANCEL</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="label" style={[styles.fieldLabel, { color: tc.textMuted }]}>CALL SIGN (NICKNAME)</ThemedText>
          <View style={[styles.inputWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Maverick"
              placeholderTextColor={tc.textHint}
              style={[styles.input, { color: tc.textPrimary }]}
              autoFocus
              autoCapitalize="words"
            />
          </View>

          <ThemedText type="label" style={[styles.fieldLabel, { color: tc.textMuted, marginTop: Spacing.three }]}>THEME</ThemedText>
          <View style={styles.themeRow}>
            {(['boy', 'girl'] as KidGender[]).map((g) => {
              const theme = getKidTheme(g);
              const isSelected = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.themeBtn, { borderColor: tc.borderColor }, isSelected && { borderColor: theme.primary, backgroundColor: theme.bg }]}>
                  <ThemedText style={styles.themeEmoji}>{g === 'boy' ? '💙' : '💗'}</ThemedText>
                  <ThemedText style={[styles.themeLabel, { color: tc.textMuted }, isSelected && { color: theme.primary }]}>
                    {g === 'boy' ? 'BLUE / SKY' : 'PINK / PURPLE'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={submit}
            style={[styles.addBtn, { backgroundColor: tc.accent }, !nickname.trim() && { opacity: 0.4 }]}>
            <ThemedText style={[styles.addBtnText, { color: tc.tactical }]}>ACTIVATE PROFILE →</ThemedText>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  cancel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  fieldLabel: { fontSize: 9, marginBottom: 6 },
  inputWrap: { borderWidth: 1, borderRadius: 4, paddingHorizontal: Spacing.three },
  input: { fontSize: 18, fontWeight: '700', paddingVertical: Spacing.two + 4 },
  themeRow: { flexDirection: 'row', gap: Spacing.two },
  themeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 4, padding: Spacing.three, alignItems: 'center', gap: Spacing.one },
  themeEmoji: { fontSize: 28, lineHeight: 36 },
  themeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  addBtn: { borderRadius: 4, padding: Spacing.three, alignItems: 'center', marginTop: 'auto' },
  addBtnText: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});
