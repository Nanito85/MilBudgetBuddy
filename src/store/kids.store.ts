import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { Chore, ChoreFrequency, Goal, KidGender, KidProfile } from '@/types/kids.types';

const STORAGE_KEY = 'mbb_kids';

interface KidsState {
  kids: KidProfile[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addKid: (nickname: string, gender: KidGender) => void;
  removeKid: (kidId: string) => void;
  addGoal: (kidId: string, name: string, emoji: string, targetAmount: number) => void;
  updateGoalProgress: (kidId: string, goalId: string, amount: number) => void;
  removeGoal: (kidId: string, goalId: string) => void;
  addChore: (kidId: string, name: string, value: number, frequency: ChoreFrequency) => void;
  completeChore: (kidId: string, choreId: string, goalId: string) => void;
  uncompleteChore: (kidId: string, choreId: string) => void;
  removeChore: (kidId: string, choreId: string) => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function getCompletedDateInPeriod(dates: string[], frequency: ChoreFrequency): string | null {
  const t = today();
  switch (frequency) {
    case 'daily': return dates.includes(t) ? t : null;
    case 'weekly': { const ws = weekStart(t); return dates.find((d) => weekStart(d) === ws) ?? null; }
    case 'monthly': return dates.find((d) => d.slice(0, 7) === t.slice(0, 7)) ?? null;
  }
}

function saveKids(kids: KidProfile[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(kids));
}

export const useKidsStore = create<KidsState>((set, get) => ({
  kids: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const kids: KidProfile[] = raw ? JSON.parse(raw) : [];
      set({ kids, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addKid: (nickname, gender) => {
    const kid: KidProfile = { id: uid(), nickname, gender, goals: [], chores: [] };
    const kids = [...get().kids, kid];
    set({ kids });
    saveKids(kids);
  },

  removeKid: (kidId) => {
    const kids = get().kids.filter((k) => k.id !== kidId);
    set({ kids });
    saveKids(kids);
  },

  addGoal: (kidId, name, emoji, targetAmount) => {
    const goal: Goal = { id: uid(), name, emoji, targetAmount, currentAmount: 0 };
    const kids = get().kids.map((k) =>
      k.id === kidId ? { ...k, goals: [...k.goals, goal] } : k,
    );
    set({ kids });
    saveKids(kids);
  },

  updateGoalProgress: (kidId, goalId, amount) => {
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      return {
        ...k,
        goals: k.goals.map((g) =>
          g.id === goalId
            ? { ...g, currentAmount: Math.min(g.targetAmount, Math.max(0, g.currentAmount + amount)) }
            : g,
        ),
      };
    });
    set({ kids });
    saveKids(kids);
  },

  removeGoal: (kidId, goalId) => {
    const kids = get().kids.map((k) =>
      k.id === kidId ? { ...k, goals: k.goals.filter((g) => g.id !== goalId) } : k,
    );
    set({ kids });
    saveKids(kids);
  },

  addChore: (kidId, name, value, frequency) => {
    const chore: Chore = { id: uid(), name, value, frequency, completedDates: [] };
    const kids = get().kids.map((k) =>
      k.id === kidId ? { ...k, chores: [...k.chores, chore] } : k,
    );
    set({ kids });
    saveKids(kids);
  },

  completeChore: (kidId, choreId, goalId) => {
    const date = today();
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      const chore = k.chores.find((c) => c.id === choreId);
      if (!chore) return k;
      const freq = chore.frequency ?? 'daily';
      if (getCompletedDateInPeriod(chore.completedDates, freq) !== null) return k;
      const updatedChores = k.chores.map((c) =>
        c.id === choreId ? { ...c, completedDates: [...c.completedDates, date] } : c,
      );
      const updatedGoals = k.goals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + chore.value) }
          : g,
      );
      return { ...k, chores: updatedChores, goals: updatedGoals };
    });
    set({ kids });
    saveKids(kids);
  },

  uncompleteChore: (kidId, choreId) => {
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      const chore = k.chores.find((c) => c.id === choreId);
      if (!chore) return k;
      const dateToRemove = getCompletedDateInPeriod(chore.completedDates, chore.frequency ?? 'daily');
      if (!dateToRemove) return k;
      return {
        ...k,
        chores: k.chores.map((c) =>
          c.id === choreId
            ? { ...c, completedDates: c.completedDates.filter((d) => d !== dateToRemove) }
            : c,
        ),
      };
    });
    set({ kids });
    saveKids(kids);
  },

  removeChore: (kidId, choreId) => {
    const kids = get().kids.map((k) =>
      k.id === kidId ? { ...k, chores: k.chores.filter((c) => c.id !== choreId) } : k,
    );
    set({ kids });
    saveKids(kids);
  },
}));
