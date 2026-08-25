/**
 * Deployment Pay Estimator — calculation logic.
 *
 * References:
 *  - IDP/HFP: DoD FMR Vol 7A Ch 10 — $225/month flat, any portion of month counts.
 *  - CZTE: 26 U.S.C. §112 — Enlisted & WO: all basic pay excluded; Officers: capped at
 *    highest enlisted (E9) pay + IDP ($225).
 *  - FSA: DoD FMR Vol 7A Ch 27 — $300/month after 30 consecutive days of separation (FY2026 rate).
 *  - HDP-L: DoD FMR Vol 7A Ch 17 — $50/$100/$150/month by location designation.
 *  - SDP: DoD FMR Vol 7A Ch 51 — 10% APR on deposits up to $10,000 while in combat zone.
 *  - BAH continues to a member's dependent household during deployment (DoD FMR Vol 7A Ch 26).
 */

import { BASIC_PAY_DATA_YEAR, getBasicPay } from '@/data/basic-pay-rates';
import { BAS_DATA_YEAR, getBAS } from '@/data/bas-rates';
import { PayGrade } from '@/data/bah-rates';

export { BASIC_PAY_DATA_YEAR, BAS_DATA_YEAR };

export type ZoneType =
  | 'czte'       // Combat Zone — IDP + federal tax exclusion
  | 'idp_only'   // IDP-designated area (no CZTE)
  | 'hdp_only';  // Hardship Duty Pay location only

export type HdpLevel = 0 | 50 | 100 | 150;

export type TaxBracket = 10 | 12 | 22 | 24 | 32 | 35 | 37;

export interface DeploymentInputs {
  grade: PayGrade;
  yos: number;
  months: number;
  zoneType: ZoneType;
  hasDependents: boolean;
  hasBAH: boolean;
  monthlyBAH: number;
  hdpLevel: HdpLevel;
  taxBracket: TaxBracket;
  sdpDeposit: number;   // amount deposited to SDP (0–10000)
}

export interface MonthlyBreakdown {
  basicPay: number;
  bah: number;
  bas: number;
  idp: number;
  fsa: number;
  hdp: number;
  grossTotal: number;
  federalTaxNormal: number;   // estimated tax without CZTE
  czteSavings: number;        // tax saved by CZTE exclusion
  netTotal: number;           // gross − federal tax after CZTE
}

export interface DeploymentResult {
  monthly: MonthlyBreakdown;
  totalGross: number;
  totalTaxSavings: number;
  totalExtraVsHome: number;   // extra money vs a normal non-deployment month
  sdpInterest: number;        // estimated SDP interest earned
  normalMonthNet: number;     // estimated normal take-home for comparison
  dataYear: { pay: number; bas: number };
}

// CZTE officer cap = highest enlisted (E9) basic pay + $225 IDP (26 U.S.C. §112).
// Derived from the canonical basic-pay-rates.ts table rather than duplicated
// here, so it can't drift out of sync with the real E9 pay chart.
const E9_MAX_PAY = getBasicPay('E9', 40);
const IDP_MONTHLY = 225;
const FSA_MONTHLY = 300;
const SDP_APR = 0.10;
// Same rate calcLES uses (src/features/home/utils/lesCalc.ts) — kept in sync
// so "take-home" means the same thing here as it does on Home/Pay Chart/
// Budget. CZTE exempts basic pay from federal INCOME tax only; FICA still
// applies in a combat zone, so it can't be dropped from either side of this
// comparison without both "take-home" figures below silently overstating
// actual net pay by ~7.65% of basic pay.
const FICA_RATE = 0.0765;

export function calcDeployment(inputs: DeploymentInputs): DeploymentResult {
  const {
    grade,
    yos,
    months,
    zoneType,
    hasDependents,
    hasBAH,
    monthlyBAH,
    hdpLevel,
    taxBracket,
    sdpDeposit,
  } = inputs;

  const basicPay = getBasicPay(grade, yos);
  const bas = getBAS(grade);
  const bah = hasBAH ? monthlyBAH : 0;

  const isOfficer = grade.startsWith('O');
  const idp = zoneType === 'czte' || zoneType === 'idp_only' ? IDP_MONTHLY : 0;
  const fsa = hasDependents && (zoneType === 'czte' || zoneType === 'idp_only') ? FSA_MONTHLY : 0;
  const hdp = hdpLevel;

  const grossTotal = basicPay + bah + bas + idp + fsa + hdp;

  // CZTE tax exclusion — only basic pay is taxable; BAH/BAS are always tax-free
  let czteExcluded = 0;
  if (zoneType === 'czte') {
    if (isOfficer) {
      czteExcluded = Math.min(basicPay, E9_MAX_PAY + IDP_MONTHLY);
    } else {
      czteExcluded = basicPay; // all basic pay excluded for enlisted/WO
    }
  }

  const taxablePayNormal = basicPay;
  const taxablePayCzte = Math.max(0, basicPay - czteExcluded);
  const rate = taxBracket / 100;

  const federalTaxNormal = taxablePayNormal * rate;
  const federalTaxCzte = taxablePayCzte * rate;
  const czteSavings = federalTaxNormal - federalTaxCzte;
  const fica = basicPay * FICA_RATE;

  const netTotal = grossTotal - federalTaxCzte - fica;

  // Comparison: normal month at home (no deployment pays)
  const normalMonthGross = basicPay + bah + bas;
  const normalMonthNet = normalMonthGross - federalTaxNormal - fica;

  // Extra per month vs home
  const extraPerMonth = netTotal - normalMonthNet;

  // SDP interest — simple interest at 10% APR over the deployment months
  const sdpInterest = sdpDeposit > 0 ? sdpDeposit * SDP_APR * (months / 12) : 0;

  return {
    monthly: {
      basicPay,
      bah,
      bas,
      idp,
      fsa,
      hdp,
      grossTotal,
      federalTaxNormal,
      czteSavings,
      netTotal,
    },
    totalGross: grossTotal * months,
    totalTaxSavings: czteSavings * months,
    totalExtraVsHome: extraPerMonth * months + sdpInterest,
    sdpInterest,
    normalMonthNet,
    dataYear: { pay: BASIC_PAY_DATA_YEAR, bas: BAS_DATA_YEAR },
  };
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
