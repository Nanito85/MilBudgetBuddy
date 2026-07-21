import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_expenses';

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  note: string;
  date: string; // ISO date YYYY-MM-DD
}

interface ExpensesState {
  expenses: Expense[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addExpense: (categoryId: string, amount: number, note: string, date?: string) => void;
  removeExpense: (id: string) => void;
  spentByCategory: (monthKey: string) => Record<string, number>; // monthKey = "YYYY-MM"
  totalSpent: (monthKey: string) => number;
  resetAll: () => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function save(expenses: Expense[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function monthKey(date: string): string {
  return date.slice(0, 7); // "YYYY-MM"
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const expenses: Expense[] = raw ? JSON.parse(raw) : [];
      set({ expenses, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addExpense: (categoryId, amount, note, date) => {
    const entry: Expense = { id: uid(), categoryId, amount, note, date: date ?? today() };
    const expenses = [entry, ...get().expenses];
    set({ expenses });
    save(expenses);
  },

  removeExpense: (id) => {
    const expenses = get().expenses.filter((e) => e.id !== id);
    set({ expenses });
    save(expenses);
  },

  spentByCategory: (mk) => {
    const result: Record<string, number> = {};
    for (const e of get().expenses) {
      if (monthKey(e.date) === mk) {
        result[e.categoryId] = (result[e.categoryId] ?? 0) + e.amount;
      }
    }
    return result;
  },

  totalSpent: (mk) => {
    return get().expenses
      .filter((e) => monthKey(e.date) === mk)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  resetAll: () => {
    set({ expenses: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
