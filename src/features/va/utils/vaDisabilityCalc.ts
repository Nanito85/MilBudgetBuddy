/**
 * VA disability combined rating ("whole person" method).
 * Rates: FY2026 (effective Dec 1, 2025, 2.5% COLA from FY2025 base).
 * Source: 38 CFR §4.25. Verify at va.gov/disability/compensation-rates.
 */

// FY2026 monthly compensation — veteran alone (no dependents)
export const VA_RATES_ALONE: Record<number, number> = {
  10:  175.51,
  20:  346.95,
  30:  537.42,
  40:  774.16,
  50: 1102.04,
  60: 1395.93,
  70: 1759.19,
  80: 2044.89,
  90: 2297.96,
 100: 3831.30,
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
  30:  { withSpouse: 58.57,  withSpouseAndChild: 78.68,  noSpouseOneChild: 30.30, perAdditionalChild: 30.30 },
  40:  { withSpouse: 77.38,  withSpouseAndChild: 103.38, noSpouseOneChild: 40.07, perAdditionalChild: 40.07 },
  50:  { withSpouse: 96.18,  withSpouseAndChild: 128.22, noSpouseOneChild: 50.68, perAdditionalChild: 50.68 },
  60:  { withSpouse: 115.70, withSpouseAndChild: 153.95, noSpouseOneChild: 60.32, perAdditionalChild: 60.32 },
  70:  { withSpouse: 135.10, withSpouseAndChild: 180.12, noSpouseOneChild: 69.82, perAdditionalChild: 69.82 },
  80:  { withSpouse: 154.51, withSpouseAndChild: 206.28, noSpouseOneChild: 79.37, perAdditionalChild: 79.37 },
  90:  { withSpouse: 173.89, withSpouseAndChild: 231.99, noSpouseOneChild: 89.88, perAdditionalChild: 89.88 },
 100:  { withSpouse: 193.47, withSpouseAndChild: 257.10, noSpouseOneChild: 100.19, perAdditionalChild: 100.19 },
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
