import { BAH_PARTIAL, getBahRate, PayGrade } from '@/data/bah-rates';
import { getBAS } from '@/data/bas-rates';
import { getBasicPay, getHigh3Average } from '@/data/basic-pay-rates';
import { estimateAnnualFedTax, FICA_RATE } from '@/data/federal-tax';
import { getGSMonthly } from '@/data/gs-pay-rates';
import { getOhaAreaForInstallation, getOhaRate } from '@/data/oha-rates';
import { getRetirementStateTaxRate, getStateTaxRate } from '@/data/state-tax';
import { HousingStatus, LESOverrides, ServiceStatus } from '@/types/user.types';

// Family Separation Allowance — flat monthly rate, effective January 1, 2026
// (raised from $250 to $300 by the FY2026 NDAA, signed into law 2025-12-18).
// Applies to a member involuntarily separated from dependents by military
// orders: unaccompanied OCONUS tours (FSA-R, no minimum duration) and
// shipboard/TDY separations exceeding 30 continuous days (FSA-S/FSA-T).
// Source: militarypay.defense.gov/pay/allowances/fsa.aspx
export const FSA_MONTHLY = 300;

// SGLI: $0.05/month per $1,000 × $500,000 coverage = $25.00 + $1.00 TSGLI = $26.00
// Source: DFAS SGLI rates — dfas.mil/MilitaryMembers/payentitlements/SGLI
export const SGLI_MONTHLY = 26;      // $500k coverage (effective July 1, 2025 rate)

// TDP (TRICARE Dental Program) family premium — TDP has just two sponsor
// tiers, E4-and-below vs E5-and-above (which includes warrant officers and
// officers). This used to be a single flat E5+ number applied to every
// grade, overstating the deduction by ~$7.62/mo (33%) for E1-E4 sponsors —
// exactly the population this app's benchmarks elsewhere are most careful
// about. Source: tricare.mil/Costs/DentalCosts/TDP/Premiums, Mar 2026-Feb 2027.
export const DENTAL_FAMILY_E4_BELOW = 22.85;
export const DENTAL_FAMILY_E5_ABOVE = 30.47;
const DENTAL_LOWER_TIER_GRADES = new Set(['E1', 'E2', 'E3', 'E4']);

export function dentalFamilyRate(grade: string): number {
  return DENTAL_LOWER_TIER_GRADES.has(grade) ? DENTAL_FAMILY_E4_BELOW : DENTAL_FAMILY_E5_ABOVE;
}

// Federal income tax estimate — base pay only (allowances not taxable).
// Bracket table lives in data/federal-tax.ts (single source of truth —
// see that file's header for why this used to be its own hand-maintained
// copy of the brackets).
function estimateFedTax(annualBasePay: number, married: boolean): number {
  return estimateAnnualFedTax(annualBasePay, married) / 12;
}

export interface LESBreakdown {
  // Gross
  basePay: number;
  bah: number;
  bas: number;
  specialPays: number;
  extraIncome: number;
  grossPay: number;
  // Deductions
  fica: number;
  fedTax: number;
  stateTax: number;
  tsp: number;           // total TSP (traditional + roth)
  traditionalTsp: number;
  rothTsp: number;
  sgli: number;
  dental: number;
  extraDeductions: number;
  totalDeductions: number;
  // Net
  netPay: number;
  // Override flags (for display)
  bahOverridden: boolean;
  basOverridden: boolean;
  basePayOverridden: boolean;
  extraIncomeItems: { id: string; label: string; amount: number }[];
  extraDeductionItems: { id: string; label: string; amount: number }[];
  // True when `bah` is actually an OHA estimate (OCONUS duty station with no
  // BAH-eligible mhaZip). Lets the UI relabel the line item accordingly.
  isOha: boolean;
  ohaApproximate: boolean;
  // True when `basePay` is retired pay (High-3 legacy formula) rather than
  // active-duty basic pay — lets the UI relabel "BASE PAY" and hide the
  // (always-zero, unless overridden) BAH/BAS rows for a retired member.
  isRetiredPay: boolean;
  retiredPayPct: number; // 0-100, e.g. 50 at exactly 20 YOS — for display only
  // True when family-separation pay applies (member stationed unaccompanied,
  // e.g. an OCONUS tour or sea duty, with dependents living elsewhere).
  familySeparated: boolean;
  familyBah: number;       // with-dependents BAH at the dependents' actual location
  familyBahResolved: boolean; // false if dependentsMhaZip didn't resolve to real BAH data
  fsa: number;              // Family Separation Allowance, flat rate
  // GS civilian pay stacked onto this budget — either a pure civilian
  // (serviceStatus === 'civilian') or a retiree who also currently works a
  // GS job. Both cases use the same fields.
  alsoGsCivilian: boolean;
  gsGrossMonthly: number;
  gsFica: number;
}

