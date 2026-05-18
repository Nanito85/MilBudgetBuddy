import { getBahRate } from '@/data/bah-rates';
import { getBAS } from '@/data/bas-rates';
import { getBasicPay } from '@/data/basic-pay-rates';
import { getStateTaxRate } from '@/data/state-tax';

export const SGLI_MONTHLY = 29;    // $500k coverage standard
export const DENTAL_FAMILY = 36.14; // TDP family plan $/month (FY2025 approx)

// Federal income tax estimate — base pay only (allowances not taxable)
// Uses 2025 brackets; filing status: 'single' | 'married'
function estimateFedTax(annualBasePay: number, married: boolean): number {
  const stdDeduction = married ? 30000 : 15000;
  const taxable = Math.max(0, annualBasePay - stdDeduction);

  const brackets = married
    ? [
        [23850, 0.10],
        [96950, 0.12],
        [206700, 0.22],
        [394600, 0.24],
        [501050, 0.32],
        [751600, 0.35],
        [Infinity, 0.37],
      ]
    : [
        [11925, 0.10],
        [48475, 0.12],
        [103350, 0.22],
        [197300, 0.24],
        [250525, 0.32],
        [626350, 0.35],
        [Infinity, 0.37],
      ];

  let tax = 0;
  let prev = 0;
  for (const [ceiling, rate] of brackets) {
    if (taxable <= prev) break;
    const slice = Math.min(taxable, ceiling as number) - prev;
    tax += slice * (rate as number);
    prev = ceiling as number;
  }
  return tax / 12;
}

export interface LESBreakdown {
  // Gross
  basePay: number;
  bah: number;
  bas: number;
  specialPays: number;
  grossPay: number;
  // Deductions
  fica: number;
  fedTax: number;
  stateTax: number;
  tsp: number;
  sgli: number;
  dental: number;
  totalDeductions: number;
  // Net
  netPay: number;
}

export interface LESInputs {
  payGrade: string;
  yos: number;
  mhaZip: string | undefined;
  hasSpouse: boolean;
  specialPaysTotal: number;
  tspContribPct: number;
  hasDentalFamily: boolean;
  sglOptOut: boolean;
  stateResidence?: string;
}

export function calcLES(inputs: LESInputs): LESBreakdown {
  const { payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, hasDentalFamily, sglOptOut, stateResidence } = inputs;

  const basePay = getBasicPay(payGrade as any, yos);
  const bah = mhaZip ? (getBahRate(mhaZip, payGrade as any, hasSpouse) ?? 0) : 0;
  const bas = getBAS(payGrade);
  const grossPay = basePay + bah + bas + specialPaysTotal;

  const fica = basePay * 0.0765;
  const fedTax = estimateFedTax(basePay * 12, hasSpouse);
  const stateRate = getStateTaxRate(stateResidence);
  const stateTax = (basePay * stateRate);
  const tsp = basePay * (tspContribPct / 100);
  const sgli = sglOptOut ? 0 : SGLI_MONTHLY;
  const dental = hasDentalFamily ? DENTAL_FAMILY : 0;

  const totalDeductions = fica + fedTax + stateTax + tsp + sgli + dental;
  const netPay = grossPay - totalDeductions;

  return { basePay, bah, bas, specialPays: specialPaysTotal, grossPay, fica, fedTax, stateTax, tsp, sgli, dental, totalDeductions, netPay };
}

export function fmtPay(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
