import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { useUserStore } from '@/store/user.store';
import { useBudgetStore } from '@/store/budget.store';
import { useDebtStore } from '@/store/debt.store';
import { useExpensesStore } from '@/store/expenses.store';
import { useKidsStore } from '@/store/kids.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { useNetWorthStore } from '@/store/networth.store';
import { useNwSnapshotsStore } from '@/store/networth-snapshots.store';
import { useLifeEventsStore } from '@/store/life-events.store';

// One active set of listeners per session (remote → local)
const listeners: Unsubscribe[] = [];
// One active set of unsubscribes per session (local → remote)
const pushUnsubs: Array<() => void> = [];

// Guards against echo loops: while a remote snapshot is being applied to a
// local store, that store's own change-subscription must not immediately
// push the same data straight back up to Firestore.
const applyingRemote = new Set<string>();

function userDoc(uid: string, collection: string) {
  return doc(db, 'users', uid, 'data', collection);
}

const ALL_COLLECTIONS = [
  'profile', 'budget', 'debt', 'expenses', 'kids', 'goals', 'networth', 'nwSnapshots', 'lifeEvents',
] as const;

// Permanently deletes every synced document for this user. Call this — and
// await it — before deleting the Firebase Auth user, since Firestore security
// rules gate these writes on the caller being that authenticated user.
export async function deleteCloudData(uid: string) {
  stopSync();
  await Promise.all(ALL_COLLECTIONS.map((c) => deleteDoc(userDoc(uid, c))));
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export async function pushToCloud(uid: string) {
  const writes = [
    setDoc(userDoc(uid, 'profile'),     { ...snapshotUser() },       { merge: true }),
    setDoc(userDoc(uid, 'budget'),      { categories: useBudgetStore.getState().categories },            { merge: true }),
    setDoc(userDoc(uid, 'debt'),        { debts: useDebtStore.getState().debts, extraMonthly: useDebtStore.getState().extraMonthly }, { merge: true }),
    setDoc(userDoc(uid, 'expenses'),    { expenses: useExpensesStore.getState().expenses },              { merge: true }),
    setDoc(userDoc(uid, 'kids'),        { kids: useKidsStore.getState().kids },                          { merge: true }),
    setDoc(userDoc(uid, 'goals'),       { goals: useSavingsGoalsStore.getState().goals },                { merge: true }),
    setDoc(userDoc(uid, 'networth'),    { entries: useNetWorthStore.getState().entries }, { merge: true }),
    setDoc(userDoc(uid, 'nwSnapshots'), { snapshots: useNwSnapshotsStore.getState().snapshots }, { merge: true }),
    setDoc(userDoc(uid, 'lifeEvents'),  { events: useLifeEventsStore.getState().events }, { merge: true }),
  ];
  await Promise.all(writes);
}

// ── Pull from cloud (first login on new device) ───────────────────────────────

export async function pullFromCloud(uid: string): Promise<boolean> {
  const snap = await getDoc(userDoc(uid, 'profile'));
  if (!snap.exists()) return false; // No cloud data yet — first-ever login

  const [profile, budget, debt, expenses, kids, goals, networth, nwSnapshots, lifeEvents] = await Promise.all([
    getDoc(userDoc(uid, 'profile')),
    getDoc(userDoc(uid, 'budget')),
    getDoc(userDoc(uid, 'debt')),
    getDoc(userDoc(uid, 'expenses')),
    getDoc(userDoc(uid, 'kids')),
    getDoc(userDoc(uid, 'goals')),
    getDoc(userDoc(uid, 'networth')),
    getDoc(userDoc(uid, 'nwSnapshots')),
    getDoc(userDoc(uid, 'lifeEvents')),
  ]);

  if (profile.exists())     applyUser(profile.data());
  if (budget.exists())      applyRemote('budget',     () => useBudgetStore.setState({ categories: budget.data()?.categories ?? [] }));
  if (debt.exists())        applyRemote('debt',       () => useDebtStore.setState({ debts: debt.data()?.debts ?? [], extraMonthly: debt.data()?.extraMonthly ?? 0 }));
  if (expenses.exists())    applyRemote('expenses',   () => useExpensesStore.setState({ expenses: expenses.data()?.expenses ?? [] }));
  if (kids.exists())        applyRemote('kids',       () => useKidsStore.setState({ kids: kids.data()?.kids ?? [] }));
  if (goals.exists())       applyRemote('goals',      () => useSavingsGoalsStore.setState({ goals: goals.data()?.goals ?? [] }));
  if (networth.exists())    applyRemote('networth',   () => useNetWorthStore.setState({ entries: networth.data()?.entries ?? [] }));
  if (nwSnapshots.exists()) applyRemote('nwSnapshots', () => useNwSnapshotsStore.setState({ snapshots: nwSnapshots.data()?.snapshots ?? [] }));
  if (lifeEvents.exists())  applyRemote('lifeEvents', () => useLifeEventsStore.setState({ events: lifeEvents.data()?.events ?? [] }));

  return true;
}

// ── Real-time listeners (pull changes made on other devices) ──────────────────

export function startSync(uid: string) {
  stopSync();

  const collections: Array<{ key: string; apply: (data: any) => void }> = [
    { key: 'profile',    apply: applyUser },
    { key: 'budget',     apply: (d) => useBudgetStore.setState({ categories: d.categories ?? [] }) },
    { key: 'debt',       apply: (d) => useDebtStore.setState({ debts: d.debts ?? [], extraMonthly: d.extraMonthly ?? 0 }) },
    { key: 'expenses',   apply: (d) => useExpensesStore.setState({ expenses: d.expenses ?? [] }) },
    { key: 'kids',       apply: (d) => useKidsStore.setState({ kids: d.kids ?? [] }) },
    { key: 'goals',      apply: (d) => useSavingsGoalsStore.setState({ goals: d.goals ?? [] }) },
    { key: 'networth',   apply: (d) => useNetWorthStore.setState({ entries: d.entries ?? [] }) },
    { key: 'nwSnapshots', apply: (d) => useNwSnapshotsStore.setState({ snapshots: d.snapshots ?? [] }) },
    { key: 'lifeEvents', apply: (d) => useLifeEventsStore.setState({ events: d.events ?? [] }) },
  ];

  for (const { key, apply } of collections) {
    const unsub = onSnapshot(userDoc(uid, key), (snap) => {
      if (snap.exists()) applyRemote(key, () => apply(snap.data()));
    });
    listeners.push(unsub);
  }

  startAutoPush(uid);
}

export function stopSync() {
  listeners.forEach((u) => u());
  listeners.length = 0;
  pushUnsubs.forEach((u) => u());
  pushUnsubs.length = 0;
}

// Marks a collection as "currently being written from a remote snapshot" for
// one tick, so the matching local-change subscriber (below) skips pushing it
// straight back to Firestore.
function applyRemote(key: string, apply: () => void) {
  applyingRemote.add(key);
  apply();
  // Zustand's subscribe listeners fire synchronously inside setState, so the
  // flag only needs to survive that synchronous call.
  applyingRemote.delete(key);
}

// ── Auto-push (push local edits up in real time) ───────────────────────────────

function startAutoPush(uid: string) {
  const subs: Array<() => void> = [
    useBudgetStore.subscribe((state, prev) => {
      if (state.categories !== prev.categories && !applyingRemote.has('budget')) {
        syncCollection(uid, 'budget');
      }
    }),
    useDebtStore.subscribe((state, prev) => {
      if ((state.debts !== prev.debts || state.extraMonthly !== prev.extraMonthly) && !applyingRemote.has('debt')) {
        syncCollection(uid, 'debt');
      }
    }),
    useExpensesStore.subscribe((state, prev) => {
      if (state.expenses !== prev.expenses && !applyingRemote.has('expenses')) {
        syncCollection(uid, 'expenses');
      }
    }),
    useKidsStore.subscribe((state, prev) => {
      if (state.kids !== prev.kids && !applyingRemote.has('kids')) {
        syncCollection(uid, 'kids');
      }
    }),
    useSavingsGoalsStore.subscribe((state, prev) => {
      if (state.goals !== prev.goals && !applyingRemote.has('goals')) {
        syncCollection(uid, 'goals');
      }
    }),
    useNetWorthStore.subscribe((state, prev) => {
      if (state.entries !== prev.entries && !applyingRemote.has('networth')) {
        syncCollection(uid, 'networth');
      }
    }),
    useNwSnapshotsStore.subscribe((state, prev) => {
      if (state.snapshots !== prev.snapshots && !applyingRemote.has('nwSnapshots')) {
        syncCollection(uid, 'nwSnapshots');
      }
    }),
    useLifeEventsStore.subscribe((state, prev) => {
      if (state.events !== prev.events && !applyingRemote.has('lifeEvents')) {
        syncCollection(uid, 'lifeEvents');
      }
    }),
    useUserStore.subscribe((_state, _prev) => {
      if (!applyingRemote.has('profile')) {
        syncCollection(uid, 'profile');
      }
    }),
  ];
  pushUnsubs.push(...subs);
}

// ── Store write-through helpers ───────────────────────────────────────────────

function snapshotUser() {
  const s = useUserStore.getState();
  return {
    branch: s.branch ?? null,
    payGrade: s.payGrade ?? null,
    rankVariant: s.rankVariant ?? null,
    lastName: s.lastName ?? null,
    nickname: s.nickname ?? null,
    yos: s.yos,
    mhaZip: s.mhaZip ?? null,
    installationName: s.installationName ?? null,
    dutyStationId: s.dutyStationId ?? null,
    hasSpouse: s.hasSpouse,
    numChildren: s.numChildren,
    housingStatus: s.housingStatus,
    dateOfEnlistment: s.dateOfEnlistment ?? null,
    dateOfRank: s.dateOfRank ?? null,
    gsGrade: s.gsGrade ?? null,
    gsStep: s.gsStep ?? null,
    serviceStatus: s.serviceStatus ?? null,
    drillsPerMonth: s.drillsPerMonth ?? null,
    retirementDate: s.retirementDate ?? null,
    vaDisabilityPercent: s.vaDisabilityPercent ?? null,
    tspContribPct: s.tspContribPct,
    rothTspPct: s.rothTspPct,
    hasDentalFamily: s.hasDentalFamily,
    sglOptOut: s.sglOptOut,
    stateResidence: s.stateResidence ?? null,
    quickAccessIds: s.quickAccessIds,
    spouseMonthlyIncome: s.spouseMonthlyIncome,
    appTheme: s.appTheme,
    fontScale: s.fontScale,
    specialPays: s.specialPays,
    notificationsEnabled: s.notificationsEnabled,
    notificationHour: s.notificationHour,
    notificationMinute: s.notificationMinute,
    onboarded: s.onboarded,
    disclaimerAcknowledged: s.disclaimerAcknowledged,
    lesOverrides: s.lesOverrides,
    installedAt: s.installedAt ?? null,
    // proExpiresAt/proSource are deliberately NOT included here — they decide
    // Pro access, and Firestore security rules deny client writes to them on
    // this document (see firestore.rules). Only the backend (Admin SDK, which
    // bypasses rules) is allowed to set them, via /api/iap/verify or
    // /api/admin/codes/redeem. applyUser() below still pulls them down from
    // Firestore normally so a purchase made on one device reaches others.
  };
}

function applyUser(data: any) {
  useUserStore.setState({ ...data, hydrated: true });
}

// ── Single-collection write (call after any local mutation) ───────────────────

export function syncCollection(uid: string | null, collection: string) {
  if (!uid) return;
  switch (collection) {
    case 'profile':
      setDoc(userDoc(uid, 'profile'), snapshotUser(), { merge: true }).catch(() => {});
      break;
    case 'budget':
      setDoc(userDoc(uid, 'budget'), { categories: useBudgetStore.getState().categories }, { merge: true }).catch(() => {});
      break;
    case 'debt':
      setDoc(userDoc(uid, 'debt'), { debts: useDebtStore.getState().debts, extraMonthly: useDebtStore.getState().extraMonthly }, { merge: true }).catch(() => {});
      break;
    case 'expenses':
      setDoc(userDoc(uid, 'expenses'), { expenses: useExpensesStore.getState().expenses }, { merge: true }).catch(() => {});
      break;
    case 'kids':
      setDoc(userDoc(uid, 'kids'), { kids: useKidsStore.getState().kids }, { merge: true }).catch(() => {});
      break;
    case 'goals':
      setDoc(userDoc(uid, 'goals'), { goals: useSavingsGoalsStore.getState().goals }, { merge: true }).catch(() => {});
      break;
    case 'networth':
      setDoc(userDoc(uid, 'networth'), { entries: useNetWorthStore.getState().entries }, { merge: true }).catch(() => {});
      break;
    case 'nwSnapshots':
      setDoc(userDoc(uid, 'nwSnapshots'), { snapshots: useNwSnapshotsStore.getState().snapshots }, { merge: true }).catch(() => {});
      break;
    case 'lifeEvents':
      setDoc(userDoc(uid, 'lifeEvents'), { events: useLifeEventsStore.getState().events }, { merge: true }).catch(() => {});
      break;
  }
}
