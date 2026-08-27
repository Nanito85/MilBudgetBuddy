import Constants from 'expo-constants';
import { usePathname } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth.store';
import { useFeedbackStore } from '@/store/feedback.store';
import { useUserStore } from '@/store/user.store';

const CATEGORIES = [
  'Bug',
  'Feature Request',
  'Confusing',
  'Payment Issue',
  'Military Pay Issue',
  'PCS Tool Issue',
  'Child Account Issue',
  'Spouse Account Issue',
  'Other',
];

const CATEGORY_EMOJI: Record<string, string> = {
  'Bug': '🐛',
  'Feature Request': '✨',
  'Confusing': '😕',
  'Payment Issue': '💳',
  'Military Pay Issue': '🪖',
  'PCS Tool Issue': '📦',
  'Child Account Issue': '👧',
  'Spouse Account Issue': '💑',
  'Other': '💬',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: Props) {
  const tc = useThemeColors();
  const pathname           = usePathname();
  const { user }           = useAuthStore();
  const serviceStatus      = useUserStore((s) => s.serviceStatus);
  const { submitFeedback, submitting, submitError, submitSuccess, resetSubmit } = useFeedbackStore();

  const [category, setCategory] = useState('Other');
  const [message, setMessage]   = useState('');

  const handleClose = () => {
    resetSubmit();
    setCategory('Other');
    setMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    const ok = await submitFeedback({
      category,
      message:    message.trim(),
      screenName: pathname,
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
      deviceType: Platform.OS,
      userRole:   serviceStatus ?? undefined,
    });
    if (ok) setMessage('');
  };

  const canSubmit = message.trim().length >= 5 && !submitting;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: tc.borderColor }]}>
            <ThemedText style={[styles.headerTitle, { color: tc.textPrimary }]}>SEND FEEDBACK</ThemedText>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <ThemedText style={[styles.closeText, { color: tc.textHint }]}>✕</ThemedText>
            </Pressable>
          </View>

          {submitSuccess ? (
            /* ── Success state ── */
            <View style={styles.successBox}>
              <ThemedText style={styles.successEmoji}>✅</ThemedText>
              <ThemedText style={[styles.successTitle, { color: tc.textPrimary }]}>Feedback received!</ThemedText>
              <ThemedText style={[styles.successSub, { color: tc.textSecondary }]}>
                Thanks — your feedback helps improve MilBudgetBuddy.
              </ThemedText>
              <Pressable onPress={handleClose} style={styles.doneBtn}>
                <ThemedText style={styles.doneBtnText}>DONE</ThemedText>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>

              {/* Eyebrow */}
              <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
              <ThemedText style={[styles.sub, { color: tc.textSecondary }]}>
                What's on your mind? We read every submission.
              </ThemedText>

              {/* Category */}
              <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>CATEGORY</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        { borderColor: tc.borderColor, backgroundColor: tc.surface },
                        active && styles.chipActive,
                      ]}>
                      <ThemedText style={[styles.chipText, { color: tc.textSecondary }, active && styles.chipTextActive]}>
                        {CATEGORY_EMOJI[cat]} {cat}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Message */}
              <ThemedText style={[styles.fieldLabel, { color: tc.textHint, marginTop: Spacing.three }]}>
                MESSAGE <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Describe the issue or idea in detail..."
                placeholderTextColor={tc.textMuted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={[styles.messageInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]}
                maxLength={2000}
              />
              <ThemedText style={[styles.charCount, { color: tc.textMuted }]}>{message.length}/2000</ThemedText>

              {/* Auto-captured info */}
              <View style={[styles.autoBox, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
                <ThemedText style={[styles.autoLabel, { color: tc.textMuted }]}>AUTO-CAPTURED</ThemedText>
                <ThemedText style={[styles.autoItem, { color: tc.textHint }]}>Screen: {pathname}</ThemedText>
                <ThemedText style={[styles.autoItem, { color: tc.textHint }]}>Version: {Constants.expoConfig?.version ?? '1.0.0'}</ThemedText>
                <ThemedText style={[styles.autoItem, { color: tc.textHint }]}>Device: {Platform.OS}</ThemedText>
                {/* user can now also be an anonymous Firebase session (created
                    silently for IAP purchases — see auth.store.ts's
                    ensureSignedIn) which has no email; showing "Account: "
                    with nothing after it would look broken, so only show
                    this line for a real signed-in account. */}
                {user && !user.isAnonymous && <ThemedText style={[styles.autoItem, { color: tc.textHint }]}>Account: {user.email}</ThemedText>}
              </View>

              {/* Error */}
              {submitError ? (
                <View style={styles.errorBox}>
                  <ThemedText style={styles.errorText}>{submitError}</ThemedText>
                </View>
              ) : null}

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  !canSubmit && { opacity: 0.4 },
                  pressed && { opacity: 0.7 },
                ]}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <ThemedText style={styles.submitBtnText}>SUBMIT FEEDBACK</ThemedText>}
              </Pressable>

              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <ThemedText style={[styles.cancelText, { color: tc.textMuted }]}>Cancel</ThemedText>
              </Pressable>
            </ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 16 },

  body: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.four, gap: Spacing.two },

  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sub: { fontSize: 13, lineHeight: 19 },

  fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  required: { color: Brand.classified },

  chipRow: { paddingVertical: Spacing.one, gap: Spacing.one + 2, flexDirection: 'row' },
  chip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipActive: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: Brand.tactical },

  messageInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    minHeight: 130,
  },
  charCount: { fontSize: 10, textAlign: 'right', marginTop: -Spacing.one },

  autoBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: Spacing.two + 2,
    gap: 3,
    marginTop: Spacing.one,
  },
  autoLabel: { fontSize: 9, letterSpacing: 0.5, marginBottom: 2 },
  autoItem: { fontSize: 11 },

  errorBox: {
    backgroundColor: Brand.danger + '15',
    borderWidth: 1,
    borderColor: Brand.danger + '40',
    borderRadius: 6,
    padding: Spacing.two + 2,
  },
  errorText: { color: Brand.danger, fontSize: 13 },

  submitBtn: {
    backgroundColor: Brand.tactical,
    borderRadius: 6,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  cancelText: { fontSize: 13 },

  // Success
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.three },
  successEmoji: { fontSize: 56, lineHeight: 66 },
  successTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  successSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  doneBtn: { backgroundColor: Brand.tactical, borderRadius: 6, paddingHorizontal: Spacing.five, paddingVertical: Spacing.two + 4, marginTop: Spacing.two },
  doneBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1, fontSize: 13 },
});
