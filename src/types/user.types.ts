import { PayGrade } from '@/data/bah-rates';
import { RankVariant, getVariantAbbrev } from '@/data/rank-insignia';

export type MilitaryBranch =
  | 'army'
  | 'navy'
  | 'marines'
  | 'air_force'
  | 'space_force'
  | 'coast_guard'
  | 'other';

export const BRANCH_LABELS: Record<MilitaryBranch, string> = {
  army: 'Army',
  navy: 'Navy',
  marines: 'Marine Corps',
  air_force: 'Air Force',
  space_force: 'Space Force',
  coast_guard: 'Coast Guard',
  other: 'Other / Civilian',
};

export const BRANCH_COLORS: Record<MilitaryBranch, string> = {
  army: '#4A7C59',
  navy: '#003087',
  marines: '#B22234',
  air_force: '#00308F',
  space_force: '#1C2951',
  coast_guard: '#005C99',
  other: '#555555',
};

// Rank abbreviations per branch and pay grade
export const RANK_ABBREV: Record<MilitaryBranch, Partial<Record<PayGrade, string>>> = {
  army: {
    E1:'PVT', E2:'PV2', E3:'PFC', E4:'SPC', E5:'SGT', E6:'SSG', E7:'SFC', E8:'MSG', E9:'SGM',
    W1:'WO1', W2:'CW2', W3:'CW3', W4:'CW4', W5:'CW5',
    O1:'2LT', O2:'1LT', O3:'CPT', O4:'MAJ', O5:'LTC', O6:'COL', O7:'BG', O8:'MG', O9:'LTG', O10:'GEN',
  },
  navy: {
    E1:'SR', E2:'SA', E3:'SN', E4:'PO3', E5:'PO2', E6:'PO1', E7:'CPO', E8:'SCPO', E9:'MCPO',
    W1:'WO1', W2:'CWO2', W3:'CWO3', W4:'CWO4', W5:'CWO5',
    O1:'ENS', O2:'LTJG', O3:'LT', O4:'LCDR', O5:'CDR', O6:'CAPT', O7:'RDML', O8:'RADM', O9:'VADM', O10:'ADM',
  },
  marines: {
    E1:'Pvt', E2:'PFC', E3:'LCpl', E4:'Cpl', E5:'Sgt', E6:'SSgt', E7:'GySgt', E8:'MSgt', E9:'MGySgt',
    W1:'WO1', W2:'CWO2', W3:'CWO3', W4:'CWO4', W5:'CWO5',
    O1:'2ndLt', O2:'1stLt', O3:'Capt', O4:'Maj', O5:'LtCol', O6:'Col', O7:'BGen', O8:'MajGen', O9:'LtGen', O10:'Gen',
  },
  air_force: {
    E1:'AB', E2:'Amn', E3:'A1C', E4:'SrA', E5:'SSgt', E6:'TSgt', E7:'MSgt', E8:'SMSgt', E9:'CMSgt',
    O1:'2d Lt', O2:'1st Lt', O3:'Capt', O4:'Maj', O5:'Lt Col', O6:'Col', O7:'Brig Gen', O8:'Maj Gen', O9:'Lt Gen', O10:'Gen',
  },
  space_force: {
    E1:'Spc1', E2:'Spc2', E3:'Spc3', E4:'Spc4', E5:'Sgt', E6:'TSgt', E7:'MSgt', E8:'SMSgt', E9:'CMSgt',
    O1:'2d Lt', O2:'1st Lt', O3:'Capt', O4:'Maj', O5:'Lt Col', O6:'Col', O7:'Brig Gen', O8:'Maj Gen', O9:'Lt Gen', O10:'Gen',
  },
  coast_guard: {
    E1:'SR', E2:'SA', E3:'SN', E4:'PO3', E5:'PO2', E6:'PO1', E7:'CPO', E8:'SCPO', E9:'MCPO',
    W1:'WO', W2:'CWO2', W3:'CWO3', W4:'CWO4',
    O1:'ENS', O2:'LTJG', O3:'LT', O4:'LCDR', O5:'CDR', O6:'CAPT', O7:'RDML', O8:'RADM', O9:'VADM',
  },
  other: {},
};

export function getRankAbbrev(
  branch: MilitaryBranch | undefined,
  grade: PayGrade | undefined,
  variant?: RankVariant,
): string {
  if (!branch || !grade) return grade ?? '';
  if (variant && variant !== 'default') {
    const va = getVariantAbbrev(branch, grade, variant);
    if (va) return va;
  }
  return RANK_ABBREV[branch]?.[grade] ?? grade;
}

export type { RankVariant };

export type ServiceStatus = 'active' | 'reserve' | 'retired' | 'civilian';

// Where the member currently lives — determines their actual BAH entitlement.
// 'off_base'              → full BAH (with or without dependents) based on rank/MHA
// 'barracks'               → Partial BAH only (flat $50.10/mo); government single-type
//                            quarters, no dependents
// 'on_base_family_housing' → no BAH; housing is provided in-kind
export type HousingStatus = 'off_base' | 'barracks' | 'on_base_family_housing';

export const HOUSING_STATUS_LABELS: Record<HousingStatus, string> = {
  off_base: 'Off base (renting or own home)',
  barracks: 'Barracks / single government quarters',
  on_base_family_housing: 'On-base family housing (government quarters)',
};

export const HOUSING_STATUS_DESCRIPTIONS: Record<HousingStatus, string> = {
  off_base: 'You receive full BAH based on your rank, dependency status, and duty station.',
  barracks: 'You receive Partial BAH only — a flat $50.10/month, regardless of rank or location.',
  on_base_family_housing: 'You receive no BAH — housing is provided in place of the allowance.',
};

