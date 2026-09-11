import AsyncStorage from '@react-native-async-storage/async-storage';

import { withAutoPushSuppressed } from '@/services/firestore-sync';
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
 *
 * The store resets below are wrapped in withAutoPushSuppressed() because
 * "purely the on-device data wipe" above used to be aspirational, not real:
 * every resetAll() is a plain Zustand set(), which is exactly what
 * firestore-sync.ts's auto-push subscribers watch for — so for anyone
 * signed in, this used to silently push the freshly-emptied defaults
 * straight up to Firestore, wiping their cloud data (and every other device
 * synced to that account) too. That directly contradicted the deliberate
 * device-vs-cloud split described above and in Settings' own Delete Account
 * confirmation text ("Data stored on this device was not affected — use
 * Reset All Data above if you want to clear that too"). The suppression
 * makes that split actually true.
 */
export async function resetAllLocalData(): Promise<void> {
  withAutoPushSuppressed(() => {
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
  });
  // Kid Mode's PIN is SecureStore-backed and deliberately excluded from
  // sync (per-device by design), so it doesn't need the suppression above.
  await useKidModeStore.getState().resetAll();
  await AsyncStorage.clear();
}
