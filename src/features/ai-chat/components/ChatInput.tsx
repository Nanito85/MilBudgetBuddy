import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask about military finances...',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const tc = useThemeColors();
  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.container, { borderTopColor: tc.borderColor }]}>
      <TextInput
        style={[styles.input, { color: tc.textPrimary }]}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={tc.textSecondary}
        multiline
        maxLength={1000}
        onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
        blurOnSubmit={false}
        editable={!disabled}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendBtn,
          { backgroundColor: canSend ? Brand.primary : 'transparent', borderColor: tc.borderColor },
          pressed && styles.sendPressed,
        ]}
        accessibilityLabel="Send message">
        <ThemedText style={[styles.sendIcon, { color: canSend ? '#FFFFFF' : tc.textSecondary }]}>
          ↑
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 100,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sendPressed: {
    opacity: 0.75,
  },
  sendIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 1,
  },
});
