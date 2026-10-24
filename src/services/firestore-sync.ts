import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { captureError } from '@/services/sentry';
import { useUserStore } from '@/store/user.store';
import { useBudgetStore } from '@/store/budget.store';
import { useDebtStore } from '@/store/debt.store';
import { useExpensesStore } from '@/store/expenses.store';
import { useKidsStore } from '@/store/kids.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { useNetWorthStore } from '@/store/networth.store';
import { useNwSnapshotsStore } from '@/store/networth-snapshots.store';
import { useLifeEventsStore } from '@/store/life-events.store';
import { useTipsStore } from '@/store/tips.store';
import { useVaClaimsStore } from '@/store/va-claims.store';

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

// Firestore's setDoc() throws SYNCHRONOUSLY (not a rejected promise) on any
// `undefined` field value anywhere in the document, including nested inside
// objects/arrays. That throw happens before setDoc() even returns, so a
// trailing `.catch()` on the call never sees it -- it surfaces as an
// unhandled, app-crashing exception instead. Optional fields are undefined
// by default for most users (lesOverrides.bahOverride/basOverride/
// basePayOverride, specialPays[].customLabel), so this was a routine crash
// waiting to happen on nearly any profile sync, not an edge case. Every
// reader of these fields already uses `!= null` / `??`, so `null` (what
// Firestore actually stores for "no value") behaves identically to
// `undefined` did -- this just needs to happen before every setDoc() call.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = v === undefined ? null : stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

// Wraps a setDoc() call so its synchronous throw (see stripUndefined above)
// can't crash the app even if some future field slips past sanitization --
// a failed cloud sync should never take down the whole session.
// Failures are still swallowed (never crash the session) but now reported to
// Sentry — they used to vanish entirely, so a rules denial or a document that
// outgrew Firestore's size limit could silently stop sync with no signal.
function safeSetDoc(docRef: ReturnType<typeof userDoc>, data: Record<string, unknown>) {
  const report = (err: unknown) => captureError(err, { where: 'firestore-sync', doc: docRef.id });
  try {
    return setDoc(docRef, stripUndefined(data), { merge: true }).catch(report);
  } catch (err) {
    report(err);
    return Promise.resolve();
  }
}

const ALL_COLLECTIONS = [
  'profile', 'budget', 'debt', 'expenses', 'kids', 'goals', 'networth', 'nwSnapshots', 'lifeEvents', 'tips', 'vaClaims',
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
    safeSetDoc(userDoc(uid, 'profile'),     { ...snapshotUser() }),
    safeSetDoc(userDoc(uid, 'budget'),      { categories: useBudgetStore.getState().categories }),
    safeSetDoc(userDoc(uid, 'debt'),        { debts: useDebtStore.getState().debts, extraMonthly: useDebtStore.getState().extraMonthly }),
    safeSetDoc(userDoc(uid, 'expenses'),    { expenses: useExpensesStore.getState().expenses }),
    safeSetDoc(userDoc(uid, 'kids'),        { kids: useKidsStore.getState().kids }),
    safeSetDoc(userDoc(uid, 'goals'),       { goals: useSavingsGoalsStore.getState().goals }),
    safeSetDoc(userDoc(uid, 'networth'),    { entries: useNetWorthStore.getState().entries }),
    safeSetDoc(userDoc(uid, 'nwSnapshots'), { snapshots: useNwSnapshotsStore.getState().snapshots }),
    safeSetDoc(userDoc(uid, 'lifeEvents'),  { events: useLifeEventsStore.getState().events }),
    safeSetDoc(userDoc(uid, 'tips'),        { savedTipIds: useTipsStore.getState().savedTipIds }),
    safeSetDoc(userDoc(uid, 'vaClaims'),    { claims: useVaClaimsStore.getState().claims }),
  ];
  await Promise.all(writes);
}

// ── Pull from cloud (first login on new device) ───────────────────────────────

