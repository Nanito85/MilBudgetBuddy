import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type GoalCategory =
  | 'emergency'
  | 'housing'
  | 'vehicle'
  | 'education'
  | 'vacation'
  | 'gear'
  | 'retirement'
  | 'custom';

export const GOAL_CATEGORY_META: Record<GoalCategory, { label: string; emoji: string; color: string }> = {
  emergency: { label: 'Emergency Fund', emoji: '🛡️', color: '#E67E22' },
  housing:   { label: 'Housing / Down Payment', emoji: '🏠', color: '#1565C0' },
  vehicle:   { label: 'Vehicle', emoji: '🚗', color: '#D32F2F' },
  education: { label: 'Education / GI Bill', emoji: '🎓', color: '#1A237E' },
  vacation:  { label: 'Leave / Travel', emoji: '✈️', color: '#0277BD' },
  gear:      { label: 'Gear & Equipment', emoji: '🪖', color: '#2E7D32' },
  retirement:{ label: 'Retirement / TSP', emoji: '📊', color: '#00695C' },
  custom:    { label: 'Custom Goal', emoji: '🎯', color: '#6A1B9A' },
};

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  color: string;
  createdAt: string;
}

interface GoalsState {
  goals: SavingsGoal[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addGoal: (name: string, emoji: string, category: GoalCategory, targetAmount: number) => void;
  deposit: (goalId: string, amount: number) => void;
  withdraw: (goalId: string, amount: number) => void;
  removeGoal: (goalId: string) => void;
}

const STORAGE_KEY = 'mbb_savings_goals_v1';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function save(goals: SavingsGoal[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export const useSavingsGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ goals: JSON.parse(raw) });
    } catch {}
    set({ hydrated: true });
  },

  addGoal: (name, emoji, category, targetAmount) => {
    const meta = GOAL_CATEGORY_META[category];
    const goal: SavingsGoal = {
      id: uid(),
      name,
      emoji: emoji || meta.emoji,
      category,
      targetAmount,
      currentAmount: 0,
      color: meta.color,
      createdAt: new Date().toISOString(),
    };
    const goals = [...get().goals, goal];
    set({ goals });
    save(goals);
  },

  deposit: (goalId, amount) => {
    const goals = get().goals.map((g) =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g,
    );
    set({ goals });
    save(goals);
  },

  withdraw: (goalId, amount) => {
    const goals = get().goals.map((g) =>
      g.id === goalId
        ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) }
        : g,
    );
    set({ goals });
    save(goals);
  },

  removeGoal: (goalId) => {
    const goals = get().goals.filter((g) => g.id !== goalId);
    set({ goals });
    save(goals);
  },
}));
