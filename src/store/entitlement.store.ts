import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { PROMO_DAYS } from '@/constants/features';

const STORAGE_KEY = 'mbb_entitlement_v1';

export type EntitlementStatus = 'promo' | 'pro' | 'free';

interface EntitlementData {
  installedAt: string;
  status: EntitlementStatus;
}

interface EntitlementState extends EntitlementData {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  completePurchase: () => void;
  daysLeftInPromo: () => number;
}

function computeStatus(installedAt: string, current: EntitlementStatus): EntitlementStatus {
  if (current === 'pro') return 'pro';
  const ms = Date.now() - new Date(installedAt).getTime();
  return ms / 86_400_000 < PROMO_DAYS ? 'promo' : 'free';
}

function persist(data: EntitlementData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  installedAt: new Date().toISOString(),
  status: 'promo',
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: EntitlementData = JSON.parse(raw);
        const status = computeStatus(data.installedAt, data.status);
        set({ ...data, status, hydrated: true });
        if (status !== data.status) persist({ ...data, status });
      } else {
        const installedAt = new Date().toISOString();
        persist({ installedAt, status: 'promo' });
        set({ installedAt, status: 'promo', hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  completePurchase: () => {
    const { installedAt } = get();
    persist({ installedAt, status: 'pro' });
    set({ status: 'pro' });
  },

  daysLeftInPromo: () => {
    const { installedAt, status } = get();
    if (status === 'pro') return Infinity;
    if (status === 'free') return 0;
    const expiresAt = new Date(installedAt).getTime() + PROMO_DAYS * 86_400_000;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86_400_000));
  },
}));
