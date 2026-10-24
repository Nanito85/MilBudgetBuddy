import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_saved_tips';

interface TipsState {
  savedTipIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  applyRemote: (data: Pick<TipsState, 'savedTipIds'>) => void;
  toggleSave: (tipId: string) => void;
  resetAll: () => void;
}

export const useTipsStore = create<TipsState>((set, get) => ({
  savedTipIds: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      // Cloud data from another device landed while disk was being read —
      // it's newer than this on-device copy, so don't overwrite it.
      if (get().hydrated) return;
      const ids: string[] = raw ? JSON.parse(raw) : [];
      set({ savedTipIds: ids, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  // A snapshot from the cloud (another device's edit). Saved to disk too:
  // applying it in memory only let the next hydrate() reload the older
  // on-device copy and auto-push that stale copy back over the cloud.
  applyRemote: (data) => {
    set({ ...data, hydrated: true });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.savedTipIds));
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
