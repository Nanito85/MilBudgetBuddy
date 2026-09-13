import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'mbb_va_claims';

export type ClaimType = 'initial' | 'increase' | 'appeal' | 'hlr' | 'supplemental' | 'bdd';

export type ClaimStage =
  | 'intent_filed'
  | 'claim_filed'
  | 'exam_scheduled'
  | 'exam_complete'
  | 'under_review'
  | 'decision'
  | 'appealing';

export const CLAIM_STAGES: { value: ClaimStage; label: string }[] = [
  { value: 'intent_filed',   label: 'Intent to File' },
  { value: 'claim_filed',    label: 'Claim Filed' },
  { value: 'exam_scheduled', label: 'C&P Exam Scheduled' },
  { value: 'exam_complete',  label: 'Exam Completed' },
  { value: 'under_review',   label: 'Under Review' },
  { value: 'decision',       label: 'Decision Received' },
  { value: 'appealing',      label: 'Appeal Filed' },
];

export const CLAIM_TYPES: { value: ClaimType; label: string }[] = [
  { value: 'initial',      label: 'Initial Claim' },
  { value: 'increase',     label: 'Increase' },
  { value: 'bdd',          label: 'BDD (Pre-Discharge)' },
  { value: 'hlr',          label: 'Higher-Level Review' },
  { value: 'supplemental', label: 'Supplemental Claim' },
  { value: 'appeal',       label: 'Board Appeal' },
];

export interface VaClaim {
  id: string;
  label: string;          // e.g. "Lower back / lumbar strain" or "Tinnitus - increase"
  claimType: ClaimType;
  stage: ClaimStage;
  dateFiled?: string;     // ISO date the claim/intent was filed
  examDate?: string;      // ISO date of C&P exam
  decisionDate?: string;  // ISO date the decision letter arrived
  effectiveDate?: string; // ISO date benefits become effective (back-pay date)
  ratingAwarded?: number; // percent, once a decision is received
  notes?: string;
  createdAt: string;
}

interface VaClaimsState {
  claims: VaClaim[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addClaim: (claim: Omit<VaClaim, 'id' | 'createdAt'>) => void;
  updateClaim: (id: string, partial: Partial<Omit<VaClaim, 'id' | 'createdAt'>>) => void;
  removeClaim: (id: string) => void;
  resetAll: () => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function persist(claims: VaClaim[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

export const useVaClaimsStore = create<VaClaimsState>((set, get) => ({
  claims: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const claims: VaClaim[] = raw ? JSON.parse(raw) : [];
      set({ claims, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addClaim: (claim) => {
    const claims = [...get().claims, { ...claim, id: uid(), createdAt: new Date().toISOString() }];
    set({ claims });
    persist(claims);
  },

  updateClaim: (id, partial) => {
    const claims = get().claims.map((c) => (c.id === id ? { ...c, ...partial } : c));
    set({ claims });
    persist(claims);
  },

  removeClaim: (id) => {
    const claims = get().claims.filter((c) => c.id !== id);
    set({ claims });
    persist(claims);
  },

  resetAll: () => {
    set({ claims: [] });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
