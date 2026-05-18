/**
 * JTR Table 5-A — Household Goods weight allowances (lbs).
 * Source: Joint Travel Regulations, Chapter 5. Verify with TMO before your move.
 */

import { PayGrade } from './bah-rates';

export interface WeightAllowance {
  withDep: number;
  withoutDep: number;
}

export const WEIGHT_ALLOWANCES: Record<PayGrade, WeightAllowance> = {
  E1:  { withDep: 5_000, withoutDep: 1_500 },
  E2:  { withDep: 5_000, withoutDep: 1_500 },
  E3:  { withDep: 5_000, withoutDep: 1_500 },
  E4:  { withDep: 7_000, withoutDep: 3_500 },
  E5:  { withDep: 9_000, withoutDep: 7_000 },
  E6:  { withDep: 11_000, withoutDep: 9_000 },
  E7:  { withDep: 12_500, withoutDep: 10_500 },
  E8:  { withDep: 13_500, withoutDep: 12_000 },
  E9:  { withDep: 13_500, withoutDep: 13_500 },
  W1:  { withDep: 10_000, withoutDep: 8_000 },
  W2:  { withDep: 12_500, withoutDep: 10_500 },
  W3:  { withDep: 13_500, withoutDep: 12_000 },
  W4:  { withDep: 13_500, withoutDep: 12_000 },
  W5:  { withDep: 13_500, withoutDep: 12_000 },
  O1:  { withDep: 10_000, withoutDep: 8_000 },
  O2:  { withDep: 12_500, withoutDep: 10_500 },
  O3:  { withDep: 13_500, withoutDep: 12_000 },
  O4:  { withDep: 14_500, withoutDep: 13_000 },
  O5:  { withDep: 16_000, withoutDep: 14_500 },
  O6:  { withDep: 17_500, withoutDep: 15_500 },
  O7:  { withDep: 18_000, withoutDep: 18_000 },
  O8:  { withDep: 18_000, withoutDep: 18_000 },
  O9:  { withDep: 18_000, withoutDep: 18_000 },
  O10: { withDep: 18_000, withoutDep: 18_000 },
};

export function getWeightAllowance(grade: PayGrade, withDep: boolean): number {
  const entry = WEIGHT_ALLOWANCES[grade];
  return withDep ? entry.withDep : entry.withoutDep;
}

// ── Distance-based government rate ($/lb) ─────────────────────────────────────
// Approximate 2025 DTMO baseline rates for planning purposes.
// Actual rates depend on origin state, carrier type, and annual DTMO table.

const DISTANCE_RATE_TABLE: Array<{ maxMiles: number; ratePerLb: number }> = [
  { maxMiles: 299,  ratePerLb: 0.24 },
  { maxMiles: 599,  ratePerLb: 0.32 },
  { maxMiles: 999,  ratePerLb: 0.40 },
  { maxMiles: 1499, ratePerLb: 0.50 },
  { maxMiles: 1999, ratePerLb: 0.60 },
  { maxMiles: 2499, ratePerLb: 0.70 },
  { maxMiles: 2999, ratePerLb: 0.78 },
  { maxMiles: Infinity, ratePerLb: 0.85 },
];

export function getRatePerLb(distanceMiles: number): number {
  for (const row of DISTANCE_RATE_TABLE) {
    if (distanceMiles <= row.maxMiles) return row.ratePerLb;
  }
  return 0.85;
}

export const PPM_DATA_YEAR = 2025;
