import { getBahRate } from '@/data/bah-rates';
import { getBAS } from '@/data/bas-rates';
import { getBasicPay } from '@/data/basic-pay-rates';
import { getStateTaxRate } from '@/data/state-tax';
import { LESOverrides } from '@/types/user.types';

export const SGLI_MONTHLY = 29;      // $500k coverage standard
export const DENTAL_FAMILY = 38.67;  // TDP family plan $/month (FY2026)

// Federal income tax estimate — base pay only (allowances not taxable)
// FY2026 brackets (inflation-adjusted); filing status: 'single' | 'married'
function estimateFedTax(annualBasePay: number, married: boolean): number {
  const stdDeduction = married ? 30900 : 15450;
  const taxable = Math.max(0, annualBasePay - stdDeduction);

  const brackets = married
    ? [
        [24500, 0.10],
        [99700, 0.12],
        [212700, 0.22],
        [405600, 0.24],
        [515200, 0.32],
        [772750, 0.35],
        [Infinity, 0.37],
      ]
    : [
        [12250, 0.10],
        [49850, 0.12],
        [106350, 0.22],
        [202850, 0.24],
        [257600, 0.32],
        [643850, 0.35],
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
  extraIncome: number;
  grossPay: number;
  // Deductions
  fica: number;
  fedTax: number;
  stateTax: number;
  tsp: number;           // total TSP (traditional + roth)
  traditionalTsp: number;
  rothTsp: number;
  sgli: number;
  dental: number;
  extraDeductions: number;
  totalDeductions: number;
  // Net
  netPay: number;
  // Override flags (for display)
  bahOverridden: boolean;
  basOverridden: boolean;
  basePayOverridden: boolean;
  extraIncomeItems: { id: string; label: string; amount: number }[];
  extraDeductionItems: { id: string; label: string; amount: number }[];
}

export interface LESInputs {
  payGrade: string;
  yos: number;
  mhaZip: string | undefined;
  hasSpouse: boolean;
  specialPaysTotal: number;
  tspContribPct: number;   // Traditional TSP %
  rothTspPct?: number;     // Roth TSP % (optional, defaults to 0)
  hasDentalFamily: boolean;
  sglOptOut: boolean;
  stateResidence?: string;
  overrides?: LESOverrides;
}

export function calcLES(inputs: LESInputs): LESBreakdown {
  const { payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, rothTspPct = 0, hasDentalFamily, sglOptOut, stateResidence, overrides } = inputs;

  const calcBasePay = getBasicPay(payGrade as any, yos);
  const calcBah = mhaZip ? (getBahRate(mhaZip, payGrade as any, hasSpouse) ?? 0) : 0;
  const calcBas = getBAS(payGrade);

  const basePay = overrides?.basePayOverride ?? calcBasePay;
  const bah     = overrides?.bahOverride     ?? calcBah;
  const bas     = overrides?.basOverride     ?? calcBas;

  const extraIncomeItems  = overrides?.extraIncome      ?? [];
  const extraDeductionItems = overrides?.extraDeductions ?? [];
  const extraIncome     = extraIncomeItems.reduce((s, i) => s + i.amount, 0);
  const extraDeductions = extraDeductionItems.reduce((s, i) => s + i.amount, 0);

  const grossPay = basePay + bah + bas + specialPaysTotal + extraIncome;

  const fica           = basePay * 0.0765;
  const fedTax         = estimateFedTax(basePay * 12, hasSpouse);
  const stateRate      = getStateTaxRate(stateResidence);
  const stateTax       = basePay * stateRate;
  const traditionalTsp = basePay * (tspContribPct / 100);
  const rothTsp        = basePay * (rothTspPct / 100);
  const tsp            = traditionalTsp + rothTsp;
  const sgli           = sglOptOut ? 0 : SGLI_MONTHLY;
  const dental   = hasDentalFamily ? DENTAL_FAMILY : 0;

  const totalDeductions = fica + fedTax + stateTax + tsp + sgli + dental + extraDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    basePay, bah, bas,
    specialPays: specialPaysTotal,
    extraIncome, grossPay,
    fica, fedTax, stateTax, tsp, traditionalTsp, rothTsp, sgli, dental,
    extraDeductions, totalDeductions, netPay,
    bahOverridden: overrides?.bahOverride != null,
    basOverridden: overrides?.basOverride != null,
    basePayOverridden: overrides?.basePayOverride != null,
    extraIncomeItems,
    extraDeductionItems,
  };
}

export function fmtPay(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
