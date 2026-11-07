import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const STATE_KEY = 'mbb_kid_mode_state_v1'; // active + kidId only (AsyncStorage)
const PIN_KEY   = 'mbb_kid_pin_v1';         // PIN only (SecureStore — hardware-backed)
const LOCK_KEY  = 'mbb_kid_pin_lock_v1';    // failed-attempt counter + lockout end (AsyncStorage)

interface KidModeState {
  pin: string | null;
  active: boolean;
  kidId: string | null;
  hydrated: boolean;
  // Failed parent-PIN attempts since the last success, and when the current lockout ends.
  // Persisted so closing and reopening the PIN screen (or the app) cannot reset the count.
  pinFailures: number;
  pinLockedUntil: number;
  recordFailedPin: (maxAttempts: number, baseLockSeconds: number) => { failures: number; lockedUntil: number };
  clearPinLock: () => void;
  hydrate: () => Promise<void>;
  activate: (kidId: string) => void;
  deactivate: () => void;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => Promise<void>;
  resetAll: () => Promise<void>;
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
  pinFailures: 0,
  pinLockedUntil: 0,

  recordFailedPin: (maxAttempts, baseLockSeconds) => {
    const failures = get().pinFailures + 1;
    let lockedUntil = get().pinLockedUntil;
    // Every full set of failed attempts locks the screen, and each lockout is twice as long as the last (capped at 1 hour).
    if (failures % maxAttempts === 0) {
      const round = failures / maxAttempts;
      lockedUntil = Date.now() + Math.min(3600, baseLockSeconds * 2 ** (round - 1)) * 1000;
    }
    set({ pinFailures: failures, pinLockedUntil: lockedUntil });
    AsyncStorage.setItem(LOCK_KEY, JSON.stringify({ failures, lockedUntil })).catch(() => {});
    return { failures, lockedUntil };
  },

  clearPinLock: () => {
    set({ pinFailures: 0, pinLockedUntil: 0 });
    AsyncStorage.removeItem(LOCK_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const [raw, pin, lockRaw] = await Promise.all([
        AsyncStorage.getItem(STATE_KEY),
        loadPin(),
        AsyncStorage.getItem(LOCK_KEY),
      ]);
      if (lockRaw) {
        try {
          const l = JSON.parse(lockRaw);
          set({ pinFailures: Number(l.failures) || 0, pinLockedUntil: Number(l.lockedUntil) || 0 });
        } catch { /* ignore a corrupt lock record */ }
      }

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

  resetAll: async () => {
    await deletePin();
    AsyncStorage.removeItem(STATE_KEY);
    AsyncStorage.removeItem(LOCK_KEY).catch(() => {});
    set({ pin: null, active: false, kidId: null, pinFailures: 0, pinLockedUntil: 0 });
  },
}));
