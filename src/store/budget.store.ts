import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_budget';

export interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  monthlyBudget: number;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'housing',       name: 'Housing / Rent',   emoji: '🏠', monthlyBudget: 0 },
  { id: 'transport',     name: 'Transportation',   emoji: '🚗', monthlyBudget: 0 },
  { id: 'groceries',     name: 'Groceries',        emoji: '🛒', monthlyBudget: 0 },
  { id: 'dining',        name: 'Dining Out',       emoji: '🍽', monthlyBudget: 0 },
  { id: 'utilities',     name: 'Utilities',        emoji: '💡', monthlyBudget: 0 },
  { id: 'phone',         name: 'Phone / Internet', emoji: '📱', monthlyBudget: 0 },
  { id: 'clothing',      name: 'Clothing',         emoji: '👗', monthlyBudget: 0 },
  { id: 'entertainment', name: 'Entertainment',    emoji: '🎭', monthlyBudget: 0 },
  { id: 'savings_goal',  name: 'Savings Goal',     emoji: '💰', monthlyBudget: 0 },
];

export const MAX_TOTAL_CATEGORIES = 50;
export const CUSTOM_PREFIX = 'custom_';

interface BudgetState {
  categories: BudgetCategory[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateCategory: (id: string, monthlyBudget: number, name?: string) => void;
  addCategory: (name: string, emoji: string, idPrefix?: string) => void;
  removeCategory: (id: string) => void;
  totalBudgeted: () => number;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function saveCategories(categories: BudgetCategory[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const categories: BudgetCategory[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
      set({ categories, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  updateCategory: (id, monthlyBudget, name) => {
    const categories = get().categories.map((c) =>
      c.id === id ? { ...c, monthlyBudget, ...(name !== undefined ? { name } : {}) } : c,
    );
    set({ categories });
    saveCategories(categories);
  },

  addCategory: (name, emoji, idPrefix = '') => {
    const cat: BudgetCategory = { id: `${idPrefix}${uid()}`, name, emoji, monthlyBudget: 0 };
    const categories = [...get().categories, cat];
    set({ categories });
    saveCategories(categories);
  },

  removeCategory: (id) => {
    const categories = get().categories.filter((c) => c.id !== id);
    set({ categories });
    saveCategories(categories);
  },

  totalBudgeted: () => get().categories.reduce((sum, c) => sum + c.monthlyBudget, 0),
}));
