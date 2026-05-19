import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_debts';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;           // annual %, e.g. 19.99
  minPayment: number;
}

interface DebtState {
  debts: Debt[];
  extraMonthly: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addDebt: (name: string, balance: number, apr: number, minPayment: number) => void;
  updateDebt: (id: string, partial: Partial<Omit<Debt, 'id'>>) => void;
  removeDebt: (id: string) => void;
  setExtraMonthly: (amount: number) => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface Persisted {
  debts: Debt[];
  extraMonthly: number;
}

function save(data: Persisted) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useDebtStore = create<DebtState>((set, get) => ({
  debts: [],
  extraMonthly: 0,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { debts, extraMonthly }: Persisted = JSON.parse(raw);
        set({ debts, extraMonthly, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  addDebt: (name, balance, apr, minPayment) => {
    const debt: Debt = { id: uid(), name, balance, apr, minPayment };
    const debts = [...get().debts, debt];
    set({ debts });
    save({ debts, extraMonthly: get().extraMonthly });
  },

  updateDebt: (id, partial) => {
    const debts = get().debts.map((d) => (d.id === id ? { ...d, ...partial } : d));
    set({ debts });
    save({ debts, extraMonthly: get().extraMonthly });
  },

  removeDebt: (id) => {
    const debts = get().debts.filter((d) => d.id !== id);
    set({ debts });
    save({ debts, extraMonthly: get().extraMonthly });
  },

  setExtraMonthly: (extraMonthly) => {
    set({ extraMonthly });
    save({ debts: get().debts, extraMonthly });
  },
}));
