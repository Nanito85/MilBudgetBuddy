import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { getFlags } from '@/constants/features';
import { auth } from '@/services/firebase';

const STORAGE_KEY = 'mbb_entitlement_v2';
const API_BASE    = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type EntitlementStatus = 'trial' | 'pro' | 'free';
export type SubscriptionPlan  = 'monthly' | 'annual' | null;

interface EntitlementData {
  installedAt:      string;
  status:           EntitlementStatus;
  foundingMember:   boolean;
  proGrantedUntil:  string | null; // ISO — set when a discount code is redeemed
  subscriptionPlan: SubscriptionPlan;
}

interface EntitlementState extends EntitlementData {
  hydrated: boolean;
  hydrate:               () => Promise<void>;
  checkServerEntitlement: () => Promise<void>;
  completePurchase:      (plan: SubscriptionPlan) => void;
  redeemCodeGrant:       (until: string) => void;
  daysLeftInTrial:       () => number;
}

function computeStatus(data: EntitlementData): EntitlementStatus {
  if (data.status === 'pro') return 'pro';
  // Active discount-code grant counts as pro
  if (data.proGrantedUntil && new Date(data.proGrantedUntil).getTime() > Date.now()) return 'pro';
  const msElapsed = Date.now() - new Date(data.installedAt).getTime();
  return msElapsed / 86_400_000 < getFlags().promoDays ? 'trial' : 'free';
}

function persist(data: EntitlementData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function snapshot(s: EntitlementState): EntitlementData {
  return {
    installedAt:      s.installedAt,
    status:           s.status,
    foundingMember:   s.foundingMember,
    proGrantedUntil:  s.proGrantedUntil,
    subscriptionPlan: s.subscriptionPlan,
  };
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  installedAt:      new Date().toISOString(),
  status:           'trial',
  foundingMember:   false,
  proGrantedUntil:  null,
  subscriptionPlan: null,
  hydrated:         false,

  hydrate: async () => {
    try {
      // Migrate v1 → v2 key
      const v1 = await AsyncStorage.getItem('mbb_entitlement_v1');
      if (v1) {
        const old = JSON.parse(v1) as { installedAt: string; status: string; foundingMember: boolean };
        const migrated: EntitlementData = {
          installedAt:      old.installedAt,
          status:           old.status === 'pro' ? 'pro' : 'trial',
          foundingMember:   old.foundingMember ?? false,
          proGrantedUntil:  null,
          subscriptionPlan: null,
        };
        persist(migrated);
        await AsyncStorage.removeItem('mbb_entitlement_v1');
      }

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: EntitlementData = JSON.parse(raw);
        const status = computeStatus(data);
        set({ ...data, status, hydrated: true });
        if (status !== data.status) persist({ ...data, status });
      } else {
        const installedAt = new Date().toISOString();
        const fresh: EntitlementData = { installedAt, status: 'trial', foundingMember: false, proGrantedUntil: null, subscriptionPlan: null };
        persist(fresh);
        set({ ...fresh, hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  checkServerEntitlement: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/iap/entitlement`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const body = await res.json();
      const updates: Partial<EntitlementData> = {};
      if (body.status === 'pro') updates.status = 'pro';
      if (body.foundingMember === true) updates.foundingMember = true;
      if (body.subscriptionPlan) updates.subscriptionPlan = body.subscriptionPlan;
      if (body.proGrantedUntil) updates.proGrantedUntil = body.proGrantedUntil;
      if (Object.keys(updates).length > 0) {
        const next: EntitlementData = { ...snapshot(get()), ...updates };
        persist(next);
        set(updates);
      }
    } catch {
      // Network error — keep local status
    }
  },

  completePurchase: (plan) => {
    const next: EntitlementData = { ...snapshot(get()), status: 'pro', subscriptionPlan: plan };
    persist(next);
    set({ status: 'pro', subscriptionPlan: plan });
  },

  redeemCodeGrant: (until) => {
    const next: EntitlementData = { ...snapshot(get()), status: 'pro', proGrantedUntil: until };
    persist(next);
    set({ status: 'pro', proGrantedUntil: until });
  },

  daysLeftInTrial: () => {
    const { installedAt, status } = get();
    if (status === 'pro') return 0;
    if (status === 'free') return 0;
    const expiresAt = new Date(installedAt).getTime() + getFlags().promoDays * 86_400_000;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86_400_000));
  },
}));
