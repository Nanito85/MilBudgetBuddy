import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_kid_mode_v1';

interface KidModeData {
  pin: string | null;
  active: boolean;
  kidId: string | null;
}

interface KidModeState extends KidModeData {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  activate: (kidId: string) => void;
  deactivate: () => void;
  setPin: (pin: string) => void;
  clearPin: () => void;
}

function persist(data: KidModeData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useKidModeStore = create<KidModeState>((set, get) => ({
  pin: null,
  active: false,
  kidId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const data: KidModeData = raw
        ? JSON.parse(raw)
        : { pin: null, active: false, kidId: null };
      set({ ...data, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  activate: (kidId) => {
    const { pin } = get();
    persist({ pin, active: true, kidId });
    set({ active: true, kidId });
  },

  deactivate: () => {
    const { pin } = get();
    persist({ pin, active: false, kidId: null });
    set({ active: false, kidId: null });
  },

  setPin: (pin) => {
    const { active, kidId } = get();
    persist({ pin, active, kidId });
    set({ pin });
  },

  clearPin: () => {
    const { active, kidId } = get();
    persist({ pin: null, active, kidId });
    set({ pin: null });
  },
}));
