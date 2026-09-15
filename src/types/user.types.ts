import { baseOfficerGrade, PayGrade } from '@/data/bah-rates';
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
    // WO1: Navy discontinued new WO1 accessions in 1975; briefly reinstated for
    // the cyber warrant program in 2018, but per 2025 guidance no new WO1s are
    // selected FY2027+ (entry reverts to CWO2). Kept here for members who still
    // hold the WO1 grade under existing promotion guidance.
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
    W1:'WO1', // Warrant officer program reactivated 2024 (IT/cyber fields); W2-W5 not yet in active use
    O1:'2d Lt', O2:'1st Lt', O3:'Capt', O4:'Maj', O5:'Lt Col', O6:'Col', O7:'Brig Gen', O8:'Maj Gen', O9:'Lt Gen', O10:'Gen',
  },
  space_force: {
    E1:'Spc1', E2:'Spc2', E3:'Spc3', E4:'Spc4', E5:'Sgt', E6:'TSgt', E7:'MSgt', E8:'SMSgt', E9:'CMSgt',
    O1:'2d Lt', O2:'1st Lt', O3:'Capt', O4:'Maj', O5:'Lt Col', O6:'Col', O7:'Brig Gen', O8:'Maj Gen', O9:'Lt Gen', O10:'Gen',
  },
  coast_guard: {
    E1:'SR', E2:'SA', E3:'SN', E4:'PO3', E5:'PO2', E6:'PO1', E7:'CPO', E8:'SCPO', E9:'MCPO',
    // No W1/W5 — Coast Guard discontinued WO1 in 1975; entry warrant grade is CWO2
    W2:'CWO2', W3:'CWO3', W4:'CWO4',
    O1:'ENS', O2:'LTJG', O3:'LT', O4:'LCDR', O5:'CDR', O6:'CAPT', O7:'RDML', O8:'RADM', O9:'VADM',
    O10:'ADM', // Commandant/Vice Commandant only
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
  // O1E/O2E/O3E carry the same rank title as their base grade (the "E" only
  // affects basic pay) — RANK_ABBREV has no separate entries for them.
  const baseGrade = baseOfficerGrade(grade);
  return RANK_ABBREV[branch]?.[baseGrade] ?? grade;
}

export type { RankVariant };

export type ServiceStatus = 'active' | 'reserve' | 'retired' | 'civilian';

// Which Reserve Component a reservist serves in. Only meaningful when
// serviceStatus === 'reserve'. Only the Army and Air Force have a federal
// National Guard (Army National Guard, Air National Guard) — the Navy,
// Marine Corps, and Coast Guard have Reserve components only, with no Guard
// equivalent. So this field should only ever be asked/shown for branch ===
// 'army' or 'air_force'; for every other branch a reservist is necessarily
// 'reserve' and this question is not applicable (leave it undefined).
export type ReserveComponent = 'guard' | 'reserve';

export const RESERVE_COMPONENT_LABELS: Record<ReserveComponent, string> = {
  guard: 'National Guard',
  reserve: 'Reserve',
};

// For Guard members only (reserveComponent === 'guard'): what their duty
// status is RIGHT NOW. This materially changes TRICARE eligibility, SCRA
// coverage, and federal retirement-point crediting — see app/reserves.tsx.
//  'title10' — federal active duty (mobilization, AT/ADT under Title 10 orders).
//  'title32' — federal Title 32 duty: routine drill/AT, or a §502(f) call-up
//              of 30+ consecutive days under presidential/SecDef authority.
//              Both carry full federal benefits the same as Title 10 does.
//  'sad'     — State Active Duty: governor-activated and state-funded only
//              (e.g. most disaster-response callouts), with no federal
//              recognition. Does NOT carry TRICARE, SCRA, or federal
//              retirement-point credit — pay/benefits are set by the state.
//
// IMPORTANT: this is a snapshot, not a tracked history. A real Guard
// member's status routinely changes within the same year (a normal Title 32
// drill weekend, then a Title 10 AT period, then maybe a state emergency
// SAD callout) — a value set once at onboarding can go stale the moment
// orders change, and reserves.tsx would then confidently tell the member
// something no longer true. Both the onboarding question and the profile.tsx
// editor must frame this as "your status right now" (not a one-time fact)
// and make clear it should be updated whenever orders change; reserves.tsx's
// guidance copy (reserveComponentGuidance.ts) must lead with "based on what
// you've told us" rather than asserting this as an authoritative real-time
// read of the member's actual current orders.
export type GuardDutyStatus = 'title10' | 'title32' | 'sad';

export const GUARD_DUTY_STATUS_LABELS: Record<GuardDutyStatus, string> = {
  title10: 'Title 10 (Federal)',
  title32: 'Title 32 (incl. AT & routine drill)',
  sad: 'State Active Duty (SAD)',
};

