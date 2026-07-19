// JTR Chapter 5, Part D (TLE) and Part H (TLA)
// TLE: CONUS — up to 21 days (increased from 14, effective 27 Nov 2024 per PDTATAC MAP 66-24).
//      Days split between losing station (before departure) and gaining station (after arrival).
//      Combined daily reimbursement (lodging + M&IE) is capped at $290/day regardless of family size.
// TLA: OCONUS — up to 60 days on arrival at the new PDS (installation commander may authorize a
//      different amount; departure TLA is a separate allotment, typically up to 10 days — verify
//      locally). No declining-percentage phase — the same flat family percentage applies every day.

export type MoveMode = 'tle' | 'tla';

// JTR family-size percentage table (JTR Ch. 5, applies to both TLE and TLA):
//   Member alone, no dependents:                 65%
//   Member + first dependent (any age/type):     100% flat (also applies to 2 dependents alone)
//   Each ADDITIONAL dependent age 12 or older:    +35%
//   Each ADDITIONAL dependent under age 12:       +25%
// The percentage applies to both the locality lodging ceiling and the locality M&IE rate.
export const MEMBER_ALONE_PCT = 0.65;
export const FIRST_DEPENDENT_PCT = 1.0;
export const ADDITIONAL_DEPENDENT_12PLUS_PCT = 0.35;
export const ADDITIONAL_DEPENDENT_UNDER12_PCT = 0.25;

export const TLE_MAX_DAYS = 21;
export const TLE_DAILY_CAP = 290; // combined lodging + M&IE, per JTR par. 0506

export const TLA_MAX_DAYS = 60;

export interface TLEInputs {
  mode: MoveMode;
  perDiem: number; // full locality per diem $/day (lodging + M&IE)
  hasSpouse: boolean;
  childAges: number[]; // each child's age in years
  days: number;
}

export interface TLEResult {
  familyPct: number; // total % of locality per diem this family is authorized
  dailyRaw: number; // perDiem * familyPct, before the TLE $290 cap
  dailyTotal: number; // daily amount actually paid (after cap, if any)
  capped: boolean; // true if the $290/day cap reduced the amount
  totalEntitlement: number;
  days: number; // days actually paid (capped to maxDays)
  maxDays: number;
  childrenUnder12: number;
  children12Plus: number;
}

// The first dependent (spouse if present, otherwise the first child) is absorbed into the
// flat 100% baseline and does not add its own percentage. Every dependent after that adds
// its own age-based increment. This matches the "member + 1 dependent = 100%" JTR rule.
export function familyPercentage(hasSpouse: boolean, childAges: number[]): number {
  const dependents: Array<'adult' | '12plus' | 'under12'> = [];
  if (hasSpouse) dependents.push('adult');
  for (const age of childAges) dependents.push(age >= 12 ? '12plus' : 'under12');

  if (dependents.length === 0) return MEMBER_ALONE_PCT;

  const additional = dependents.slice(1);
  const extra = additional.reduce(
    (sum, d) => sum + (d === 'under12' ? ADDITIONAL_DEPENDENT_UNDER12_PCT : ADDITIONAL_DEPENDENT_12PLUS_PCT),
    0,
  );
  return FIRST_DEPENDENT_PCT + extra;
}

export function calcTLE(inputs: TLEInputs): TLEResult {
  const { mode, perDiem, hasSpouse, childAges, days } = inputs;

  const under12 = childAges.filter((a) => a < 12).length;
  const plus12 = childAges.filter((a) => a >= 12).length;
  const familyPct = familyPercentage(hasSpouse, childAges);

  const maxDays = mode === 'tle' ? TLE_MAX_DAYS : TLA_MAX_DAYS;
  const cappedDays = Math.min(days, maxDays);

  const dailyRaw = perDiem * familyPct;
  const capped = mode === 'tle' && dailyRaw > TLE_DAILY_CAP;
  const dailyTotal = capped ? TLE_DAILY_CAP : dailyRaw;

  return {
    familyPct,
    dailyRaw,
    dailyTotal,
    capped,
    totalEntitlement: dailyTotal * cappedDays,
    days: cappedDays,
    maxDays,
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
