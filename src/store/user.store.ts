import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { PayGrade } from '@/data/bah-rates';
import { MilitaryBranch, RankVariant, SpecialPay, SpecialPayType, UserPreferences } from '@/types/user.types';

const STORAGE_KEY = 'mbb_user_prefs';

const DEFAULTS: UserPreferences = {
  branch: undefined,
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
  onboarded: false,
  disclaimerAcknowledged: false,
  specialPays: [],
  spouseMonthlyIncome: 0,
  payGrade: undefined,
  rankVariant: undefined,
  lastName: undefined,
  nickname: undefined,
  yos: 0,
  mhaZip: undefined,
  hasSpouse: false,
  numChildren: 0,
  tspContribPct: 5,
  hasDentalFamily: false,
  sglOptOut: false,
  stateResidence: undefined,
  quickAccessIds: ['budget', 'credit', 'pcs', 'va_loan'],
};

interface UserState extends UserPreferences {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setBranch: (branch: MilitaryBranch) => void;
  setRankVariant: (variant: RankVariant) => void;
  setNotifications: (enabled: boolean) => void;
  setNotificationTime: (hour: number, minute: number) => void;
  setOnboarded: () => void;
  setDisclaimerAcknowledged: () => void;
  setServiceInfo: (payGrade: PayGrade, lastName: string, nickname: string, yos: number) => void;
  setLocationFamily: (mhaZip: string, hasSpouse: boolean, numChildren: number) => void;
  setPaySetup: (tspContribPct: number, hasDentalFamily: boolean, sglOptOut: boolean) => void;
  setStateResidence: (stateCode: string) => void;
  addSpecialPay: (type: SpecialPayType, monthlyAmount: number, customLabel?: string) => void;
  removeSpecialPay: (id: string) => void;
  setQuickAccessIds: (ids: string[]) => void;
  setSpouseMonthlyIncome: (amount: number) => void;
}

function save(prefs: UserPreferences) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function snapshot(get: () => UserState): UserPreferences {
  const s = get();
  return {
    branch: s.branch,
    notificationsEnabled: s.notificationsEnabled,
    notificationHour: s.notificationHour,
    notificationMinute: s.notificationMinute,
    onboarded: s.onboarded,
    disclaimerAcknowledged: s.disclaimerAcknowledged,
    specialPays: s.specialPays,
    payGrade: s.payGrade,
    rankVariant: s.rankVariant,
    lastName: s.lastName,
    nickname: s.nickname,
    yos: s.yos,
    mhaZip: s.mhaZip,
    hasSpouse: s.hasSpouse,
    numChildren: s.numChildren,
    tspContribPct: s.tspContribPct,
    hasDentalFamily: s.hasDentalFamily,
    sglOptOut: s.sglOptOut,
    stateResidence: s.stateResidence,
    quickAccessIds: s.quickAccessIds,
    spouseMonthlyIncome: s.spouseMonthlyIncome,
  };
}

export const useUserStore = create<UserState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const prefs: Partial<UserPreferences> = raw ? JSON.parse(raw) : {};
      set({ ...DEFAULTS, ...prefs, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setBranch: (branch) => {
    set({ branch });
    save({ ...snapshot(get), branch });
  },

  setRankVariant: (rankVariant) => {
    set({ rankVariant });
    save({ ...snapshot(get), rankVariant });
  },

  setNotifications: (notificationsEnabled) => {
    set({ notificationsEnabled });
    save({ ...snapshot(get), notificationsEnabled });
  },

  setNotificationTime: (notificationHour, notificationMinute) => {
    set({ notificationHour, notificationMinute });
    save({ ...snapshot(get), notificationHour, notificationMinute });
  },

  setOnboarded: () => {
    set({ onboarded: true });
    save({ ...snapshot(get), onboarded: true });
  },

  setDisclaimerAcknowledged: () => {
    set({ disclaimerAcknowledged: true });
    save({ ...snapshot(get), disclaimerAcknowledged: true });
  },

  setServiceInfo: (payGrade, lastName, nickname, yos) => {
    set({ payGrade, lastName, nickname, yos, rankVariant: 'default' });
    save({ ...snapshot(get), payGrade, lastName, nickname, yos, rankVariant: 'default' });
  },

  setLocationFamily: (mhaZip, hasSpouse, numChildren) => {
    set({ mhaZip, hasSpouse, numChildren });
    save({ ...snapshot(get), mhaZip, hasSpouse, numChildren });
  },

  setPaySetup: (tspContribPct, hasDentalFamily, sglOptOut) => {
    set({ tspContribPct, hasDentalFamily, sglOptOut });
    save({ ...snapshot(get), tspContribPct, hasDentalFamily, sglOptOut });
  },

  setStateResidence: (stateResidence) => {
    set({ stateResidence });
    save({ ...snapshot(get), stateResidence });
  },

  addSpecialPay: (type, monthlyAmount, customLabel) => {
    const newPay: SpecialPay = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      monthlyAmount,
      customLabel,
    };
    const specialPays = [...get().specialPays, newPay];
    set({ specialPays });
    save({ ...snapshot(get), specialPays });
  },

  removeSpecialPay: (id) => {
    const specialPays = get().specialPays.filter((p) => p.id !== id);
    set({ specialPays });
    save({ ...snapshot(get), specialPays });
  },

  setQuickAccessIds: (quickAccessIds) => {
    set({ quickAccessIds });
    save({ ...snapshot(get), quickAccessIds });
  },

  setSpouseMonthlyIncome: (spouseMonthlyIncome) => {
    set({ spouseMonthlyIncome });
    save({ ...snapshot(get), spouseMonthlyIncome });
  },
}));
