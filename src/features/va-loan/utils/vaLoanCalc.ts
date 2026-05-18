import { CONFORMING_LOAN_LIMIT, CONVENTIONAL_PMI_RATE, VAUsage, getFundingFee } from '@/data/va-loan-rates';

export interface VALoanInputs {
  homePrice: number;
  downPayment: number;         // $
  interestRate: number;        // % annual, e.g. 6.5
  loanTermYears: 15 | 30;
  usage: VAUsage;
  disabilityExempt: boolean;
  financeFundingFee: boolean;  // roll fee into loan vs. pay upfront
  annualPropertyTax: number;   // $
  annualInsurance: number;     // $
}

export interface VALoanResult {
  // Loan structure
  downPayment: number;
  downPct: number;
  baseLoanAmount: number;
  fundingFeePct: number;
  fundingFeeAmount: number;
  totalLoanAmount: number;     // base + financed fee (if applicable)
  aboveConforming: boolean;

  // Monthly breakdown
  monthlyPI: number;           // principal & interest
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyTotal: number;

  // Lifetime
  totalInterest: number;
  totalCost: number;           // payments + upfront costs

  // Conventional comparison (same price, same rate, 0% down — with PMI)
  conventionalMonthlyPI: number;
  conventionalMonthlyPMI: number;
  conventionalMonthlyTotal: number;
  monthlySavingsVsConventional: number;
  pmiSavingsLifetime: number;
}

function monthlyPayment(principal: number, annualRate: number, termYears: number): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calcVALoan(inputs: VALoanInputs): VALoanResult {
  const {
    homePrice, downPayment, interestRate, loanTermYears,
    usage, disabilityExempt, financeFundingFee,
    annualPropertyTax, annualInsurance,
  } = inputs;

  const downPct = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
  const baseLoanAmount = homePrice - downPayment;
  const fundingFeePct = getFundingFee(usage, downPct, disabilityExempt);
  const fundingFeeAmount = baseLoanAmount * (fundingFeePct / 100);

  const totalLoanAmount = financeFundingFee
    ? baseLoanAmount + fundingFeeAmount
    : baseLoanAmount;

  const aboveConforming = totalLoanAmount > CONFORMING_LOAN_LIMIT;

  const monthlyPI = monthlyPayment(totalLoanAmount, interestRate, loanTermYears);
  const monthlyTax = annualPropertyTax / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyTotal = monthlyPI + monthlyTax + monthlyInsurance;

  const n = loanTermYears * 12;
  const totalInterest = monthlyPI * n - totalLoanAmount;
  const upfrontCost = financeFundingFee ? 0 : fundingFeeAmount;
  const totalCost = monthlyPI * n + upfrontCost;

  // Conventional comparison: no down, same loan amount, add PMI
  const conventionalLoan = homePrice; // 0% down
  const conventionalMonthlyPI = monthlyPayment(conventionalLoan, interestRate, loanTermYears);
  const conventionalMonthlyPMI = (conventionalLoan * CONVENTIONAL_PMI_RATE) / 12;
  const conventionalMonthlyTotal = conventionalMonthlyPI + conventionalMonthlyPMI + monthlyTax + monthlyInsurance;

  // PMI typically drops off when LTV reaches 80% — approximate months to 80%
  // For simplicity, estimate lifetime savings if PMI lasted full term
  const pmiSavingsLifetime = conventionalMonthlyPMI * n;
  const monthlySavingsVsConventional = conventionalMonthlyTotal - monthlyTotal;

  return {
    downPayment,
    downPct,
    baseLoanAmount,
    fundingFeePct,
    fundingFeeAmount,
    totalLoanAmount,
    aboveConforming,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyTotal,
    totalInterest,
    totalCost,
    conventionalMonthlyPI,
    conventionalMonthlyPMI,
    conventionalMonthlyTotal,
    monthlySavingsVsConventional,
    pmiSavingsLifetime,
  };
}

export function fmtMoney(n: number, compact = false): string {
  if (compact && n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtMoneyExact(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
