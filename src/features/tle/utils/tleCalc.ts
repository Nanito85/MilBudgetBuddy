// JTR Chapter 5, Part D (TLE) and Part H (TLA)
// TLE: CONUS — up to 10 days, member pays for lodging/meals above entitlement
// TLA: OCONUS — up to 60 days in two phases

export type MoveMode = 'tle' | 'tla';

// Per JTR: daily rate factors applied to the locality per diem
export const MEMBER_FACTOR = 0.65;
export const SPOUSE_FACTOR = 0.1625;

// JTR age-based child factors:
// Children age 12+ are entitled to a lodging share (separate room may be needed)
// Children under 12 share parent lodging — M&IE portion only (~5.42%)
export const CHILD_FACTOR_12PLUS = 0.08125;
export const CHILD_FACTOR_UNDER12 = 0.0542;

// Legacy export kept for backward compatibility (used in display labels)
export const CHILD_FACTOR = CHILD_FACTOR_12PLUS;

// TLE: max 10 days (split: 5 old station + 5 new, or all 10 at new)
export const TLE_MAX_DAYS = 10;

// TLA phases
export const TLA_PHASE1_DAYS = 30;   // days 1-30: 90% of per diem
export const TLA_PHASE2_DAYS = 30;   // days 31-60: 65% of per diem
export const TLA_MAX_DAYS    = 60;
export const TLA_PHASE1_PCT  = 0.90;
export const TLA_PHASE2_PCT  = 0.65;

export interface TLEInputs {
  mode: MoveMode;
  perDiem: number;       // full locality per diem $/day
  hasSpouse: boolean;
  childAges: number[];   // each child's age in years
  days: number;
}

export interface DailyBreakdown {
  member: number;
  spouse: number;
  children: number;      // combined total for all children
  total: number;
}

export interface TLEResult {
  dailyPhase1: DailyBreakdown;
  dailyPhase2: DailyBreakdown | null;   // only for TLA
  totalEntitlement: number;
  phase1Days: number;
  phase2Days: number;
  maxDays: number;
  childFactorSum: number;   // sum of per-child factors (for display)
  childrenUnder12: number;
  children12Plus: number;
}

function childFactorSum(ages: number[]): number {
  return ages.reduce(
    (sum, age) => sum + (age < 12 ? CHILD_FACTOR_UNDER12 : CHILD_FACTOR_12PLUS),
    0,
  );
}

function buildDaily(
  perDiem: number,
  phasePct: number,
  hasSpouse: boolean,
  childAges: number[],
): DailyBreakdown {
  const base     = perDiem * phasePct;
  const member   = base * MEMBER_FACTOR;
  const spouse   = hasSpouse ? base * SPOUSE_FACTOR : 0;
  const children = base * childFactorSum(childAges);
  return { member, spouse, children, total: member + spouse + children };
}

export function calcTLE(inputs: TLEInputs): TLEResult {
  const { mode, perDiem, hasSpouse, childAges, days } = inputs;

  const under12  = childAges.filter((a) => a < 12).length;
  const plus12   = childAges.filter((a) => a >= 12).length;
  const cfSum    = childFactorSum(childAges);

  if (mode === 'tle') {
    const capped = Math.min(days, TLE_MAX_DAYS);
    const daily  = buildDaily(perDiem, 1.0, hasSpouse, childAges);
    return {
      dailyPhase1: daily,
      dailyPhase2: null,
      totalEntitlement: daily.total * capped,
      phase1Days: capped,
      phase2Days: 0,
      maxDays: TLE_MAX_DAYS,
      childFactorSum: cfSum,
      childrenUnder12: under12,
      children12Plus: plus12,
    };
  }

  // TLA — two phases
  const cappedDays = Math.min(days, TLA_MAX_DAYS);
  const phase1Days = Math.min(cappedDays, TLA_PHASE1_DAYS);
  const phase2Days = Math.max(0, cappedDays - TLA_PHASE1_DAYS);

  const daily1 = buildDaily(perDiem, TLA_PHASE1_PCT, hasSpouse, childAges);
  const daily2 = buildDaily(perDiem, TLA_PHASE2_PCT, hasSpouse, childAges);

  const total = daily1.total * phase1Days + daily2.total * phase2Days;

  return {
    dailyPhase1: daily1,
    dailyPhase2: phase2Days > 0 ? daily2 : null,
    totalEntitlement: total,
    phase1Days,
    phase2Days,
    maxDays: TLA_MAX_DAYS,
    childFactorSum: cfSum,
    childrenUnder12: under12,
    children12Plus: plus12,
  };
}

export function familyLabel(hasSpouse: boolean, childAges: number[]): string {
  const parts: string[] = ['Member'];
  if (hasSpouse) parts.push('Spouse');
  const n = childAges.length;
  if (n === 1) parts.push('1 Child');
  if (n > 1) parts.push(`${n} Children`);
  return parts.join(' + ');
}

export function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function fmtMoneyRound(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