export interface LESInputs {
  payGrade: string;
  yos: number;
  mhaZip: string | undefined;
  dutyStationId?: string; // used to resolve OHA when mhaZip is unset (OCONUS station)
  hasSpouse: boolean;
  housingStatus?: HousingStatus; // defaults to 'off_base' (full BAH) if omitted
  specialPaysTotal: number;
  tspContribPct: number;   // Traditional TSP %
  rothTspPct?: number;     // Roth TSP % (optional, defaults to 0)
  hasDentalFamily: boolean;
  sglOptOut: boolean;
  stateResidence?: string;
  overrides?: LESOverrides;
  // 'retired' switches basePay from active-duty basic pay to retired pay
  // (see retiredPayMultiplier) and zeroes BAH/BAS/FICA — a retiree draws a
  // pension, not an active-duty paycheck. Omitted/other statuses behave
  // exactly as before.
  serviceStatus?: ServiceStatus;
  // Family separation: member's own housing switches to the without-dependents
  // rate, and a second with-dependents BAH is added at the dependents' actual
  // location, plus flat FSA. Only meaningful with hasSpouse (or a dependent) —
  // there's no one to be "separated from" otherwise. Never applies to a
  // retiree (retirees draw no BAH/OHA/FSA at all).
  familySeparated?: boolean;
  dependentsMhaZip?: string;
  // GS civilian pay stacks onto this budget for a pure civilian
  // (serviceStatus === 'civilian') or a retiree who's ALSO currently working
  // a GS job (alsoGsCivilian). Both paths use the same three fields.
  alsoGsCivilian?: boolean;
  gsGrade?: number;
  gsStep?: number;
  gsLocalityKey?: string;
}

interface HousingResult {
  amount: number;
  isOha: boolean;
  approximate: boolean;
}

// Full BAH only applies off base. Barracks residents (no dependents, government
// single-type quarters) get flat Partial BAH; on-base family housing residents
// get no BAH — housing is provided in-kind. Per JTR Ch. 10. OCONUS stations have
// no mhaZip (BAH doesn't apply overseas) — they draw OHA instead, resolved from
// the duty station's installation id. On-base family housing OCONUS also gets no
// OHA (government housing provided in-kind); OCONUS "barracks"/unaccompanied
// government quarters get no OHA either — Partial OHA is a distinct, much
// smaller stipend this app doesn't have data for, so 0 is shown rather than a
// wrong number borrowed from the CONUS BAH_PARTIAL table.
function resolveHousing(
  mhaZip: string | undefined,
  dutyStationId: string | undefined,
  payGrade: string,
  hasSpouse: boolean,
  housingStatus: HousingStatus,
): HousingResult {
  if (housingStatus === 'on_base_family_housing') return { amount: 0, isOha: false, approximate: false };

  if (mhaZip) {
    const amount = housingStatus === 'barracks' ? BAH_PARTIAL : (getBahRate(mhaZip, payGrade as any, hasSpouse) ?? 0);
    return { amount, isOha: false, approximate: false };
  }

  if (housingStatus === 'barracks') return { amount: 0, isOha: false, approximate: false };

  const area = dutyStationId ? getOhaAreaForInstallation(dutyStationId) : undefined;
  if (!area) return { amount: 0, isOha: false, approximate: false };
  const rate = getOhaRate(area.locationLabel, payGrade as PayGrade, hasSpouse);
  if (!rate) return { amount: 0, isOha: true, approximate: area.approximate };
  return { amount: rate.rentCeilingUSD + rate.utilityAllowanceUSD, isOha: true, approximate: area.approximate };
}

