import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_networth';

export interface NetWorthItem {
  id: string;
  name: string;
  amount: number;
}

export type NetWorthCategory = 'asset' | 'liability';

export interface NetWorthEntry {
  id: string;
  label: string;
  amount: number;
  category: NetWorthCategory;
}

const DEFAULT_ASSETS: NetWorthEntry[] = [
  { id: 'checking',    label: 'Checking / Savings', amount: 0, category: 'asset' },
  { id: 'tsp',         label: 'TSP Balance',         amount: 0, category: 'asset' },
  { id: 'vehicle',     label: 'Vehicle Value',        amount: 0, category: 'asset' },
  { id: 'home_equity', label: 'Home Equity',          amount: 0, category: 'asset' },
  { id: 'investments', label: 'Other Investments',    amount: 0, category: 'asset' },
];

const DEFAULT_LIABILITIES: NetWorthEntry[] = [
  { id: 'car_loan',     label: 'Auto Loan',        amount: 0, category: 'liability' },
  { id: 'credit_cards', label: 'Credit Cards',     amount: 0, category: 'liability' },
  { id: 'student_loan', label: 'Student Loans',    amount: 0, category: 'liability' },
  { id: 'mortgage',     label: 'Mortgage Balance', amount: 0, category: 'liability' },
  { id: 'other_debt',   label: 'Other Debt',       amount: 0, category: 'liability' },
];

interface NetWorthState {
  entries: NetWorthEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  applyRemote: (data: Pick<NetWorthState, 'entries'>) => void;
  updateEntry: (id: string, amount: number, label?: string) => void;
  addEntry: (label: string, category: NetWorthCategory) => void;
  removeEntry: (id: string) => void;
  totalAssets: () => number;
  totalLiabilities: () => number;
  netWorth: () => number;
  resetAll: () => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function save(entries: NetWorthEntry[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const useNetWorthStore = create<NetWorthState>((set, get) => ({
  entries: [...DEFAULT_ASSETS, ...DEFAULT_LIABILITIES],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      // Cloud data from another device landed while disk was being read —
      // it's newer than this on-device copy, so don't overwrite it.
      if (get().hydrated) return;
      const entries: NetWorthEntry[] = raw
        ? JSON.parse(raw)
        : [...DEFAULT_ASSETS, ...DEFAULT_LIABILITIES];
      set({ entries, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  // A snapshot from the cloud (another device's edit). Saved to disk too:
  // applying it in memory only let the next hydrate() reload the older
  // on-device copy and auto-push that stale copy back over the cloud.
  applyRemote: (data) => {
    set({ ...data, hydrated: true });
    save(data.entries);
  },

  updateEntry: (id, amount, label) => {
    const entries = get().entries.map((e) =>
      e.id === id ? { ...e, amount, ...(label !== undefined ? { label } : {}) } : e,
    );
    set({ entries });
    save(entries);
  },

  addEntry: (label, category) => {
    const entry: NetWorthEntry = { id: uid(), label, amount: 0, category };
    const entries = [...get().entries, entry];
    set({ entries });
    save(entries);
  },

  removeEntry: (id) => {
    const entries = get().entries.filter((e) => e.id !== id);
    set({ entries });
    save(entries);
  },

  totalAssets: () =>
    get()
      .entries.filter((e) => e.category === 'asset')
      .reduce((s, e) => s + e.amount, 0),

  totalLiabilities: () =>
    get()
      .entries.filter((e) => e.category === 'liability')
      .reduce((s, e) => s + e.amount, 0),

  netWorth: () => get().totalAssets() - get().totalLiabilities(),

  resetAll: () => {
    set({ entries: [...DEFAULT_ASSETS, ...DEFAULT_LIABILITIES] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