export async function pullFromCloud(uid: string): Promise<boolean> {
  const snap = await getDoc(userDoc(uid, 'profile'));
  if (!snap.exists()) return false; // No cloud data yet — first-ever login

  const [profile, budget, debt, expenses, kids, goals, networth, nwSnapshots, lifeEvents, tips, vaClaims] = await Promise.all([
    getDoc(userDoc(uid, 'profile')),
    getDoc(userDoc(uid, 'budget')),
    getDoc(userDoc(uid, 'debt')),
    getDoc(userDoc(uid, 'expenses')),
    getDoc(userDoc(uid, 'kids')),
    getDoc(userDoc(uid, 'goals')),
    getDoc(userDoc(uid, 'networth')),
    getDoc(userDoc(uid, 'nwSnapshots')),
    getDoc(userDoc(uid, 'lifeEvents')),
    getDoc(userDoc(uid, 'tips')),
    getDoc(userDoc(uid, 'vaClaims')),
  ]);

  if (profile.exists())     applyUser(profile.data());
  if (budget.exists())      applyRemote('budget',     () => useBudgetStore.getState().applyRemote({ categories: budget.data()?.categories ?? [] }));
  if (debt.exists())        applyRemote('debt',       () => useDebtStore.getState().applyRemote({ debts: debt.data()?.debts ?? [], extraMonthly: debt.data()?.extraMonthly ?? 0 }));
  if (expenses.exists())    applyRemote('expenses',   () => useExpensesStore.getState().applyRemote({ expenses: expenses.data()?.expenses ?? [] }));
  if (kids.exists())        applyRemote('kids',       () => useKidsStore.getState().applyRemote({ kids: kids.data()?.kids ?? [] }));
  if (goals.exists())       applyRemote('goals',      () => useSavingsGoalsStore.getState().applyRemote({ goals: goals.data()?.goals ?? [] }));
  if (networth.exists())    applyRemote('networth',   () => useNetWorthStore.getState().applyRemote({ entries: networth.data()?.entries ?? [] }));
  if (nwSnapshots.exists()) applyRemote('nwSnapshots', () => useNwSnapshotsStore.getState().applyRemote({ snapshots: nwSnapshots.data()?.snapshots ?? [] }));
  if (lifeEvents.exists())  applyRemote('lifeEvents', () => useLifeEventsStore.getState().applyRemote({ events: lifeEvents.data()?.events ?? [] }));
  if (tips.exists())        applyRemote('tips',       () => useTipsStore.getState().applyRemote({ savedTipIds: tips.data()?.savedTipIds ?? [] }));
  if (vaClaims.exists())    applyRemote('vaClaims',   () => useVaClaimsStore.getState().applyRemote({ claims: vaClaims.data()?.claims ?? [] }));

  return true;
}

// ── Real-time listeners (pull changes made on other devices) ──────────────────

