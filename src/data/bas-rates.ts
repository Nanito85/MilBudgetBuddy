/**
 * FY2026 Basic Allowance for Subsistence (BAS) rates. Effective January 1, 2026.
 * Source: DoD FMR / DFAS. BAS increases are tied to food-at-home CPI (separate from basic pay raise).
 * Verify current rates at: https://www.dfas.mil/militarymembers/payentitlements/bas/
 * BAS is not taxable income.
 */

export const BAS_DATA_YEAR = 2026;

export const BAS_ENLISTED = 476.95;   // $/month
export const BAS_OFFICER  = 328.48;   // $/month

export type PayComponent = 'enlisted' | 'warrant' | 'officer';

export function getPayComponent(grade: string): PayComponent {
  if (grade.startsWith('E')) return 'enlisted';
  if (grade.startsWith('W')) return 'warrant';
  return 'officer';
}

export function getBAS(grade: string): number {
  const comp = getPayComponent(grade);
  // Warrant officers are classified as officers for BAS purposes (DFAS) and
  // draw the officer rate, not the enlisted rate — getPayComponent() already
  // distinguishes 'warrant' from 'enlisted', but this ternary was treating
  // anything non-'officer' (including 'warrant') as enlisted, overstating
  // every warrant officer's BAS by the enlisted/officer rate gap (~$148/mo).
  return comp === 'enlisted' ? BAS_ENLISTED : BAS_OFFICER;
}