export const GUARD_DUTY_STATUS_DESCRIPTIONS: Record<GuardDutyStatus, string> = {
  title10: 'Federal active duty — mobilization or AT/ADT under Title 10 orders. Full federal pay, TRICARE, SCRA, and retirement-point credit apply.',
  title32: 'Federal Title 32 duty — routine drill/annual training, or a §502(f) call-up of 30+ consecutive days. Same federal benefits as Title 10.',
  sad: 'State Active Duty — activated and paid by your governor only (e.g. most disaster-response callouts), with no federal recognition. Does not carry TRICARE, SCRA, or federal retirement-point credit.',
};

// Shared copy — this status changes month to month for a lot of Guard
// members, so both places that ask/show it (onboarding, profile.tsx) use
// this exact wording rather than each hand-typing a slightly different
// version that could drift out of sync.
export const GUARD_DUTY_STATUS_FIELD_HINT =
  'What\'s your status right now? This can change with new orders (e.g. a normal drill weekend vs. an AT period vs. a state emergency callout) — come back and update it whenever it does.';

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
  dutyStationId?: string; // Installation.id from data/installations.ts — needed to look up OHA for OCONUS stations, which have no mhaZip
  hasSpouse: boolean;
  numChildren: number;
  housingStatus: HousingStatus;
  // Service dates
  dateOfEnlistment?: string; // YYYY-MM-DD
  dateOfRank?: string;       // YYYY-MM-DD
  // Civilian GS info
  gsGrade?: number;  // 1-15
  gsStep?: number;   // 1-10
  gsLocalityKey?: string; // GSLocality.key from data/gs-pay-rates.ts, e.g. 'DC', 'RUS'
  // Reserve / Guard pay info
  drillsPerMonth?: number;   // typically 4 (one battle assembly weekend)
  reserveComponent?: ReserveComponent; // only asked for army/air_force (only branches with a Guard)
  guardDutyStatus?: GuardDutyStatus;   // only meaningful when reserveComponent === 'guard'
  // When guardDutyStatus was last set/confirmed — lets profile.tsx show a
  // "last updated" note so a value from months ago visibly looks stale
  // rather than looking as current as one set yesterday. Set automatically
  // whenever guardDutyStatus is set (onboarding or profile.tsx); cleared
  // alongside it if the member switches from Guard back to Reserve.
  guardDutyStatusUpdatedAt?: string;   // ISO 8601 timestamp
  // Retired info
  retirementDate?: string;      // YYYY-MM-DD (date of retirement)
  vaDisabilityPercent?: number; // 0-100, in 10% increments
  // Survivor Benefit Plan — an opt-in premium deducted from retired pay
  // (never active-duty pay; see lesCalc.ts). Defaults to false/undefined
  // rather than assuming every retiree elected it — SBP is a real choice
  // made at retirement, and a meaningful share of retirees decline it.
  sbpEnabled?: boolean;
  sbpCoveragePct?: number; // 0-1 (e.g. 1.0 = full retired pay), only meaningful when sbpEnabled
  // A retiree who ALSO currently works as a GS civilian employee — retired
  // pay, VA disability, and a GS paycheck are three separate, independently
  // stacking income sources for the same real person, not mutually exclusive
  // statuses. gsGrade/gsStep/gsLocalityKey above double as this income's
  // pay-setting fields.
  alsoGsCivilian?: boolean;
  // Family separation — a member stationed unaccompanied (OCONUS tour, ship
  // duty, etc.) whose dependents live elsewhere draws BAH at the DEPENDENTS'
  // location (with-dependents rate) in addition to their own OHA/BAH at their
  // own duty station (without-dependents rate), plus Family Separation
  // Allowance (FSA). See lesCalc.ts for the actual calculation.
  familySeparated?: boolean;
  dependentsMhaZip?: string; // BAH zip for where dependents actually live
  // Deployment / hazard pay — a member currently deployed to (or stationed
  // afloat/TDY in) a DoD-designated Imminent Danger Pay area draws IDP
  // ($225/mo flat) regardless of location within that area; a subset of
  // those areas are also actual Combat Zones (26 U.S.C. §112), which
  // additionally excludes basic pay from federal income tax (enlisted/WO:
  // all of it; officers: capped at E-9 max + IDP). See
  // data/deployment-locations.ts for the current designated-area list and
  // lesCalc.ts for the actual calculation. Independent of familySeparated
  // above — a single deployed member has no one to be "separated" from but
  // still draws IDP/CZTE; a member on an unaccompanied OCONUS tour draws
  // FSA but may not be in a hazard-pay area at all.
  isDeployed?: boolean;
  deploymentLocationId?: string;
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
  // Pro entitlement — access is granted through this timestamp, not a boolean,
  // since Apple/Google subscriptions remain active through the paid period even
  // after cancellation (auto-renew just turns off). null/undefined = no access.
  proExpiresAt?: string;     // ISO 8601 timestamp
  proSource?: ProSource;
  // First-hydrate timestamp, used only to distinguish a genuinely fresh
  // install from a device that already had the app before Pro gating
  // shipped (so existing users can be grandfathered in for free).
  installedAt?: string;
}

export type ProSource = 'purchase' | 'admin_code' | 'grandfather';

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
