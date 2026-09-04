/**
 * Federal income tax brackets — FY2026, inflation-adjusted.
 *
 * Single source of truth for every tool that needs a rough federal tax
 * estimate. Previously this table existed as two independently
 * hand-maintained copies — lesCalc.ts (the main pay engine) and
 * gs-pay-calculator.tsx each had their own — currently identical by
 * coincidence, but exactly the kind of duplication that broke OHA location
 * lookups earlier: update one copy next tax year (brackets are
 * inflation-adjusted annually) and forget the other, and the two tools
 * silently disagree with no error, no warning, nothing.
 */

export const FEDERAL_TAX_DATA_YEAR = 2026;

// Social Security (6.2%) + Medicare (1.45%) employee share — statutory
// rate, essentially never changes, but kept here alongside the bracket
// table anyway since it was also duplicated across the same 3 files as a
// literal 0.0765 with no shared source.
export const FICA_RATE = 0.0765;

const SINGLE_STD_DEDUCTION  = 16100;
const MARRIED_STD_DEDUCTION = 32200;

const SINGLE_BRACKETS: [ceiling: number, rate: number][] = [
  [12400, 0.10],
  [50400, 0.12],
  [105700, 0.22],
  [201775, 0.24],
  [256225, 0.32],
  [640600, 0.35],
  [Infinity, 0.37],
];

const MARRIED_BRACKETS: [ceiling: number, rate: number][] = [
  [24800, 0.10],
  [100800, 0.12],
  [211400, 0.22],
  [403550, 0.24],
  [512450, 0.32],
  [768700, 0.35],
  [Infinity, 0.37],
];

/**
 * Estimated ANNUAL federal income tax on `annualIncome`, after applying the
 * standard deduction. `married` selects the filing-status brackets — pass
 * `false` for single/head-of-household approximation.
 */
export function estimateAnnualFedTax(annualIncome: number, married: boolean): number {
  const stdDeduction = married ? MARRIED_STD_DEDUCTION : SINGLE_STD_DEDUCTION;
  const taxable = Math.max(0, annualIncome - stdDeduction);
  const brackets = married ? MARRIED_BRACKETS : SINGLE_BRACKETS;

  let tax = 0;
  let prev = 0;
  for (const [ceiling, rate] of brackets) {
    if (taxable <= prev) break;
    const slice = Math.min(taxable, ceiling) - prev;
    tax += slice * rate;
    prev = ceiling;
  }
  return tax;
}
