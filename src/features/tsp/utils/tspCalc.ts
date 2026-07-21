import { PayGrade } from '@/data/bah-rates';
import { getBasicPay } from '@/data/basic-pay-rates';
import { govtMatchRate } from '@/features/retirement/utils/retirementCalc';

// 2026 annual contribution limits (SECURE 2.0 / IRS Notice 2025-67)
export const TSP_LIMIT_UNDER50 = 24_500;
export const TSP_LIMIT_50_59   = 32_500;   // +$8,000 catch-up
export const TSP_LIMIT_60_63   = 35_750;   // +$11,250 super catch-up (SECURE 2.0)
export const TSP_LIMIT_64PLUS  = 32_500;   // same as 50–59

export function annualLimit(age: number): number {
  if (age >= 60 && age <= 63) return TSP_LIMIT_60_63;
  if (age >= 50)              return TSP_LIMIT_50_59;
  return TSP_LIMIT_UNDER50;
}

export interface TspFund {
  id: string;
  name: string;
  fullName: string;
  color: string;
  risk: 'None' | 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  avgReturn: string;        // display string e.g. "2–3%"
  defaultRate: number;      // midpoint for projection, decimal
  description: string;
  bestFor: string;
}

export const TSP_FUNDS: TspFund[] = [
  {
    id: 'G',
    name: 'G Fund',
    fullName: 'Government Securities Investment Fund',
    color: '#1565C0',
    risk: 'None',
    avgReturn: '2–3%',
    defaultRate: 0.025,
    description:
      'Invests in short-term U.S. Treasury securities specially issued to the TSP. ' +
      'Principal and interest are guaranteed by the U.S. government. ' +
      'Returns are based on a weighted average yield of all outstanding Treasury notes and bonds.',
    bestFor: 'Capital preservation. Good for short-to-medium timeframes or as a stable anchor in a diversified portfolio.',
  },
  {
    id: 'F',
    name: 'F Fund',
    fullName: 'Fixed Income Index Investment Fund',
    color: '#00695C',
    risk: 'Low',
    avgReturn: '2–4%',
    defaultRate: 0.03,
    description:
      'Tracks the Bloomberg U.S. Aggregate Bond Index — a broad index of U.S. investment-grade bonds. ' +
      'Includes U.S. government, corporate, and mortgage-backed bonds. ' +
      'Returns vary with interest rates (bond prices fall when rates rise).',
    bestFor: 'Diversification and income. Complements equity funds. Useful for those within 5–10 years of retirement.',
  },
  {
    id: 'C',
    name: 'C Fund',
    fullName: 'Common Stock Index Investment Fund',
    color: '#C8A800',
    risk: 'High',
    avgReturn: '7–10%',
    defaultRate: 0.085,
    description:
      'Tracks the S&P 500 Index — the 500 largest publicly traded U.S. companies. ' +
      'Includes companies like Apple, Microsoft, Amazon, and Google. ' +
      'Historically the best long-term performer of the core TSP funds.',
    bestFor: 'Long-term growth. Core holding for anyone 10+ years from retirement. Highest risk/reward among bond-free funds.',
  },
  {
    id: 'S',
    name: 'S Fund',
    fullName: 'Small Capitalization Stock Index Investment Fund',
    color: '#B71C1C',
    risk: 'Very High',
    avgReturn: '8–11%',
    defaultRate: 0.09,
    description:
      'Tracks the Dow Jones U.S. Completion Total Stock Market Index — small- and mid-cap companies ' +
      'not included in the S&P 500. Historically higher long-term returns than large-cap stocks ' +
      'but with greater short-term volatility.',
    bestFor: 'Aggressive growth. Best paired with C Fund for broader U.S. market exposure. Ideal for 15+ year horizons.',
  },
  {
    id: 'I',
    name: 'I Fund',
    fullName: 'International Stock Index Investment Fund',
    color: '#6A1B9A',
    risk: 'High',
    avgReturn: '5–8%',
    defaultRate: 0.065,
    description:
      'Tracks the MSCI EAFE Index — large-cap stocks from Europe, Australasia, and the Far East. ' +
      'Currency fluctuations affect returns. Provides international diversification ' +
      'and can outperform U.S. stocks during periods of a weak U.S. dollar.',
    bestFor: 'Geographic diversification. Reduces dependence on U.S. market performance. Consider 10–30% allocation.',
  },
];

export interface LFundAllocation {
  fund: string;
  pct: number;
}

