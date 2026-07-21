/**
 * VA disability combined rating ("whole person" method).
 * Rates: FY2026 (effective Dec 1, 2025, 2.8% COLA from FY2025 base).
 * Source: 38 CFR §4.25. Verify at va.gov/disability/compensation-rates.
 */

// FY2026 monthly compensation — veteran alone (no dependents)
export const VA_RATES_ALONE: Record<number, number> = {
  10:  180.42,
  20:  356.66,
  30:  552.47,
  40:  795.84,
  50: 1132.90,
  60: 1435.02,
  70: 1808.45,
  80: 2102.15,
  90: 2362.30,
 100: 3938.58,
};

// FY2026 additional monthly amounts for dependents (30%+ only)
// Format: { rating: { withSpouse, withSpouseAndChild, perChild, ... } }
export interface DependentAdder {
  withSpouse: number;
  withSpouseAndChild: number;
  noSpouseOneChild: number;
  perAdditionalChild: number;
}

export const VA_DEP_ADDERS: Record<number, DependentAdder> = {
  30:  { withSpouse: 65.00,  withSpouseAndChild: 114.00, noSpouseOneChild: 43.00,  perAdditionalChild: 32.00 },
  40:  { withSpouse: 87.00,  withSpouseAndChild: 152.00, noSpouseOneChild: 58.00,  perAdditionalChild: 43.00 },
  50:  { withSpouse: 109.00, withSpouseAndChild: 190.00, noSpouseOneChild: 73.00,  perAdditionalChild: 54.00 },
  60:  { withSpouse: 131.00, withSpouseAndChild: 228.00, noSpouseOneChild: 88.00,  perAdditionalChild: 65.00 },
  70:  { withSpouse: 153.00, withSpouseAndChild: 266.00, noSpouseOneChild: 102.00, perAdditionalChild: 76.00 },
  80:  { withSpouse: 175.00, withSpouseAndChild: 304.00, noSpouseOneChild: 117.00, perAdditionalChild: 87.00 },
  90:  { withSpouse: 197.00, withSpouseAndChild: 342.00, noSpouseOneChild: 132.00, perAdditionalChild: 98.00 },
 100:  { withSpouse: 219.59, withSpouseAndChild: 380.41, noSpouseOneChild: 146.85, perAdditionalChild: 109.11 },
};

export interface RatingInput {
  id: string;
  pct: number;   // 0–100 in steps of 10
}

/**
 * Computes combined VA disability rating.
 * Process: sort ratings descending, apply each to remaining "whole person".
 * Round combined value to nearest 10 (5+ rounds up).
 */
export function combinedRating(ratings: RatingInput[]): {
  exact: number;
  rounded: number;
  remaining: number;
} {
  if (ratings.length === 0) return { exact: 0, rounded: 0, remaining: 100 };

  const sorted = [...ratings].sort((a, b) => b.pct - a.pct);
  let remaining = 100;

  for (const r of sorted) {
    remaining = remaining * (1 - r.pct / 100);
  }

  const exact = 100 - remaining;
  const rounded = Math.round(exact / 10) * 10;
  return { exact, rounded: Math.min(100, rounded), remaining };
}

export function monthlyCompensation(
  roundedRating: number,
  hasSpouse: boolean,
  numChildren: number,
): number {
  const base = VA_RATES_ALONE[roundedRating] ?? 0;
  if (roundedRating < 30 || (!hasSpouse && numChildren === 0)) return base;

  const adder = VA_DEP_ADDERS[roundedRating];
  if (!adder) return base;

  let add = 0;
  if (hasSpouse && numChildren > 0) {
    add = adder.withSpouseAndChild + (numChildren - 1) * adder.perAdditionalChild;
  } else if (hasSpouse) {
    add = adder.withSpouse;
  } else if (numChildren > 0) {
    add = adder.noSpouseOneChild + (numChildren - 1) * adder.perAdditionalChild;
  }

  return base + add;
}

export const VALID_RATINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
