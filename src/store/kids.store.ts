import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { Chore, ChoreFrequency, Goal, KidGender, KidProfile, PendingCompletion } from '@/types/kids.types';

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
  updateGoal: (kidId: string, goalId: string, name: string, emoji: string, targetAmount: number, currentAmount: number) => void;
  addChore: (kidId: string, name: string, value: number, frequency: ChoreFrequency) => void;
  completeChore: (kidId: string, choreId: string, goalId: string) => void;
  uncompleteChore: (kidId: string, choreId: string, goalId?: string) => void;
  removeChore: (kidId: string, choreId: string) => void;
  submitChoreForApproval: (kidId: string, choreId: string, goalId?: string) => void;
  approveCompletion: (kidId: string, completionId: string) => void;
  rejectCompletion: (kidId: string, completionId: string) => void;
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
      const parsed: KidProfile[] = raw ? JSON.parse(raw) : [];
      // Migrate: ensure pendingCompletions exists on all kids
      const kids = parsed.map((k) => ({ ...k, pendingCompletions: k.pendingCompletions ?? [] }));
      set({ kids, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addKid: (nickname, gender) => {
    const kid: KidProfile = { id: uid(), nickname, gender, goals: [], chores: [], pendingCompletions: [] };
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

  updateGoal: (kidId, goalId, name, emoji, targetAmount, currentAmount) => {
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      return {
        ...k,
        goals: k.goals.map((g) =>
          g.id === goalId
            ? { ...g, name, emoji, targetAmount, currentAmount: Math.min(currentAmount, targetAmount) }
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

  uncompleteChore: (kidId, choreId, goalId) => {
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      const chore = k.chores.find((c) => c.id === choreId);
      if (!chore) return k;
      const dateToRemove = getCompletedDateInPeriod(chore.completedDates, chore.frequency ?? 'daily');
      if (!dateToRemove) return k;
      const updatedChores = k.chores.map((c) =>
        c.id === choreId
          ? { ...c, completedDates: c.completedDates.filter((d) => d !== dateToRemove) }
          : c,
      );
      const updatedGoals = goalId
        ? k.goals.map((g) =>
            g.id === goalId
              ? { ...g, currentAmount: Math.max(0, g.currentAmount - chore.value) }
              : g,
          )
        : k.goals;
      return { ...k, chores: updatedChores, goals: updatedGoals };
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

  submitChoreForApproval: (kidId, choreId, goalId) => {
    const date = today();
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      const chore = k.chores.find((c) => c.id === choreId);
      if (!chore) return k;
      // Already pending or done this period — skip
      const alreadyPending = (k.pendingCompletions ?? []).some((p) => p.choreId === choreId && p.submittedDate === date);
      if (alreadyPending) return k;
      if (getCompletedDateInPeriod(chore.completedDates, chore.frequency ?? 'daily') !== null) return k;
      const pending: PendingCompletion = {
        id: uid(),
        choreId,
        choreName: chore.name,
        choreValue: chore.value,
        goalId,
        submittedDate: date,
      };
      return { ...k, pendingCompletions: [...(k.pendingCompletions ?? []), pending] };
    });
    set({ kids });
    saveKids(kids);
  },

  approveCompletion: (kidId, completionId) => {
    const date = today();
    const kids = get().kids.map((k) => {
      if (k.id !== kidId) return k;
      const pending = (k.pendingCompletions ?? []).find((p) => p.id === completionId);
      if (!pending) return k;
      // Mark chore as complete
      const updatedChores = k.chores.map((c) =>
        c.id === pending.choreId ? { ...c, completedDates: [...c.completedDates, date] } : c,
      );
      // Credit goal if set
      const updatedGoals = k.goals.map((g) =>
        g.id === pending.goalId
          ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + pending.choreValue) }
          : g,
      );
      return {
        ...k,
        chores: updatedChores,
        goals: updatedGoals,
        pendingCompletions: (k.pendingCompletions ?? []).filter((p) => p.id !== completionId),
      };
    });
    set({ kids });
    saveKids(kids);
  },

  rejectCompletion: (kidId, completionId) => {
    const kids = get().kids.map((k) =>
      k.id === kidId
        ? { ...k, pendingCompletions: (k.pendingCompletions ?? []).filter((p) => p.id !== completionId) }
        : k,
    );
    set({ kids });
    saveKids(kids);
  },
}));
