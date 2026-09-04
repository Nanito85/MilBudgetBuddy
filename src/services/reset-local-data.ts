import AsyncStorage from '@react-native-async-storage/async-storage';

import { useBudgetStore } from '@/store/budget.store';
import { useDebtStore } from '@/store/debt.store';
import { useExpensesStore } from '@/store/expenses.store';
import { useKidModeStore } from '@/store/kid-mode.store';
import { useKidsStore } from '@/store/kids.store';
import { useLifeEventsStore } from '@/store/life-events.store';
import { useNetWorthStore } from '@/store/networth.store';
import { useNwSnapshotsStore } from '@/store/networth-snapshots.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { useTipsStore } from '@/store/tips.store';
import { useUserStore } from '@/store/user.store';

/**
 * Wipes every locally-persisted store, then AsyncStorage.clear() as a final
 * catch-all (in case a future store gets added here and someone forgets to
 * list it below — the same kind of drift-between-two-lists bug that broke
 * OHA location lookups). Used by both profile.tsx's "Reset All App Data" and
 * legal.tsx's "Delete Account" flows — previously each maintained its own
 * separate copy of this store list, which is exactly how a store added to
 * one could silently be missing from the other.
 *
 * Does NOT touch auth.store.ts (signing out / deleting the Firebase account
 * is a separate, deliberate step the caller is responsible for) — this is
 * purely the on-device data wipe.
 */
export async function resetAllLocalData(): Promise<void> {
  useUserStore.getState().resetAll();
  useTipsStore.getState().resetAll();
  useBudgetStore.getState().resetAll();
  useDebtStore.getState().resetAll();
  useNetWorthStore.getState().resetAll();
  useNwSnapshotsStore.getState().clearHistory();
  useSavingsGoalsStore.getState().resetAll();
  useExpensesStore.getState().resetAll();
  useKidsStore.getState().resetAll();
  useLifeEventsStore.getState().resetAll();
  await useKidModeStore.getState().resetAll();
  await AsyncStorage.clear();
}
