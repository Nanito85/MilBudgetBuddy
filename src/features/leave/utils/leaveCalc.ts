/**
 * Military Leave Calculator — logic.
 *
 * References:
 *  - 10 USC §701 — leave accrual (2.5 days/month), 60-day carryover limit.
 *  - 10 USC §501 — leave payout at separation: daily basic pay × days (max 60 days).
 *  - DoD FMR Vol 7A Ch 35 — terminal leave procedures.
 *  - DoD Instruction 1327.06 — leave and liberty policy.
 *  - JAGINST / AR 600-8-10 — use-or-lose guidance.
 *
 * Leave accrual: 2.5 days per calendar month of active duty.
 * Use-or-lose: balance cannot exceed 60 days at fiscal year end (Sep 30).
 *   Exception: members whose leave was denied may carry up to 75 days.
 * Payout cap: only 60 days can be paid out at separation (10 USC §501(b)).
 * Daily rate: (monthly basic pay × 12) / 365.
 */

import { BASIC_PAY_DATA_YEAR, getBasicPay } from '@/data/basic-pay-rates';
import { PayGrade } from '@/data/bah-rates';

export { BASIC_PAY_DATA_YEAR };

export const ACCRUAL_PER_MONTH = 2.5;   // days
export const MAX_CARRYOVER = 60;         // days (standard cap, 10 USC §701)
export const MAX_PAYOUT_DAYS = 60;       // days (separation payout cap, 10 USC §501)
export const DAYS_PER_YEAR = 365;

export interface LeaveInputs {
  grade: PayGrade;
  yos: number;
  currentBalance: number;     // days currently on the books
  monthsUntilEts: number;     // months from today until ETS/retirement date
  plannedLeaveDays: number;   // leave you plan to use before terminal (R&R, vacation, etc.)
  terminalLeaveDays: number;  // days of terminal leave at the end
  useOrLoseExempt: boolean;   // true = denied-leave exception allows 75-day carryover
}

export interface LeaveResult {
  dailyRate: number;            // $/day
  monthlyBasicPay: number;

  // Projected leave balance
  accrualTotal: number;         // days accrued over monthsUntilEts
  projectedBalance: number;     // currentBalance + accrualTotal − plannedLeaveDays − terminalLeaveDays
  balanceAtEts: number;         // capped at MAX_PAYOUT_DAYS for payout

  // Payout
  payableDays: number;          // min(projectedBalance, MAX_PAYOUT_DAYS)
  payoutValue: number;          // payableDays × dailyRate

  // Terminal leave window
  terminalLeaveValue: number;   // terminalLeaveDays × dailyRate (paid as regular pay)
  terminalStartOffset: number;  // months before ETS terminal leave begins

  // Use-or-lose warning
  maxCarryover: number;         // 60 or 75 depending on useOrLoseExempt
  uyLossRisk: number;           // days at risk of forfeiture (balance > maxCarryover at FY end)
  uyWarning: boolean;

  // Combined
  totalLeaveValue: number;      // payout + terminal leave pay
  dataYear: number;
}

export function calcLeave(inputs: LeaveInputs): LeaveResult {
  const { grade, yos, currentBalance, monthsUntilEts, plannedLeaveDays, terminalLeaveDays, useOrLoseExempt } = inputs;

  const monthlyBasicPay = getBasicPay(grade, yos);
  const annualBasicPay = monthlyBasicPay * 12;
  const dailyRate = annualBasicPay / DAYS_PER_YEAR;

  const accrualTotal = monthsUntilEts * ACCRUAL_PER_MONTH;
  const maxCarryover = useOrLoseExempt ? 75 : MAX_CARRYOVER;

  // Raw projected balance at ETS after planned leave & terminal leave
  const projectedBalance = Math.max(
    0,
    currentBalance + accrualTotal - plannedLeaveDays - terminalLeaveDays,
  );

  const balanceAtEts = Math.min(projectedBalance, MAX_PAYOUT_DAYS);
  const payableDays = balanceAtEts;
  const payoutValue = payableDays * dailyRate;

  // Terminal leave: member is still on the rolls and receiving full pay
  const safeTerm = Math.max(0, terminalLeaveDays);
  const terminalLeaveValue = safeTerm * dailyRate;

  // Months into ETS when terminal leave begins
  const terminalStartOffset = Math.max(0, monthsUntilEts - safeTerm / 30);

  // Use-or-lose: rough FY-end check
  // If currentBalance + projected accrual (through next Sep 30) would exceed maxCarryover
  const today = new Date();
  const nextFYEnd = new Date(today.getFullYear(), 8, 30); // Sep 30
  if (nextFYEnd <= today) nextFYEnd.setFullYear(today.getFullYear() + 1);
  const monthsToFYEnd = Math.max(
    0,
    (nextFYEnd.getFullYear() - today.getFullYear()) * 12 +
      nextFYEnd.getMonth() - today.getMonth(),
  );
  const balAtFYEnd = currentBalance + monthsToFYEnd * ACCRUAL_PER_MONTH - plannedLeaveDays;
  const uyLossRisk = Math.max(0, balAtFYEnd - maxCarryover);
  const uyWarning = uyLossRisk > 0;

  const totalLeaveValue = payoutValue + terminalLeaveValue;

  return {
    dailyRate,
    monthlyBasicPay,
    accrualTotal,
    projectedBalance,
    balanceAtEts,
    payableDays,
    payoutValue,
    terminalLeaveValue,
    terminalStartOffset,
    maxCarryover,
    uyLossRisk,
    uyWarning,
    totalLeaveValue,
    dataYear: BASIC_PAY_DATA_YEAR,
  };
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function fmtMoneyDec(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDays(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return `${rounded} day${rounded === 1 ? '' : 's'}`;
}
