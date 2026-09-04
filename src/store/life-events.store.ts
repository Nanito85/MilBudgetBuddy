import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { LifeEventType } from '@/data/life-event-checklists';

const STORAGE_KEY = 'mbb_life_events_v1';

export interface ActiveLifeEvent {
  type: LifeEventType;
  activatedAt: string; // ISO
  completedItems: string[]; // checklist item IDs
  dismissed: boolean;
}

interface LifeEventsState {
  events: ActiveLifeEvent[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  activateEvent: (type: LifeEventType) => void;
  dismissEvent: (type: LifeEventType) => void;
  toggleItem: (type: LifeEventType, itemId: string) => void;
  removeEvent: (type: LifeEventType) => void;
  resetAll: () => void;
}

function persist(events: ActiveLifeEvent[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export const useLifeEventsStore = create<LifeEventsState>((set, get) => ({
  events: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const events: ActiveLifeEvent[] = raw ? JSON.parse(raw) : [];
      set({ events, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  activateEvent: (type) => {
    const existing = get().events.find((e) => e.type === type);
    if (existing) {
      // Re-activate if dismissed
      const events = get().events.map((e) =>
        e.type === type ? { ...e, dismissed: false } : e,
      );
      set({ events });
      persist(events);
      return;
    }
    const events: ActiveLifeEvent[] = [
      ...get().events,
      { type, activatedAt: new Date().toISOString(), completedItems: [], dismissed: false },
    ];
    set({ events });
    persist(events);
  },

  dismissEvent: (type) => {
    const events = get().events.map((e) =>
      e.type === type ? { ...e, dismissed: true } : e,
    );
    set({ events });
    persist(events);
  },

  toggleItem: (type, itemId) => {
    const events = get().events.map((e) => {
      if (e.type !== type) return e;
      const already = e.completedItems.includes(itemId);
      return {
        ...e,
        completedItems: already
          ? e.completedItems.filter((id) => id !== itemId)
          : [...e.completedItems, itemId],
      };
    });
    set({ events });
    persist(events);
  },

  removeEvent: (type) => {
    const events = get().events.filter((e) => e.type !== type);
    set({ events });
    persist(events);
  },

  resetAll: () => {
    set({ events: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
