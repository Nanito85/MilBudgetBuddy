import { PayGrade } from '@/data/bah-rates';
import {
  getRatePerLb,
  getWeightAllowance,
  PPM_FEDERAL_WITHHOLDING_PCT,
  PPM_INCENTIVE_PCT,
  PRO_GEAR_MEMBER_LBS,
  PRO_GEAR_SPOUSE_LBS,
} from '@/data/weight-allowances';

export type MoveType = 'full' | 'partial';
export type TaxBracket = 10 | 12 | 22 | 24 | 32;

export const TAX_BRACKETS: TaxBracket[] = [10, 12, 22, 24, 32];

export interface DITYInputs {
  grade: PayGrade;
  withDep: boolean;
  hasSpouse: boolean;       // for spouse pro-gear eligibility
  actualWeight: number;     // lbs of household goods (HHG) the member plans to move
  proGearWeight: number;    // lbs of the member's declared pro-gear (0 - 2,000)
  spouseProGearWeight: number; // lbs of spouse's declared pro-gear (0 - 500)
  distanceMiles: number;
  moveType: MoveType;
  allowableExpenses: number; // substantiated PPM moving costs (rental truck, packing
                              // materials, tolls/fuel for the rental vehicle, weighing
                              // fees, hired labor, SIT ≤90 days) — reduces taxable income
  taxBracket: TaxBracket;    // member's estimated marginal federal bracket
}

export interface DITYResult {
  hhgAllowance: number;        // HHG-only authorized weight (JTR Table 5-37)
  proGearCap: number;          // max declarable pro-gear (member + spouse if applicable)
  totalAuthorizedWeight: number; // hhgAllowance + proGearCap
  actualWeight: number;
  proGearWeight: number;
  spouseProGearWeight: number;
  totalRequestedWeight: number; // HHG + declared pro-gear
  weightPct: number;            // 0–1, of HHG allowance only
  ratePerLb: number;
  effectiveWeight: number;      // min(totalRequestedWeight, totalAuthorizedWeight) — what gets paid
  governmentCost: number;       // GCC estimate = effectiveWeight * ratePerLb
  incentive: number;            // = governmentCost * PPM_INCENTIVE_PCT (100% of GCC)
  overAllowance: boolean;
  capped: boolean;              // requested weight exceeds total authorized weight

  // ── Tax / cash flow ──────────────────────────────────────────────────────────
  allowableExpenses: number;          // as entered, capped at the incentive amount
  taxableAfterExpenses: number;       // incentive - allowableExpenses, floor 0
  federalWithholdingAtSettlement: number; // DFAS withholds 22% of the FULL incentive at payout
  cashAtSettlement: number;           // incentive - federalWithholdingAtSettlement (what hits your bank account)
  estimatedTrueTaxLiability: number;  // taxableAfterExpenses * marginal bracket — your real liability once you file
  refundOrOwedAtFiling: number;       // withheld - trueLiability; positive = refund, negative = you owe
  finalNetProfit: number;             // incentive - allowableExpenses - estimatedTrueTaxLiability
  afterTax: number;                   // legacy alias for finalNetProfit
  taxAmount: number;                  // legacy alias for estimatedTrueTaxLiability
}

export function calcDITY(inputs: DITYInputs): DITYResult {
  const {
    grade, withDep, hasSpouse, actualWeight, distanceMiles, taxBracket,
    proGearWeight = 0, spouseProGearWeight = 0, allowableExpenses = 0,
  } = inputs;

  const hhgAllowance = getWeightAllowance(grade, withDep);
  const proGearCap = PRO_GEAR_MEMBER_LBS + (hasSpouse ? PRO_GEAR_SPOUSE_LBS : 0);
  const totalAuthorizedWeight = hhgAllowance + proGearCap;

  const cappedProGear = Math.min(Math.max(0, proGearWeight), PRO_GEAR_MEMBER_LBS);
  const cappedSpouseProGear = hasSpouse ? Math.min(Math.max(0, spouseProGearWeight), PRO_GEAR_SPOUSE_LBS) : 0;

  const totalRequestedWeight = actualWeight + cappedProGear + cappedSpouseProGear;
  const overAllowance = totalRequestedWeight > totalAuthorizedWeight;
  const effectiveWeight = Math.min(totalRequestedWeight, totalAuthorizedWeight);
  const weightPct = hhgAllowance > 0 ? Math.min(actualWeight, hhgAllowance) / hhgAllowance : 0;

  const ratePerLb = getRatePerLb(distanceMiles);
  const governmentCost = effectiveWeight * ratePerLb;
  const incentive = governmentCost * PPM_INCENTIVE_PCT;

  // ── Tax / cash flow ──────────────────────────────────────────────────────────
  const cappedExpenses = Math.min(Math.max(0, allowableExpenses), incentive);
  const taxableAfterExpenses = Math.max(0, incentive - cappedExpenses);

  const federalWithholdingAtSettlement = incentive * PPM_FEDERAL_WITHHOLDING_PCT;
  const cashAtSettlement = incentive - federalWithholdingAtSettlement;

  const estimatedTrueTaxLiability = taxableAfterExpenses * (taxBracket / 100);
  const refundOrOwedAtFiling = federalWithholdingAtSettlement - estimatedTrueTaxLiability;
  const finalNetProfit = incentive - cappedExpenses - estimatedTrueTaxLiability;

  return {
    hhgAllowance,
    proGearCap,
    totalAuthorizedWeight,
    actualWeight,
    proGearWeight: cappedProGear,
    spouseProGearWeight: cappedSpouseProGear,
    totalRequestedWeight,
    weightPct,
    ratePerLb,
    effectiveWeight,
    governmentCost,
    incentive,
    overAllowance,
    capped: overAllowance,
    allowableExpenses: cappedExpenses,
    taxableAfterExpenses,
    federalWithholdingAtSettlement,
    cashAtSettlement,
    estimatedTrueTaxLiability,
    refundOrOwedAtFiling,
    finalNetProfit,
    afterTax: finalNetProfit,
    taxAmount: estimatedTrueTaxLiability,
  };
}

export function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtMoneySigned(n: number): string {
  const sign = n >= 0 ? '+' : '−';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString()}`;
}

export function fmtLbs(n: number): string {
  return `${n.toLocaleString()} lbs`;
}
