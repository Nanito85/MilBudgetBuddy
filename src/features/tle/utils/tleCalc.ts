// JTR Chapter 5, Part D (TLE) and Part H (TLA)
// TLE: CONUS — up to 21 days (increased from 14, effective 27 Nov 2024 per PDTATAC MAP 66-24).
//      Days split between losing station (before departure) and gaining station (after arrival).
//      Lodging (actual cost, up to the locality's max lodging rate) and M&IE (the locality's
//      meals & incidental expenses rate) are each calculated separately at the family percentage,
//      then the two are added together — that COMBINED daily total is capped at $290/day
//      (JTR par. 050601, effective 01 OCT 2025 for FY2026, per PDTATAC MAP 66-24(R)). Lodging
//      taxes and mandatory fees count toward the $290 cap. This is a flat dollar cap, not a
//      locality-specific one — verify the current figure at travel.dod.mil before relying on it,
//      as PDTATAC revisits it periodically.
// TLA: OCONUS — up to 60 days on arrival at the new PDS (installation commander may authorize a
//      different amount; departure TLA is a separate allotment, typically up to 10 days — verify
//      locally). This calculator applies the same flat family percentage to every TLA day, with
//      no declining-percentage phase-down. CONFIRMED against a primary DTMO source: "TLA: Daily
//      M&IE and Lodging Ceiling Percentages" (DTMO Directorate of Military Compensation Policy,
//      computation guide CE-TLA-01, "Arrival TLA - TDY or Deployment (POV Travel)") keys the
//      percentage table ONLY by number of eligible persons occupying temporary lodging — there is
//      no day-range axis at all. Its worked multi-week example applies the identical percentage to
//      every day across several distinct TLA periods, with no reduction. (Fetched via the Wayback
//      Machine workaround, since travel.dod.mil blocks direct fetches — see the BAH sourcing note
//      in project memory for the same issue.) An older JTR edition apparently used a tiered
//      schedule at some point, but it is not present in current guidance. TLA has no equivalent
//      flat-dollar daily cap — it's bounded only by the locality rate.

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
  lodging: number; // locality max lodging rate, $/night
  meals: number;   // locality M&IE rate, $/day
  hasSpouse: boolean;
  childAges: number[]; // each child's age in years
  days: number;
}

export interface TLEResult {
  familyPct: number; // total % of locality per diem this family is authorized
  lodgingRaw: number; // lodging * familyPct, before the $290 combined cap
  mieRaw: number;     // meals * familyPct, before the $290 combined cap
  dailyRaw: number;   // lodgingRaw + mieRaw, before the TLE $290 cap
  lodgingPaid: number; // lodging portion of dailyTotal (scaled down proportionally if capped)
  miePaid: number;     // M&IE portion of dailyTotal (scaled down proportionally if capped)
  dailyTotal: number; // daily amount actually paid (after cap, if any) — lodgingPaid + miePaid
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
  const { mode, lodging, meals, hasSpouse, childAges, days } = inputs;

  const under12 = childAges.filter((a) => a < 12).length;
  const plus12 = childAges.filter((a) => a >= 12).length;
  const familyPct = familyPercentage(hasSpouse, childAges);

  const maxDays = mode === 'tle' ? TLE_MAX_DAYS : TLA_MAX_DAYS;
  const cappedDays = Math.min(days, maxDays);

  // Lodging and M&IE are each calculated separately at the family percentage,
  // then combined — only the combined total is subject to the $290 cap.
  const lodgingRaw = lodging * familyPct;
  const mieRaw = meals * familyPct;
  const dailyRaw = lodgingRaw + mieRaw;
  const capped = mode === 'tle' && dailyRaw > TLE_DAILY_CAP;
  const dailyTotal = capped ? TLE_DAILY_CAP : dailyRaw;

  // If the combined cap reduced the total, scale lodging and M&IE down by the
  // same ratio so the two components still sum to dailyTotal.
  const scale = capped && dailyRaw > 0 ? dailyTotal / dailyRaw : 1;
  const lodgingPaid = lodgingRaw * scale;
  const miePaid = mieRaw * scale;

  return {
    familyPct,
    lodgingRaw,
    mieRaw,
    dailyRaw,
    lodgingPaid,
    miePaid,
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