export function startSync(uid: string) {
  stopSync();

  const collections: Array<{ key: string; apply: (data: any) => void }> = [
    { key: 'profile',    apply: applyUser },
    { key: 'budget',     apply: (d) => useBudgetStore.getState().applyRemote({ categories: d.categories ?? [] }) },
    { key: 'debt',       apply: (d) => useDebtStore.getState().applyRemote({ debts: d.debts ?? [], extraMonthly: d.extraMonthly ?? 0 }) },
    { key: 'expenses',   apply: (d) => useExpensesStore.getState().applyRemote({ expenses: d.expenses ?? [] }) },
    { key: 'kids',       apply: (d) => useKidsStore.getState().applyRemote({ kids: d.kids ?? [] }) },
    { key: 'goals',      apply: (d) => useSavingsGoalsStore.getState().applyRemote({ goals: d.goals ?? [] }) },
    { key: 'networth',   apply: (d) => useNetWorthStore.getState().applyRemote({ entries: d.entries ?? [] }) },
    { key: 'nwSnapshots', apply: (d) => useNwSnapshotsStore.getState().applyRemote({ snapshots: d.snapshots ?? [] }) },
    { key: 'lifeEvents', apply: (d) => useLifeEventsStore.getState().applyRemote({ events: d.events ?? [] }) },
    { key: 'tips',       apply: (d) => useTipsStore.getState().applyRemote({ savedTipIds: d.savedTipIds ?? [] }) },
    { key: 'vaClaims',   apply: (d) => useVaClaimsStore.getState().applyRemote({ claims: d.claims ?? [] }) },
  ];

  for (const { key, apply } of collections) {
    const unsub = onSnapshot(userDoc(uid, key), (snap) => {
      if (!snap.exists()) return;
      // Firestore fires this listener for our own local writes too, with
      // hasPendingWrites set. Re-applying that echo replaced the whole store
      // with a freshly parsed copy of data we'd just written -- a second full
      // re-render of every screen reading it (Kids, Profile) after every
      // edit, for no new information.
      if (snap.metadata.hasPendingWrites) return;
      // A local edit is still waiting out its push debounce: applying the
      // older cloud copy now would silently revert that edit, and the push
      // that follows would then upload the reverted state.
      if (pushTimers.has(key)) return;
      applyRemote(key, () => apply(snap.data()));
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
  pushTimers.forEach((t) => clearTimeout(t));
  pushTimers.clear();
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

// Trailing debounce per collection. Each store change used to fire a full
// Firestore setDoc immediately, so a burst of edits (e.g. Profile's Save,
// which calls several setters back to back) meant a burst of identical
// whole-document writes. syncCollection reads the latest store state when it
// runs, so collapsing the burst into one write loses nothing.
const PUSH_DEBOUNCE_MS = 1500;
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePush(uid: string, key: string) {
  const pending = pushTimers.get(key);
  if (pending) clearTimeout(pending);
  pushTimers.set(key, setTimeout(() => {
    pushTimers.delete(key);
    syncCollection(uid, key);
  }, PUSH_DEBOUNCE_MS));
}

// Each subscriber skips the hydrate() transition (hydrated false → true):
// loading the on-device copy from disk is not a user edit, and pushing it
// let an older disk copy overwrite newer cloud data from another device.
function startAutoPush(uid: string) {
  const subs: Array<() => void> = [
    useBudgetStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.categories !== prev.categories && !applyingRemote.has('budget')) {
        schedulePush(uid, 'budget');
      }
    }),
    useDebtStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && (state.debts !== prev.debts || state.extraMonthly !== prev.extraMonthly) && !applyingRemote.has('debt')) {
        schedulePush(uid, 'debt');
      }
    }),
    useExpensesStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.expenses !== prev.expenses && !applyingRemote.has('expenses')) {
        schedulePush(uid, 'expenses');
      }
    }),
    useKidsStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.kids !== prev.kids && !applyingRemote.has('kids')) {
        schedulePush(uid, 'kids');
      }
    }),
    useSavingsGoalsStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.goals !== prev.goals && !applyingRemote.has('goals')) {
        schedulePush(uid, 'goals');
      }
    }),
    useNetWorthStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.entries !== prev.entries && !applyingRemote.has('networth')) {
        schedulePush(uid, 'networth');
      }
    }),
    useNwSnapshotsStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.snapshots !== prev.snapshots && !applyingRemote.has('nwSnapshots')) {
        schedulePush(uid, 'nwSnapshots');
      }
    }),
    useLifeEventsStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.events !== prev.events && !applyingRemote.has('lifeEvents')) {
        schedulePush(uid, 'lifeEvents');
      }
    }),
    useUserStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && !applyingRemote.has('profile')) {
        schedulePush(uid, 'profile');
      }
    }),
    useTipsStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.savedTipIds !== prev.savedTipIds && !applyingRemote.has('tips')) {
        schedulePush(uid, 'tips');
      }
    }),
    useVaClaimsStore.subscribe((state, prev) => {
      if (state.hydrated === prev.hydrated && state.claims !== prev.claims && !applyingRemote.has('vaClaims')) {
        schedulePush(uid, 'vaClaims');
      }
    }),
  ];
  pushUnsubs.push(...subs);
}

// The full set of collection keys startAutoPush() above subscribes to —
// kept in one place so withAutoPushSuppressed() below can't silently drift
// out of sync with the subscription list the same way the old two-copies-
// of-the-store-list bug did for OHA locations.
const SYNCED_COLLECTION_KEYS = [
  'profile', 'budget', 'debt', 'expenses', 'kids', 'goals', 'networth', 'nwSnapshots', 'lifeEvents', 'tips', 'vaClaims',
];

