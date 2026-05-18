/**
 * VA Loan funding fee tables — FY2025.
 * Source: VA Pamphlet 26-7, Chapter 8. Verify at benefits.va.gov.
 * Rates are percentages of the base loan amount.
 */

export const VA_LOAN_DATA_YEAR = 2025;

// 2025 conforming loan limit (most counties)
export const CONFORMING_LOAN_LIMIT = 806_500;

export type VAUsage = 'first' | 'subsequent';
export type DownPaymentTier = 'none' | 'five' | 'ten';

// Funding fee % by usage × down payment tier
// Same rates for active duty, veterans, and reserves/guard as of 2020
export const FUNDING_FEE: Record<VAUsage, Record<DownPaymentTier, number>> = {
  first:      { none: 2.15, five: 1.50, ten: 1.25 },
  subsequent: { none: 3.30, five: 1.50, ten: 1.25 },
};

export function getDownPaymentTier(downPct: number): DownPaymentTier {
  if (downPct >= 10) return 'ten';
  if (downPct >= 5)  return 'five';
  return 'none';
}

export function getFundingFee(usage: VAUsage, downPct: number, exempt: boolean): number {
  if (exempt) return 0;
  return FUNDING_FEE[usage][getDownPaymentTier(downPct)];
}

// Funding fee is waived for veterans receiving any VA disability compensation
// and for Purple Heart recipients on active duty
export const FUNDING_FEE_EXEMPT_NOTE =
  'Exempt if receiving VA disability compensation (any rating) or active-duty Purple Heart recipient.';

// Typical PMI rate for conventional loans (for comparison)
export const CONVENTIONAL_PMI_RATE = 0.0085; // 0.85% per year (rough midpoint)
