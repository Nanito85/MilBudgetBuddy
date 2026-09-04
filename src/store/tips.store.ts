import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_saved_tips';

interface TipsState {
  savedTipIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleSave: (tipId: string) => void;
  resetAll: () => void;
}

export const useTipsStore = create<TipsState>((set, get) => ({
  savedTipIds: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      set({ savedTipIds: ids, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  toggleSave: (tipId) => {
    const current = get().savedTipIds;
    const next = current.includes(tipId)
      ? current.filter((id) => id !== tipId)
      : [...current, tipId];
    set({ savedTipIds: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  resetAll: () => {
    set({ savedTipIds: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