/**
 * Legacy High-3 retired-pay multiplier: 2.5% of the High-3 average basic pay
 * per year of service — exactly 50% at the 20-year minimum-retirement point,
 * +2.5% for every year served beyond that (e.g. 30 YOS = 75%). Clamped to
 * [0, 1] since DoD never pays out more than 100% of High-3 pay.
 */
export function retiredPayMultiplier(yos: number): number {
  return Math.min(1, Math.max(0, yos * 0.025));
}

export function calcLES(inputs: LESInputs): LESBreakdown {
  const {
    payGrade, yos, mhaZip, dutyStationId, hasSpouse, housingStatus = 'off_base', specialPaysTotal,
    tspContribPct, rothTspPct = 0, hasDentalFamily, sglOptOut, stateResidence, overrides, serviceStatus,
    familySeparated, dependentsMhaZip, alsoGsCivilian, gsGrade, gsStep, gsLocalityKey,
  } = inputs;

  const isRetired = serviceStatus === 'retired';
  // A pure civilian (never served, or no longer tracked as active/reserve/
  // retired) draws no military pay at all — basic pay, BAH, and BAS are all
  // active-duty/retiree entitlements, not things a civilian has. Previously
  // this case fell through to the active-duty branch below and computed a
  // bogus military paycheck off whatever payGrade happened to be selected.
  const isCivilianOnly = serviceStatus === 'civilian';
  const retiredPct = isRetired ? retiredPayMultiplier(yos) : 0;

  // Family separation: a member stationed unaccompanied (OCONUS tour, sea
  // duty, etc.) with dependents living elsewhere draws BAH at the DEPENDENTS'
  // actual location (with-dependents rate) in addition to their own OHA/BAH
  // at their own duty station (now at the without-dependents rate, since the
  // member isn't housing a family there), plus flat FSA. Doesn't apply to a
  // retiree or pure civilian — neither draws BAH/OHA/FSA at all — and
  // requires an actual dependent to be separated from.
  const familySepActive = !isRetired && !isCivilianOnly && !!familySeparated && hasSpouse;

  // A retiree draws retired pay (a percentage of High-3 average basic pay),
  // not an active-duty paycheck — no BAH, no BAS, and retired pay isn't
  // subject to FICA (it's a pension, not wages). VA disability compensation
  // is handled entirely separately (see monthlyCompensation in va-disability
  // utils) and is unaffected by any of this.
  const calcBasePay = isRetired
    ? getHigh3Average(payGrade as PayGrade, yos) * retiredPct
    : isCivilianOnly
      ? 0
      : getBasicPay(payGrade as any, yos);
  const housing = (isRetired || isCivilianOnly)
    ? { amount: 0, isOha: false, approximate: false }
    // When separated, the member's OWN housing is at the without-dependents
    // rate — the with-dependents rate now belongs to the dependents' actual
    // location (familyBah below), not the member's empty household.
    : resolveHousing(mhaZip, dutyStationId, payGrade, familySepActive ? false : hasSpouse, housingStatus);
  const calcBah = housing.amount;
  const calcBas = (isRetired || isCivilianOnly) ? 0 : getBAS(payGrade);

  const basePay = overrides?.basePayOverride ?? calcBasePay;
  const bah     = overrides?.bahOverride     ?? calcBah;
  const bas     = overrides?.basOverride     ?? calcBas;

  // Family BAH — with-dependents rate at the dependents' actual home, looked
  // up the same way the member's own BAH is. A ZIP that doesn't resolve to
  // real BAH data (typo, unsupported area) correctly yields $0 rather than a
  // guess — familyBahResolved lets the UI say so instead of silently hiding
  // a real entitlement the member is missing out on.
  let familyBah = 0;
  let familyBahResolved = true;
  if (familySepActive) {
    const rate = dependentsMhaZip ? getBahRate(dependentsMhaZip, payGrade as PayGrade, true) : null;
    if (rate != null) {
      familyBah = rate;
    } else {
      familyBahResolved = false;
    }
  }
  const fsa = familySepActive ? FSA_MONTHLY : 0;

  // GS civilian pay — either a pure civilian, or a retiree who's ALSO
  // currently working a GS job (retired pay + VA disability + a GS paycheck
  // are three separate, simultaneously-stacking income sources for the same
  // person, not mutually exclusive statuses).
  const gsActive = isCivilianOnly || (isRetired && !!alsoGsCivilian);
  const gsGrossMonthly = (gsActive && gsGrade && gsStep)
    ? getGSMonthly(gsGrade, gsStep, gsLocalityKey ?? 'RUS')
    : 0;

  const extraIncomeItems  = overrides?.extraIncome      ?? [];
  const extraDeductionItems = overrides?.extraDeductions ?? [];
  const extraIncome     = extraIncomeItems.reduce((s, i) => s + i.amount, 0);
  const extraDeductions = extraDeductionItems.reduce((s, i) => s + i.amount, 0);

  const grossPay = basePay + bah + bas + specialPaysTotal + extraIncome + familyBah + fsa + gsGrossMonthly;

  // Combined federal tax on basePay + GS wages together (not two separate
  // brackets) — stacking GS income on top of retired pay pushes the whole
  // household into a higher marginal bracket, and computing each source's
  // tax independently would understate that.
  const fica    = (isRetired ? 0 : basePay * FICA_RATE) + gsGrossMonthly * FICA_RATE;
  const fedTax  = estimateFedTax((basePay + gsGrossMonthly) * 12, hasSpouse);
  // Military retirement pay exemptions are a materially different (and
  // generally more generous) list than active-duty exemptions — see
  // getRetirementStateTaxRate's own comment in data/state-tax.ts. Using the
  // active-duty table here would show retirees in e.g. Kansas or Utah a
  // state tax deduction on their pension that doesn't actually apply. A
  // stacked GS paycheck is ordinary civilian wage income, though — it always
  // uses the regular rate even when basePay (the pension portion) doesn't.
  const stateRate      = isRetired ? getRetirementStateTaxRate(stateResidence) : getStateTaxRate(stateResidence);
  const gsStateRate     = getStateTaxRate(stateResidence);
  const stateTax       = basePay * stateRate + gsGrossMonthly * gsStateRate;
  const traditionalTsp = basePay * (tspContribPct / 100);
  const rothTsp        = basePay * (rothTspPct / 100);
  const tsp            = traditionalTsp + rothTsp;
  const sgli           = sglOptOut ? 0 : SGLI_MONTHLY;
  const dental   = hasDentalFamily ? dentalFamilyRate(payGrade) : 0;
  const gsFica = gsGrossMonthly * FICA_RATE;

  const totalDeductions = fica + fedTax + stateTax + tsp + sgli + dental + extraDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    basePay, bah, bas,
    specialPays: specialPaysTotal,
    extraIncome, grossPay,
    fica, fedTax, stateTax, tsp, traditionalTsp, rothTsp, sgli, dental,
    extraDeductions, totalDeductions, netPay,
    bahOverridden: overrides?.bahOverride != null,
    basOverridden: overrides?.basOverride != null,
    basePayOverridden: overrides?.basePayOverride != null,
    extraIncomeItems,
    extraDeductionItems,
    isOha: housing.isOha,
    ohaApproximate: housing.approximate,
    isRetiredPay: isRetired,
    familySeparated: familySepActive,
    familyBah, familyBahResolved, fsa,
    alsoGsCivilian: gsActive,
    gsGrossMonthly, gsFica,
    retiredPayPct: Math.round(retiredPct * 100),
  };
}

export function fmtPay(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Estimated monthly drill pay for Reserve/Guard members.
 * Each drill period (UTA/IDT) = 1/30 of monthly basic pay — matching the
 * canonical calculation used in the Reserves screen (app/reserves.tsx).
 * A standard battle assembly weekend = 4 drill periods.
 */
export function getDrillPay(payGrade: string, yos: number, drillsPerMonth: number): number {
  const monthlyBasicPay = getBasicPay(payGrade as any, yos);
  const perDrill = monthlyBasicPay / 30;
  return perDrill * drillsPerMonth;
}
