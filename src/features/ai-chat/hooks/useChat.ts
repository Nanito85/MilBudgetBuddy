import { useCallback } from 'react';

import { ApiMessage, buildSystemPrompt, callClaude } from '@/services/claude';
import { useChatStore } from '@/store/chat.store';
import { ChatMessage } from '@/types/chat.types';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const API_KEY_ERROR =
  "To use AI chat, add your Anthropic API key to the .env file:\nEXPO_PUBLIC_ANTHROPIC_API_KEY=your_key_here\n\nGet a key at console.anthropic.com";

const NETWORK_ERROR =
  "Couldn't reach the AI. Check your connection and try again.";

export function useChat() {
  const { messages, isLoading, contextTipId, addMessage, setLoading, clearChat } =
    useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      addMessage(userMsg);
      setLoading(true);

      try {
        const systemPrompt = buildSystemPrompt(contextTipId);

        const apiMessages: ApiMessage[] = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const reply = await callClaude(apiMessages, systemPrompt);

        addMessage({
          id: makeId(),
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        });
      } catch (error: unknown) {
        const isKeyMissing =
          error instanceof Error && error.message === 'ANTHROPIC_API_KEY_MISSING';

        addMessage({
          id: makeId(),
          role: 'assistant',
          content: isKeyMissing ? API_KEY_ERROR : NETWORK_ERROR,
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [messages, contextTipId, addMessage, setLoading],
  );

  return { messages, isLoading, contextTipId, sendMessage, clearChat };
}
