import { PayGrade } from '@/data/bah-rates';
import { getWeightAllowance, getRatePerLb } from '@/data/weight-allowances';

export type MoveType = 'full' | 'partial';
export type TaxBracket = 10 | 12 | 22 | 24 | 32;

export const TAX_BRACKETS: TaxBracket[] = [10, 12, 22, 24, 32];

export interface DITYInputs {
  grade: PayGrade;
  withDep: boolean;
  actualWeight: number;     // lbs member plans to move themselves
  distanceMiles: number;
  moveType: MoveType;
  taxBracket: TaxBracket;
}

export interface DITYResult {
  authorizedWeight: number;
  actualWeight: number;
  weightPct: number;           // 0–1
  ratePerLb: number;
  governmentCost: number;      // GCC estimate
  incentive: number;           // = governmentCost for full PPM
  afterTax: number;
  taxAmount: number;
  overAllowance: boolean;
  capped: boolean;             // actual weight exceeds authorized
  effectiveWeight: number;     // min(actual, authorized)
}

export function calcDITY(inputs: DITYInputs): DITYResult {
  const { grade, withDep, actualWeight, distanceMiles, taxBracket } = inputs;

  const authorizedWeight = getWeightAllowance(grade, withDep);
  const overAllowance = actualWeight > authorizedWeight;
  const effectiveWeight = Math.min(actualWeight, authorizedWeight);
  const weightPct = authorizedWeight > 0 ? effectiveWeight / authorizedWeight : 0;

  const ratePerLb = getRatePerLb(distanceMiles);
  const governmentCost = effectiveWeight * ratePerLb;

  // PPM incentive = 100% of the government constructed cost
  const incentive = governmentCost;
  const taxAmount = incentive * (taxBracket / 100);
  const afterTax = incentive - taxAmount;

  return {
    authorizedWeight,
    actualWeight,
    weightPct,
    ratePerLb,
    governmentCost,
    incentive,
    afterTax,
    taxAmount,
    overAllowance,
    capped: overAllowance,
    effectiveWeight,
  };
}

export function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtLbs(n: number): string {
  return `${n.toLocaleString()} lbs`;
}
