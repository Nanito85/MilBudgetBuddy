import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { useUserStore } from '@/store/user.store';
import { useBudgetStore } from '@/store/budget.store';
import { useExpensesStore } from '@/store/expenses.store';
import { useKidsStore } from '@/store/kids.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { useNetWorthStore } from '@/store/networth.store';
import { useEntitlementStore } from '@/store/entitlement.store';

// One active set of listeners per session
const listeners: Unsubscribe[] = [];

function userDoc(uid: string, collection: string) {
  return doc(db, 'users', uid, 'data', collection);
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export async function pushToCloud(uid: string) {
  const writes = [
    setDoc(userDoc(uid, 'profile'),     { ...snapshotUser() },       { merge: true }),
    setDoc(userDoc(uid, 'budget'),      { categories: useBudgetStore.getState().categories },            { merge: true }),
    setDoc(userDoc(uid, 'expenses'),    { expenses: useExpensesStore.getState().expenses },              { merge: true }),
    setDoc(userDoc(uid, 'kids'),        { kids: useKidsStore.getState().kids },                          { merge: true }),
    setDoc(userDoc(uid, 'goals'),       { goals: useSavingsGoalsStore.getState().goals },                { merge: true }),
    setDoc(userDoc(uid, 'networth'),    { entries: useNetWorthStore.getState().entries }, { merge: true }),
    setDoc(userDoc(uid, 'entitlement'),  { installedAt: useEntitlementStore.getState().installedAt, status: useEntitlementStore.getState().status }, { merge: true }),
  ];
  await Promise.all(writes);
}

// ── Pull from cloud (first login on new device) ───────────────────────────────

export async function pullFromCloud(uid: string): Promise<boolean> {
  const snap = await getDoc(userDoc(uid, 'profile'));
  if (!snap.exists()) return false; // No cloud data yet — first-ever login

  const [profile, budget, expenses, kids, goals, networth, entitlement] = await Promise.all([
    getDoc(userDoc(uid, 'profile')),
    getDoc(userDoc(uid, 'budget')),
    getDoc(userDoc(uid, 'expenses')),
    getDoc(userDoc(uid, 'kids')),
    getDoc(userDoc(uid, 'goals')),
    getDoc(userDoc(uid, 'networth')),
    getDoc(userDoc(uid, 'entitlement')),
  ]);

  if (profile.exists())     applyUser(profile.data());
  if (budget.exists())      useBudgetStore.setState({ categories: budget.data()?.categories ?? [] });
  if (expenses.exists())    useExpensesStore.setState({ expenses: expenses.data()?.expenses ?? [] });
  if (kids.exists())        useKidsStore.setState({ kids: kids.data()?.kids ?? [] });
  if (goals.exists())       useSavingsGoalsStore.setState({ goals: goals.data()?.goals ?? [] });
  if (networth.exists())    useNetWorthStore.setState({ entries: networth.data()?.entries ?? [] });
  if (entitlement.exists()) useEntitlementStore.setState({ installedAt: entitlement.data()?.installedAt, status: entitlement.data()?.status ?? 'promo' });

  return true;
}

// ── Real-time listeners (sync changes from other devices) ─────────────────────

export function startSync(uid: string) {
  stopSync();

  const collections: Array<{ key: string; apply: (data: any) => void }> = [
    { key: 'profile',     apply: applyUser },
    { key: 'budget',      apply: (d) => useBudgetStore.setState({ categories: d.categories ?? [] }) },
    { key: 'expenses',    apply: (d) => useExpensesStore.setState({ expenses: d.expenses ?? [] }) },
    { key: 'kids',        apply: (d) => useKidsStore.setState({ kids: d.kids ?? [] }) },
    { key: 'goals',       apply: (d) => useSavingsGoalsStore.setState({ goals: d.goals ?? [] }) },
    { key: 'networth',    apply: (d) => useNetWorthStore.setState({ entries: d.entries ?? [] }) },
    { key: 'entitlement', apply: (d) => useEntitlementStore.setState({ installedAt: d.installedAt, status: d.status ?? 'promo' }) },
  ];

  for (const { key, apply } of collections) {
    const unsub = onSnapshot(userDoc(uid, key), (snap) => {
      if (snap.exists()) apply(snap.data());
    });
    listeners.push(unsub);
  }
}

export function stopSync() {
  listeners.forEach((u) => u());
  listeners.length = 0;
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
    hasSpouse: s.hasSpouse,
    numChildren: s.numChildren,
    tspContribPct: s.tspContribPct,
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
    case 'entitlement':
      setDoc(userDoc(uid, 'entitlement'), { installedAt: useEntitlementStore.getState().installedAt, status: useEntitlementStore.getState().status }, { merge: true }).catch(() => {});
      break;
  }
}