// Exposed for resetAllLocalData() (services/reset-local-data.ts) — a local-
// only reset must NOT cascade into startAutoPush's subscribers and silently
// overwrite the signed-in user's cloud data with the freshly-reset defaults
// (that file's own doc comment says this is meant to be "purely the
// on-device data wipe," and Settings' Reset All Data / Delete Account UI
// deliberately treats them as two separate actions with different scope).
// Marks every synced collection as "applying remote" for the duration of
// `fn`, the same guard startSync() already uses for incoming snapshots, so
// the auto-push listeners skip pushing the reset up.
export function withAutoPushSuppressed<T>(fn: () => T): T {
  SYNCED_COLLECTION_KEYS.forEach((k) => applyingRemote.add(k));
  try {
    return fn();
  } finally {
    SYNCED_COLLECTION_KEYS.forEach((k) => applyingRemote.delete(k));
  }
}

// ── Store write-through helpers ───────────────────────────────────────────────

function snapshotUser() {
  const s = useUserStore.getState();
  return {
    branch: s.branch ?? null,
    financialGoal: s.financialGoal ?? null,
    hasSeenTutorial: s.hasSeenTutorial,
    greetingStyle: s.greetingStyle,
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
    gsLocalityKey: s.gsLocalityKey ?? null,
    alsoGsCivilian: s.alsoGsCivilian ?? false,
    familySeparated: s.familySeparated ?? false,
    dependentsMhaZip: s.dependentsMhaZip ?? null,
    isDeployed: s.isDeployed ?? false,
    deploymentLocationId: s.deploymentLocationId ?? null,
    serviceStatus: s.serviceStatus ?? null,
    drillsPerMonth: s.drillsPerMonth ?? null,
    reserveComponent: s.reserveComponent ?? null,
    guardDutyStatus: s.guardDutyStatus ?? null,
    guardDutyStatusUpdatedAt: s.guardDutyStatusUpdatedAt ?? null,
    reserveOnOrders: s.reserveOnOrders ?? null,
    retirementDate: s.retirementDate ?? null,
    vaDisabilityPercent: s.vaDisabilityPercent ?? null,
    sbpEnabled: s.sbpEnabled ?? false,
    sbpCoveragePct: s.sbpCoveragePct ?? null,
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
  useUserStore.getState().applyRemote(data);
}

// ── Single-collection write (call after any local mutation) ───────────────────

export function syncCollection(uid: string | null, collection: string) {
  if (!uid) return;
  switch (collection) {
    case 'profile':
      safeSetDoc(userDoc(uid, 'profile'), snapshotUser());
      break;
    case 'budget':
      safeSetDoc(userDoc(uid, 'budget'), { categories: useBudgetStore.getState().categories });
      break;
    case 'debt':
      safeSetDoc(userDoc(uid, 'debt'), { debts: useDebtStore.getState().debts, extraMonthly: useDebtStore.getState().extraMonthly });
      break;
    case 'expenses':
      safeSetDoc(userDoc(uid, 'expenses'), { expenses: useExpensesStore.getState().expenses });
      break;
    case 'kids':
      safeSetDoc(userDoc(uid, 'kids'), { kids: useKidsStore.getState().kids });
      break;
    case 'goals':
      safeSetDoc(userDoc(uid, 'goals'), { goals: useSavingsGoalsStore.getState().goals });
      break;
    case 'networth':
      safeSetDoc(userDoc(uid, 'networth'), { entries: useNetWorthStore.getState().entries });
      break;
    case 'nwSnapshots':
      safeSetDoc(userDoc(uid, 'nwSnapshots'), { snapshots: useNwSnapshotsStore.getState().snapshots });
      break;
    case 'lifeEvents':
      safeSetDoc(userDoc(uid, 'lifeEvents'), { events: useLifeEventsStore.getState().events });
      break;
    case 'tips':
      safeSetDoc(userDoc(uid, 'tips'), { savedTipIds: useTipsStore.getState().savedTipIds });
      break;
    case 'vaClaims':
      safeSetDoc(userDoc(uid, 'vaClaims'), { claims: useVaClaimsStore.getState().claims });
      break;
  }
}
