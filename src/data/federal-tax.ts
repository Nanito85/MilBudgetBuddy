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

// Tax year 2026, Rev. Proc. 2025-32 (as amended by the 2025 reconciliation act).
const SINGLE_STD_DEDUCTION  = 16100;
const MARRIED_STD_DEDUCTION = 32200;
const HOH_STD_DEDUCTION     = 24150;

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

const HOH_BRACKETS: [ceiling: number, rate: number][] = [
  [17700, 0.10],
  [67450, 0.12],
  [105700, 0.22],
  [201750, 0.24],
  [256200, 0.32],
  [640600, 0.35],
  [Infinity, 0.37],
];

// Child Tax Credit, 2026: $2,200 per qualifying child under 17, phased out by
// $50 per $1,000 (or part) of income over $400k joint / $200k otherwise.
export const CHILD_TAX_CREDIT = 2200;
const CTC_PHASEOUT_MFJ = 400000;
const CTC_PHASEOUT_OTHER = 200000;

export type FilingStatus = 'single' | 'mfj' | 'hoh';

/**
 * Filing status from the profile: married → joint; unmarried with a child →
 * head of household (the usual case for a single parent who pays most of
 * the household's costs); otherwise single.
 */
export function filingStatusFor(married: boolean, numChildren = 0): FilingStatus {
  if (married) return 'mfj';
  return numChildren > 0 ? 'hoh' : 'single';
}

function bracketTax(taxable: number, brackets: [number, number][]): number {
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

/**
 * Estimated ANNUAL federal income tax on `annualIncome` (already net of
 * pre-tax deductions like traditional TSP), after the standard deduction.
 * `married` selects joint brackets. Pass `children` to apply the Child Tax
 * Credit and, for an unmarried filer, head-of-household brackets.
 *
 * The credit is applied only against tax owed (never below $0): the
 * refundable part is paid as a refund at filing, not in a paycheck, so this
 * is the year's liability, not a refund estimate.
 */
export function estimateAnnualFedTax(annualIncome: number, married: boolean, children = 0): number {
  const status = filingStatusFor(married, children);
  const stdDeduction = status === 'mfj' ? MARRIED_STD_DEDUCTION : status === 'hoh' ? HOH_STD_DEDUCTION : SINGLE_STD_DEDUCTION;
  const brackets = status === 'mfj' ? MARRIED_BRACKETS : status === 'hoh' ? HOH_BRACKETS : SINGLE_BRACKETS;
  const taxable = Math.max(0, annualIncome - stdDeduction);
  const tax = bracketTax(taxable, brackets);

  if (children <= 0) return tax;
  const threshold = status === 'mfj' ? CTC_PHASEOUT_MFJ : CTC_PHASEOUT_OTHER;
  const over = Math.max(0, annualIncome - threshold);
  const credit = Math.max(0, children * CHILD_TAX_CREDIT - Math.ceil(over / 1000) * 50);
  return Math.max(0, tax - credit);
}
