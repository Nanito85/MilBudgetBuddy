// Survivor Benefit Plan (SBP) constants and premium math — single source of
// truth shared by the standalone SBP Calculator (app/sbp-calculator.tsx) and
// the retired-pay deduction in features/home/utils/lesCalc.ts. Previously
// each had its own copy of these numbers; see the OHA-location duplication
// bug elsewhere in this codebase for what happens when two copies drift.
//
// Source: DFAS SBP overview — dfas.mil/retiredmilitary/provide/sbp. The
// spouse-coverage premium is a flat 6.5% of the elected "base amount"
// (covered base), which can be anywhere from $300/mo up to full retired
// pay — this app only models coverage as a % of retired pay (55-100%,
// matching the standalone calculator's UI), not an arbitrary dollar base
// amount, since that's what a member actually elects at retirement in the
// overwhelming majority of cases.
export const SBP_ANNUITY_PCT = 0.55;  // spouse receives 55% of the covered base
export const SBP_PREMIUM_PCT = 0.065; // 6.5% of the covered base, deducted from retired pay

/**
 * Monthly SBP premium for a given retired pay amount and coverage
 * percentage (0-1, e.g. 1.0 = full retired pay as the covered base).
 */
export function calcSbpPremium(retiredPayMonthly: number, coveragePct: number): number {
  const coveredBase = retiredPayMonthly * coveragePct;
  return coveredBase * SBP_PREMIUM_PCT;
}

/**
 * Monthly SBP annuity (what the spouse/beneficiary would receive) for a
 * given retired pay amount and coverage percentage.
 */
export function calcSbpAnnuity(retiredPayMonthly: number, coveragePct: number): number {
  const coveredBase = retiredPayMonthly * coveragePct;
  return coveredBase * SBP_ANNUITY_PCT;
}
