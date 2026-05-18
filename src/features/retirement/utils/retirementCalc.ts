import { PayGrade } from '@/data/bah-rates';
import { getBasicPay, getHigh3Average } from '@/data/basic-pay-rates';

// ── TSP future value ──────────────────────────────────────────────────────────

/**
 * Standard annuity FV:  PMT × [((1+r)^n - 1) / r]
 * r = monthly rate, n = months, PMT = monthly contribution
 */
function fvAnnuity(pmt: number, annualRate: number, years: number): number {
  if (annualRate === 0) return pmt * years * 12;
  const r = annualRate / 12;
  const n = years * 12;
  return pmt * ((Math.pow(1 + r, n) - 1) / r);
}

// ── Government TSP match (BRS) ────────────────────────────────────────────────

/**
 * Returns the total govt match rate (as a decimal fraction of basic pay).
 * - Auto 1% (always, regardless of member contribution)
 * - Dollar-for-dollar match on first 3% of member contribution
 * - 50¢ per $1 on next 2% of member contribution (4th and 5th %)
 * Max govt match: 1% auto + 3% + 1% = 5% of basic pay
 */
export function govtMatchRate(memberContribRate: number): number {
  const autoContrib = 0.01;
  const matchUp3 = Math.min(memberContribRate, 0.03);
  const matchNext2 = Math.max(0, Math.min(memberContribRate - 0.03, 0.02)) * 0.5;
  return autoContrib + matchUp3 + matchNext2;
}

// ── Continuation Pay (BRS, paid around 12 YOS) ───────────────────────────────

/**
 * Minimum multiplier per branch policy. Active duty min is 2.5×.
 * We use 2.5× monthly basic pay as the conservative default.
 */
export function continuationPay(grade: PayGrade, yosAtCP: number = 12): number {
  const monthlyPay = getBasicPay(grade, yosAtCP);
  return monthlyPay * 2.5;
}

// ── Core calculations ─────────────────────────────────────────────────────────

export interface RetirementInputs {
  grade: PayGrade;
  retirementYOS: number;
  currentAge: number;
  currentYOS: number;
  tspContribRate: number;   // 0–0.15 (e.g., 0.05 = 5%)
  tspAnnualReturn: number;  // 0.04–0.10 (e.g., 0.07 = 7%)
}

export interface High3Result {
  monthlyPension: number;
  annualPension: number;
  high3AvgPay: number;
}

export interface BRSResult {
  monthlyPension: number;
  annualPension: number;
  tspBalance: number;
  continuationPayAmount: number;
  govtMatchRatePct: number;
  totalMonthlyContrib: number;
  high3AvgPay: number;
}

export interface RetirementResult {
  retirementAge: number;
  yearsToRetirement: number;
  high3: High3Result;
  brs: BRSResult;
  breakEvenYearsAfterRetirement: number | null;
  breakEvenAge: number | null;
  monthlyPensionDiff: number;
}

export function calcRetirement(inputs: RetirementInputs): RetirementResult {
  const {
    grade,
    retirementYOS,
    currentAge,
    currentYOS,
    tspContribRate,
    tspAnnualReturn,
  } = inputs;

  const yearsToRetirement = Math.max(0, retirementYOS - currentYOS);
  const retirementAge = currentAge + yearsToRetirement;

  // ── High-3 pension ──────────────────────────────────────────────────────────
  const high3Avg = getHigh3Average(grade, retirementYOS);
  const h3Monthly = (retirementYOS * 0.025 * high3Avg * 12) / 12;
  // Simplified: (yos × 2.5% × annual_high3) / 12
  const h3MonthlyPension = (retirementYOS * 0.025 * high3Avg);
  const h3AnnualPension = h3MonthlyPension * 12;

  // ── BRS pension ─────────────────────────────────────────────────────────────
  const brsMonthlyPension = retirementYOS * 0.020 * high3Avg;
  const brsAnnualPension = brsMonthlyPension * 12;

  // ── TSP accumulation (BRS) ──────────────────────────────────────────────────
  const monthlyBasePay = getBasicPay(grade, currentYOS);
  const memberPMT = monthlyBasePay * tspContribRate;
  const govtRate = govtMatchRate(tspContribRate);
  const govtPMT = monthlyBasePay * govtRate;
  const totalPMT = memberPMT + govtPMT;
  const tspBalance = fvAnnuity(totalPMT, tspAnnualReturn, yearsToRetirement);

  // ── Continuation pay ────────────────────────────────────────────────────────
  const cpYOS = 12;
  const cpAmount =
    currentYOS <= cpYOS && retirementYOS >= cpYOS
      ? continuationPay(grade, cpYOS)
      : 0;

  // ── Break-even ──────────────────────────────────────────────────────────────
  // After retirement, each year BRS is behind High-3 by monthlyDiff × 12.
  // BRS starts with a "lead" of (tspBalance + cpAmount) in savings.
  // Break-even: when cumulative pension gap equals the TSP/CP lead.
  // annualPensionDiff × n = tspBalance + cpAmount
  const pensionGapPerYear = h3AnnualPension - brsAnnualPension;
  let breakEvenYears: number | null = null;
  let breakEvenAge: number | null = null;

  if (pensionGapPerYear > 0) {
    const totalBRSLead = tspBalance + cpAmount;
    breakEvenYears = Math.ceil(totalBRSLead / pensionGapPerYear);
    breakEvenAge = retirementAge + breakEvenYears;
  } else {
    // BRS pension == High-3 pension (shouldn't happen; same YOS, just different multiplier)
    breakEvenYears = 0;
    breakEvenAge = retirementAge;
  }

  return {
    retirementAge,
    yearsToRetirement,
    high3: {
      monthlyPension: h3MonthlyPension,
      annualPension: h3AnnualPension,
      high3AvgPay: high3Avg,
    },
    brs: {
      monthlyPension: brsMonthlyPension,
      annualPension: brsAnnualPension,
      tspBalance,
      continuationPayAmount: cpAmount,
      govtMatchRatePct: govtRate * 100,
      totalMonthlyContrib: totalPMT,
      high3AvgPay: high3Avg,
    },
    breakEvenYearsAfterRetirement: breakEvenYears,
    breakEvenAge,
    monthlyPensionDiff: h3MonthlyPension - brsMonthlyPension,
  };
}

export function lifetimeValue(monthlyPension: number, retirementAge: number, toAge: number = 80): number {
  const years = Math.max(0, toAge - retirementAge);
  return monthlyPension * 12 * years;
}

export function formatMoney(n: number, compact = false): string {
  if (compact && n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