export interface LFundInfo {
  id: string;
  targetDate: string;
  description: string;
  allocations: LFundAllocation[];
}

export const L_FUNDS: LFundInfo[] = [
  {
    id: 'L2025',
    targetDate: '2025 (income)',
    description: 'Most conservative — near or in retirement. Heavy bond allocation.',
    allocations: [
      { fund: 'G', pct: 69 }, { fund: 'F', pct: 6 }, { fund: 'C', pct: 13 },
      { fund: 'S', pct: 3 }, { fund: 'I', pct: 9 },
    ],
  },
  {
    id: 'L2030',
    targetDate: '2030',
    description: 'Conservative-moderate. Approaching retirement within 5 years.',
    allocations: [
      { fund: 'G', pct: 54 }, { fund: 'F', pct: 5 }, { fund: 'C', pct: 24 },
      { fund: 'S', pct: 6 }, { fund: 'I', pct: 11 },
    ],
  },
  {
    id: 'L2040',
    targetDate: '2040',
    description: 'Moderate. Good balance of growth and stability.',
    allocations: [
      { fund: 'G', pct: 25 }, { fund: 'F', pct: 4 }, { fund: 'C', pct: 42 },
      { fund: 'S', pct: 11 }, { fund: 'I', pct: 18 },
    ],
  },
  {
    id: 'L2050',
    targetDate: '2050',
    description: 'Growth-oriented. Long investment horizon.',
    allocations: [
      { fund: 'G', pct: 10 }, { fund: 'F', pct: 3 }, { fund: 'C', pct: 50 },
      { fund: 'S', pct: 14 }, { fund: 'I', pct: 23 },
    ],
  },
  {
    id: 'L2060',
    targetDate: '2060',
    description: 'Maximum growth. Youngest members with the longest horizon.',
    allocations: [
      { fund: 'G', pct: 5 }, { fund: 'F', pct: 2 }, { fund: 'C', pct: 52 },
      { fund: 'S', pct: 15 }, { fund: 'I', pct: 26 },
    ],
  },
];

function fvAnnuity(pmt: number, annualRate: number, months: number): number {
  if (annualRate === 0) return pmt * months;
  const r = annualRate / 12;
  return pmt * ((Math.pow(1 + r, months) - 1) / r);
}

export interface TspProjectionPoint {
  year: number;
  memberBalance: number;   // member contributions only
  totalBalance: number;    // member + govt match
}

export interface TspProjectionResult {
  points: TspProjectionPoint[];
  finalBalance: number;
  govtMatchMonthly: number;
  memberMonthly: number;
  matchLeftOnTable: number;   // monthly lost if contrib < 5%
  atLimit: boolean;
  annualContrib: number;
  limitAmount: number;
}

export function calcTspProjection(
  grade: PayGrade,
  yos: number,
  contribPct: number,       // 0–100
  annualReturn: number,     // decimal e.g. 0.07
  yearsToGrow: number,
  age: number,
): TspProjectionResult {
  const monthlyPay = getBasicPay(grade, yos);
  const rate = contribPct / 100;
  const memberMonthly = monthlyPay * rate;
  const govtRate = govtMatchRate(rate);
  const govtMonthly = monthlyPay * govtRate;
  const totalMonthly = memberMonthly + govtMonthly;

  const limit = annualLimit(age);
  const annualContrib = memberMonthly * 12;
  const atLimit = annualContrib >= limit;
  const capMonthly = atLimit ? limit / 12 : memberMonthly;
  const cappedTotal = capMonthly + govtMonthly;

  // Match left on table: difference between max match (5%) and current match
  const maxGovt = monthlyPay * govtMatchRate(0.05);
  const matchLeftOnTable = Math.max(0, maxGovt - govtMonthly);

  const months = yearsToGrow * 12;
  const points: TspProjectionPoint[] = [];

  for (let y = 0; y <= yearsToGrow; y++) {
    const m = y * 12;
    const memberBal = fvAnnuity(capMonthly, annualReturn, m);
    const totalBal = fvAnnuity(cappedTotal, annualReturn, m);
    points.push({ year: y, memberBalance: memberBal, totalBalance: totalBal });
  }

  return {
    points,
    finalBalance: points[points.length - 1]?.totalBalance ?? 0,
    govtMatchMonthly: govtMonthly,
    memberMonthly: capMonthly,
    matchLeftOnTable,
    atLimit,
    annualContrib,
    limitAmount: limit,
  };
}
