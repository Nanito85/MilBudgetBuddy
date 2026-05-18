import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { ChatInput } from '@/features/ai-chat/components/ChatInput';
import { ContextBanner } from '@/features/ai-chat/components/ContextBanner';
import { MessageBubble } from '@/features/ai-chat/components/MessageBubble';
import { TypingIndicator } from '@/features/ai-chat/components/TypingIndicator';
import { useChat } from '@/features/ai-chat/hooks/useChat';

const SUGGESTED_QUESTIONS = [
  'How much should I put in my TSP?',
  'What is the Blended Retirement System?',
  'How do I build my credit score?',
  'Should I use my VA loan benefit?',
];

export default function ChatScreen() {
  const { messages, isLoading, contextTipId, sendMessage, clearChat } = useChat();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const isEmpty = messages.length === 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Ask AI
        </ThemedText>
        {!isEmpty && (
          <Pressable onPress={clearChat} hitSlop={8} style={styles.clearBtn}>
            <ThemedText type="small" style={styles.clearText}>
              Clear
            </ThemedText>
          </Pressable>
        )}
      </SafeAreaView>

      <ContextBanner />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: BottomTabInset + Spacing.three },
          ]}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {isEmpty && !contextTipId && (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>💬</ThemedText>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Military Finance AI
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                Ask anything about TSP, VA loans, BAH, TRICARE, credit, and more.
              </ThemedText>
              <View style={styles.suggestions}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => sendMessage(q)}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
                    <ThemedText type="small" style={styles.suggestionText}>
                      {q}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isLoading && <TypingIndicator />}
        </ScrollView>

        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  clearBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  clearText: {
    color: Brand.primaryLight,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestions: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  suggestion: {
    borderWidth: 1,
    borderColor: `${Brand.primary}40`,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  suggestionPressed: {
    opacity: 0.65,
  },
  suggestionText: {
    color: Brand.primary,
    fontWeight: '500',
  },
});