export type FinancialGoal =
  | 'save_money'
  | 'pay_debt'
  | 'pcs_planning'
  | 'retirement'
  | 'family_budgeting'
  | 'emergency_fund';

export const FINANCIAL_GOAL_LABELS: Record<FinancialGoal, string> = {
  save_money: 'Save Money',
  pay_debt: 'Pay Off Debt',
  pcs_planning: 'PCS Planning',
  retirement: 'Retirement',
  family_budgeting: 'Family Budgeting',
  emergency_fund: 'Emergency Fund',
};

export const FINANCIAL_GOAL_ICONS: Record<FinancialGoal, string> = {
  save_money: '💰',
  pay_debt: '📉',
  pcs_planning: '📦',
  retirement: '🎖️',
  family_budgeting: '👨‍👩‍👧‍👦',
  emergency_fund: '🛡️',
};

export interface UserPreferences {
  branch?: MilitaryBranch;
  serviceStatus?: ServiceStatus;
  financialGoal?: FinancialGoal;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
  onboarded: boolean;
  disclaimerAcknowledged: boolean;
  hasSeenTutorial: boolean;
  specialPays: SpecialPay[];
  // Service identity
  payGrade?: PayGrade;
  rankVariant?: RankVariant;
  lastName?: string;
  nickname?: string;
  yos: number;
  // Location & family
  mhaZip?: string;
  installationName?: string;
  hasSpouse: boolean;
  numChildren: number;
  housingStatus: HousingStatus;
  // Service dates
  dateOfEnlistment?: string; // YYYY-MM-DD
  dateOfRank?: string;       // YYYY-MM-DD
  // Civilian GS info
  gsGrade?: number;  // 1-15
  gsStep?: number;   // 1-10
  // Reserve / Guard pay info
  drillsPerMonth?: number;   // typically 4 (one battle assembly weekend)
  // Retired info
  retirementDate?: string;      // YYYY-MM-DD (date of retirement)
  vaDisabilityPercent?: number; // 0-100, in 10% increments
  // Pay setup
  tspContribPct: number;   // Traditional TSP contribution %
  rothTspPct: number;      // Roth TSP contribution %
  hasDentalFamily: boolean;
  sglOptOut: boolean;
  // State residence (for state income tax estimate)
  stateResidence?: string; // 2-letter state code, e.g. 'TX'
  // Spouse / household income (optional, for combined take-home display)
  spouseMonthlyIncome: number;
  // Home screen quick-access tile IDs (4 items)
  quickAccessIds: string[];
  // Greeting preference
  greetingStyle: 'rank' | 'nickname';
  // Appearance
  appTheme: 'dark' | 'light';
  fontScale: number; // 1.0 | 1.15 | 1.3 | 1.5
  // LES manual overrides
  lesOverrides: LESOverrides;
}

// ─── LES Manual Overrides ─────────────────────────────────────────────────────

export interface LESLineItem {
  id: string;
  label: string;
  amount: number; // monthly $
}

export interface LESOverrides {
  bahOverride?: number;    // actual BAH from LES (overrides calculated)
  basOverride?: number;    // actual BAS if different
  basePayOverride?: number; // actual base pay if different
  extraIncome: LESLineItem[];      // OHA, clothing, COLA, FSA, etc.
  extraDeductions: LESLineItem[];  // BOP, allotments, etc.
}

// ─── Special Pays ─────────────────────────────────────────────────────────────

export type SpecialPayType =
  | 'language'
  | 'aviation_acip'
  | 'submarine'
  | 'diving'
  | 'parachute'
  | 'sdap'
  | 'hazardous_hdip'
  | 'sea_pay'
  | 'hostile_fire'
  | 'nuclear'
  | 'foreign_language_bonus'
  | 'assignment_incentive'
  | 'other';

export interface SpecialPay {
  id: string;
  type: SpecialPayType;
  monthlyAmount: number;
  customLabel?: string;
}

export const SPECIAL_PAY_LABELS: Record<SpecialPayType, string> = {
  language: 'Language Proficiency Pay',
  aviation_acip: 'Aviation Career Incentive Pay (ACIP)',
  submarine: 'Submarine Pay',
  diving: 'Diving Duty Pay',
  parachute: 'Parachute / Jump Pay',
  sdap: 'Special Duty Assignment Pay (SDAP)',
  hazardous_hdip: 'Hazardous Duty Incentive Pay (HDIP)',
  sea_pay: 'Career Sea Pay',
  hostile_fire: 'Hostile Fire / Imminent Danger Pay',
  nuclear: 'Nuclear Officer Pay',
  foreign_language_bonus: 'Foreign Language Proficiency Bonus',
  assignment_incentive: 'Assignment Incentive Pay (AIP)',
  other: 'Other Special Pay',
};

export const SPECIAL_PAY_RANGES: Record<SpecialPayType, string> = {
  language: 'up to $500/mo',
  aviation_acip: '$125–$1,000/mo',
  submarine: '$75–$835/mo',
  diving: '$240/mo',
  parachute: '$150/mo',
  sdap: '$75–$600/mo',
  hazardous_hdip: '$150–$250/mo',
  sea_pay: '$100–$805/mo',
  hostile_fire: '$225/mo',
  nuclear: '$170–$1,000/mo',
  foreign_language_bonus: '$50–$1,000/mo',
  assignment_incentive: 'varies',
  other: 'varies',
};
