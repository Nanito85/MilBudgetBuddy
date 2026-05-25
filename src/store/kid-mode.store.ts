import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const STATE_KEY = 'mbb_kid_mode_state_v1'; // active + kidId only (AsyncStorage)
const PIN_KEY   = 'mbb_kid_pin_v1';         // PIN only (SecureStore — hardware-backed)

interface KidModeState {
  pin: string | null;
  active: boolean;
  kidId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  activate: (kidId: string) => void;
  deactivate: () => void;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => Promise<void>;
}

function persistState(active: boolean, kidId: string | null) {
  AsyncStorage.setItem(STATE_KEY, JSON.stringify({ active, kidId }));
}

async function savePin(pin: string) {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

async function deletePin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

async function loadPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
}

export const useKidModeStore = create<KidModeState>((set, get) => ({
  pin: null,
  active: false,
  kidId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const [raw, pin] = await Promise.all([
        AsyncStorage.getItem(STATE_KEY),
        loadPin(),
      ]);

      // Migrate: if old key exists (plain-text PIN in AsyncStorage), move it
      const oldRaw = await AsyncStorage.getItem('mbb_kid_mode_v1');
      if (oldRaw && !pin) {
        const old = JSON.parse(oldRaw);
        if (old.pin) await savePin(old.pin);
        await AsyncStorage.removeItem('mbb_kid_mode_v1');
      }

      const fresh = await loadPin(); // re-read after potential migration
      const state = raw ? JSON.parse(raw) : { active: false, kidId: null };
      set({ pin: fresh, active: state.active ?? false, kidId: state.kidId ?? null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  activate: (kidId) => {
    const { pin } = get();
    persistState(true, kidId);
    set({ active: true, kidId });
    void pin; // pin stays in memory only; SecureStore is the source of truth
  },

  deactivate: () => {
    persistState(false, null);
    set({ active: false, kidId: null });
  },

  setPin: async (pin) => {
    await savePin(pin);
    const { active, kidId } = get();
    persistState(active, kidId);
    set({ pin });
  },

  clearPin: async () => {
    await deletePin();
    const { active, kidId } = get();
    persistState(active, kidId);
    set({ pin: null });
  },
}));
