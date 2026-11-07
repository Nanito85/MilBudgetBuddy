import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  // Resolves on success (the modal is closed by the caller) or throws an Error
  // whose message is shown under the field.
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Asks the signed-in member to re-enter their password before an irreversible
 * action. Alert.prompt only exists on iOS, so this is a real modal.
 */
export function ConfirmPasswordModal({ visible, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const tc = useThemeColors();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPassword('');
      setError(null);
      setBusy(false);
    }
  }, [visible]);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(password);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={[styles.title, { color: tc.textPrimary }]}>{title}</ThemedText>
          <ThemedText style={[styles.message, { color: tc.textSecondary }]}>{message}</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={tc.textHint}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            onSubmitEditing={submit}
            accessibilityLabel="Password"
            style={[styles.input, { color: tc.textPrimary, borderColor: tc.borderColor, backgroundColor: tc.surfaceInner }]}
          />
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <View style={styles.row}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              style={[styles.btn, { backgroundColor: tc.surfaceInner }]}>
              <ThemedText style={[styles.btnText, { color: tc.textSecondary }]}>CANCEL</ThemedText>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={busy || !password}
              accessibilityRole="button"
              style={[styles.btn, { backgroundColor: Brand.danger, opacity: busy || !password ? 0.5 : 1 }]}>
              {busy ? <ActivityIndicator color="#fff" /> : <ThemedText style={[styles.btnText, { color: '#fff' }]}>{confirmLabel}</ThemedText>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.four },
  card: { borderRadius: Spacing.three, borderWidth: 1, padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  message: { fontSize: 13, lineHeight: 19 },
  input: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2, fontSize: 15, marginTop: Spacing.one },
  error: { color: Brand.danger, fontSize: 13 },
  row: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  btn: { flex: 1, borderRadius: Spacing.two, paddingVertical: Spacing.two + 2, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  btnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
