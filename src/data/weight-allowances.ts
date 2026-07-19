/**
 * JTR Table 5-37 — Household Goods (HHG) weight allowances (lbs).
 * Verified against 3 independent 2026 sources citing "JTR Table 5-37" directly
 * (this table was substantially restructured/increased from the older "Table 5-A"
 * figures — junior enlisted and O1-O5/W1-W5 allowances rose significantly).
 * Source: Joint Travel Regulations, Chapter 5. Verify with TMO/PPPO before your move.
 */

import { PayGrade } from './bah-rates';

export interface WeightAllowance {
  withDep: number;
  withoutDep: number;
}

export const WEIGHT_ALLOWANCES: Record<PayGrade, WeightAllowance> = {
  E1:  { withDep: 8_000,  withoutDep: 5_000 },
  E2:  { withDep: 8_000,  withoutDep: 5_000 },
  E3:  { withDep: 8_000,  withoutDep: 5_000 },
  E4:  { withDep: 8_000,  withoutDep: 7_000 },
  E5:  { withDep: 9_000,  withoutDep: 7_000 },
  E6:  { withDep: 11_000, withoutDep: 8_000 },
  E7:  { withDep: 13_000, withoutDep: 11_000 },
  E8:  { withDep: 14_000, withoutDep: 12_000 },
  E9:  { withDep: 15_000, withoutDep: 13_000 },
  W1:  { withDep: 12_000, withoutDep: 10_000 },
  W2:  { withDep: 13_500, withoutDep: 12_500 },
  W3:  { withDep: 14_500, withoutDep: 13_000 },
  W4:  { withDep: 17_000, withoutDep: 14_000 },
  W5:  { withDep: 17_500, withoutDep: 16_000 },
  O1:  { withDep: 12_000, withoutDep: 10_000 },
  O2:  { withDep: 13_500, withoutDep: 12_500 },
  O3:  { withDep: 14_500, withoutDep: 13_000 },
  O4:  { withDep: 17_000, withoutDep: 14_000 },
  O5:  { withDep: 17_500, withoutDep: 16_000 },
  O6:  { withDep: 18_000, withoutDep: 18_000 },
  O7:  { withDep: 18_000, withoutDep: 18_000 },
  O8:  { withDep: 18_000, withoutDep: 18_000 },
  O9:  { withDep: 18_000, withoutDep: 18_000 },
  O10: { withDep: 18_000, withoutDep: 18_000 },
};

export function getWeightAllowance(grade: PayGrade, withDep: boolean): number {
  const entry = WEIGHT_ALLOWANCES[grade];
  return withDep ? entry.withDep : entry.withoutDep;
}

// ── Pro-gear ───────────────────────────────────────────────────────────────────
// Professional books, papers, and equipment (PBP&E). Authorized IN ADDITION TO
// the HHG weight allowance above — it does not count against it — but it must be
// declared and weighed separately, or the carrier will fold it into your HHG
// weight and you lose the extra allowance. Same for every grade.
export const PRO_GEAR_MEMBER_LBS = 2_000;
export const PRO_GEAR_SPOUSE_LBS = 500; // only if the member has a spouse

// ── Distance-based government rate ($/lb) ─────────────────────────────────────
// There is NO single published public per-pound rate table for PPM Government
// Constructed Cost (GCC) — DoD computes it per-move in the Defense Personal
// Property System (DPS) using the current move-management contractor's Baseline
// Tender of Service, which varies by exact weight, origin state, and season.
// This table is a rough planning approximation only, calibrated against publicly
// reported real settlement examples (~$0.00075/lb-mile blended, with realistic
// tapering by distance). ALWAYS get your authoritative GCC estimate from the
// official PPM estimator in DPS/move.mil before making financial decisions.
const DISTANCE_RATE_TABLE: Array<{ maxMiles: number; ratePerLb: number }> = [
  { maxMiles: 299,  ratePerLb: 0.38 },
  { maxMiles: 599,  ratePerLb: 0.48 },
  { maxMiles: 999,  ratePerLb: 0.60 },
  { maxMiles: 1499, ratePerLb: 0.78 },
  { maxMiles: 1999, ratePerLb: 0.90 },
  { maxMiles: 2499, ratePerLb: 1.02 },
  { maxMiles: 2999, ratePerLb: 1.13 },
  { maxMiles: Infinity, ratePerLb: 1.25 },
];

export function getRatePerLb(distanceMiles: number): number {
  for (const row of DISTANCE_RATE_TABLE) {
    if (distanceMiles <= row.maxMiles) return row.ratePerLb;
  }
  return 1.25;
}

export const PPM_DATA_YEAR = 2026;

// PPM incentive = 100% of GCC (37 U.S.C.), effective since 2025-10-01. A
// temporary 130% rate (PDTATAC MAP 42-25(R)) applied 2025-05 through 2025-09-30
// due to move-management contractor transition issues; that authority has
// expired and reimbursement reverted to the statutory 100%.
export const PPM_INCENTIVE_PCT = 1.0;

// DFAS withholds federal income tax on PPM settlements at the flat IRS
// supplemental-wage rate, on the full incentive — not just your "profit" over
// expenses. No FICA/Social Security/Medicare is withheld from a PPM settlement.
export const PPM_FEDERAL_WITHHOLDING_PCT = 0.22;
