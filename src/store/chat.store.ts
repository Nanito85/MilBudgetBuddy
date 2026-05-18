import { create } from 'zustand';

import { ChatMessage } from '@/types/chat.types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  contextTipId: string | null;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setContextTip: (tipId: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  contextTipId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  setContextTip: (contextTipId) => set({ contextTipId }),

  clearChat: () => set({ messages: [], contextTipId: null }),
}));
