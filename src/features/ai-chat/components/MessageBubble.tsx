import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Brand, Spacing } from '@/constants/theme';
import { ChatMessage } from '@/types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAI]}>
      {!isUser && (
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>AI</ThemedText>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? styles.bubbleUser
            : [styles.bubbleAI, { backgroundColor: theme.backgroundElement }],
        ]}>
        <ThemedText style={[styles.text, isUser && styles.textUser]}>
          {message.content}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: Spacing.one,
    gap: Spacing.two,
  },
  wrapperUser: {
    justifyContent: 'flex-end',
    paddingLeft: Spacing.six,
  },
  wrapperAI: {
    justifyContent: 'flex-start',
    paddingRight: Spacing.six,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bubble: {
    maxWidth: '100%',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bubbleUser: {
    backgroundColor: Brand.primary,
    borderBottomRightRadius: Spacing.one,
  },
  bubbleAI: {
    borderBottomLeftRadius: Spacing.one,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#FFFFFF',
  },
});
