import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_nw_snapshots';
const MAX_SNAPSHOTS = 24; // keep up to 24 monthly snapshots (~2 years)

export interface NwSnapshot {
  date: string;   // ISO "YYYY-MM-DD"
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface NwSnapshotsState {
  snapshots: NwSnapshot[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  applyRemote: (data: Pick<NwSnapshotsState, 'snapshots'>) => void;
  saveSnapshot: (assets: number, liabilities: number) => void;
  clearHistory: () => void;
}

function save(snapshots: NwSnapshot[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

export const useNwSnapshotsStore = create<NwSnapshotsState>((set, get) => ({
  snapshots: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      // Cloud data from another device landed while disk was being read —
      // it's newer than this on-device copy, so don't overwrite it.
      if (get().hydrated) return;
      const snapshots: NwSnapshot[] = raw ? JSON.parse(raw) : [];
      set({ snapshots, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  // A snapshot from the cloud (another device's edit). Saved to disk too:
  // applying it in memory only let the next hydrate() reload the older
  // on-device copy and auto-push that stale copy back over the cloud.
  applyRemote: (data) => {
    set({ ...data, hydrated: true });
    save(data.snapshots);
  },

  saveSnapshot: (assets, liabilities) => {
    const date = new Date().toISOString().slice(0, 10);
    const existing = get().snapshots;
    // Replace existing snapshot for same month, or append
    const monthKey = date.slice(0, 7);
    const filtered = existing.filter((s) => s.date.slice(0, 7) !== monthKey);
    const entry: NwSnapshot = { date, assets, liabilities, netWorth: assets - liabilities };
    const snapshots = [...filtered, entry]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-MAX_SNAPSHOTS);
    set({ snapshots });
    save(snapshots);
  },

  clearHistory: () => {
    set({ snapshots: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
