import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_budget';
// Tracks default (non-custom) category ids the user has explicitly deleted,
// so migrateCategories() knows not to backfill them back in on next hydrate —
// it otherwise can't tell "user deleted this" apart from "this default didn't
// exist yet when their data was saved" (the latter is what backfill is for).
const DELETED_DEFAULTS_KEY = 'mbb_budget_deleted_defaults';

export type BudgetGroup =
  | 'household'
  | 'transportation'
  | 'subscriptions'
  | 'personal'
  | 'savings'
  | 'other';

export interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  monthlyBudget: number;
  group: BudgetGroup;
  /** True for categories the user added themselves (vs. the built-in defaults). */
  removable?: boolean;
}

export const GROUP_META: Record<BudgetGroup, { label: string; emoji: string; color: string }> = {
  household:      { label: 'Household',          emoji: '🏠', color: '#3D8BFD' },
  transportation: { label: 'Transportation',      emoji: '🚗', color: '#F5A623' },
  subscriptions:  { label: 'Subscriptions',       emoji: '📺', color: '#B15DFF' },
  personal:       { label: 'Personal & Lifestyle',emoji: '🎭', color: '#00C8A8' },
  savings:        { label: 'Savings & Goals',     emoji: '💰', color: '#00B27A' },
  other:          { label: 'Other',               emoji: '📦', color: '#8892A0' },
};

export const GROUP_ORDER: BudgetGroup[] = [
  'household', 'transportation', 'subscriptions', 'personal', 'savings', 'other',
];

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  // Household
  { id: 'housing',            name: 'Rent / Mortgage',     emoji: '🏠', monthlyBudget: 0, group: 'household' },
  { id: 'groceries',          name: 'Groceries',           emoji: '🛒', monthlyBudget: 0, group: 'household' },
  { id: 'utilities',          name: 'Utilities',           emoji: '💡', monthlyBudget: 0, group: 'household' },
  { id: 'phone',              name: 'Phone / Internet',    emoji: '📱', monthlyBudget: 0, group: 'household' },
  { id: 'household_supplies', name: 'Household Supplies',  emoji: '🧺', monthlyBudget: 0, group: 'household', removable: true },

  // Transportation
  { id: 'transport',          name: 'Transportation',      emoji: '🚗', monthlyBudget: 0, group: 'transportation' },
  { id: 'fuel',                name: 'Gas / Fuel',          emoji: '⛽', monthlyBudget: 0, group: 'transportation', removable: true },
  { id: 'auto_insurance',      name: 'Auto Insurance',      emoji: '🛡️', monthlyBudget: 0, group: 'transportation', removable: true },
  { id: 'maintenance',         name: 'Maintenance & Repairs', emoji: '🔧', monthlyBudget: 0, group: 'transportation', removable: true },

  // Subscriptions
  { id: 'streaming',          name: 'Streaming (Netflix, Hulu, Disney+)', emoji: '🎬', monthlyBudget: 0, group: 'subscriptions', removable: true },
  { id: 'live_tv',            name: 'YouTube TV / Cable',  emoji: '📺', monthlyBudget: 0, group: 'subscriptions', removable: true },
  { id: 'music',               name: 'Music (Spotify, Apple Music)', emoji: '🎵', monthlyBudget: 0, group: 'subscriptions', removable: true },
  { id: 'software',            name: 'Software & Cloud Storage', emoji: '☁️', monthlyBudget: 0, group: 'subscriptions', removable: true },

  // Personal & Lifestyle
  { id: 'dining',             name: 'Dining Out',          emoji: '🍽', monthlyBudget: 0, group: 'personal' },
  { id: 'clothing',           name: 'Clothing',            emoji: '👗', monthlyBudget: 0, group: 'personal' },
  { id: 'entertainment',      name: 'Entertainment',       emoji: '🎭', monthlyBudget: 0, group: 'personal' },
  { id: 'personal_care',      name: 'Personal Care',       emoji: '🧴', monthlyBudget: 0, group: 'personal', removable: true },

  // Savings & Goals
  { id: 'savings_goal',       name: 'Savings Goal',        emoji: '💰', monthlyBudget: 0, group: 'savings' },
];

// Fallback group for legacy category ids saved before grouping existed.
const LEGACY_GROUP_BY_ID: Record<string, BudgetGroup> = {
  housing: 'household', groceries: 'household', utilities: 'household', phone: 'household',
  transport: 'transportation',
  dining: 'personal', clothing: 'personal', entertainment: 'personal',
  savings_goal: 'savings',
};

export const MAX_TOTAL_CATEGORIES = 50;
export const CUSTOM_PREFIX = 'custom_';

/**
 * Merges a persisted (possibly older-shaped) category list with the current
 * default set: backfills `group` on legacy rows and appends any new default
 * categories the user's saved data predates, without touching amounts they've
 * already set. Skips backfilling any default the user has explicitly deleted.
 */
function migrateCategories(saved: BudgetCategory[], deletedDefaultIds: string[]): BudgetCategory[] {
  const byId = new Map(saved.map((c) => [c.id, c]));
  const migrated = saved.map((c) => ({
    ...c,
    group: c.group ?? LEGACY_GROUP_BY_ID[c.id] ?? 'other',
  }));
  for (const def of DEFAULT_CATEGORIES) {
    if (!byId.has(def.id) && !deletedDefaultIds.includes(def.id)) migrated.push({ ...def });
  }
  return migrated;
}

interface BudgetState {
  categories: BudgetCategory[];
  deletedDefaultIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateCategory: (id: string, monthlyBudget: number, name?: string) => void;
  addCategory: (name: string, emoji: string, idPrefix?: string, group?: BudgetGroup) => void;
  removeCategory: (id: string) => void;
  totalBudgeted: () => number;
  resetAll: () => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function saveCategories(categories: BudgetCategory[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

function saveDeletedDefaults(ids: string[]) {
  AsyncStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(ids));
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  deletedDefaultIds: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const [raw, rawDeleted] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(DELETED_DEFAULTS_KEY),
      ]);
      const deletedDefaultIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      const categories = raw ? migrateCategories(JSON.parse(raw), deletedDefaultIds) : DEFAULT_CATEGORIES;
      set({ categories, deletedDefaultIds, hydrated: true });
      if (raw) saveCategories(categories); // persist the backfilled/migrated shape
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

  addCategory: (name, emoji, idPrefix = '', group = 'other') => {
    const cat: BudgetCategory = {
      id: `${idPrefix}${uid()}`, name, emoji, monthlyBudget: 0, group, removable: true,
    };
    const categories = [...get().categories, cat];
    set({ categories });
    saveCategories(categories);
  },

  removeCategory: (id) => {
    const categories = get().categories.filter((c) => c.id !== id);
    set({ categories });
    saveCategories(categories);

    // If this was one of the built-in defaults, remember that so it doesn't
    // get silently re-added the next time the store hydrates.
    const isDefault = DEFAULT_CATEGORIES.some((d) => d.id === id);
    if (isDefault && !get().deletedDefaultIds.includes(id)) {
      const deletedDefaultIds = [...get().deletedDefaultIds, id];
      set({ deletedDefaultIds });
      saveDeletedDefaults(deletedDefaultIds);
    }
  },

  totalBudgeted: () => get().categories.reduce((sum, c) => sum + c.monthlyBudget, 0),

  resetAll: () => {
    set({ categories: DEFAULT_CATEGORIES, deletedDefaultIds: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
    AsyncStorage.removeItem(DELETED_DEFAULTS_KEY);
  },
}));
