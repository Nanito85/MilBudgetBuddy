/**
 * Military Leave Calculator — logic.
 *
 * References:
 *  - 10 USC §701 — leave accrual (2.5 days/month), 60-day carryover limit.
 *  - 37 U.S.C. §501 — leave payout at separation: daily basic pay × days (max
 *    60 days across a career, effective 10 Feb 1976). Note: this is Title 37
 *    (Pay and Allowances), not Title 10 — a common miscitation to watch for.
 *  - DoD FMR Vol 7A Ch 35 — terminal leave procedures.
 *  - DoD Instruction 1327.06 — leave and liberty policy.
 *  - JAGINST / AR 600-8-10 — use-or-lose guidance.
 *
 * Leave accrual: 2.5 days per calendar month of active duty.
 * Use-or-lose: balance cannot exceed 60 days at fiscal year end (Sep 30).
 *   Exception: Special Leave Accrual (SLA) — for members serving in a combat
 *   zone/hostile-fire-pay area 120+ days, or otherwise approved by a flag/
 *   general officer for operational necessity — allows carryover up to 90
 *   days (60 standard + 30 SLA-protected), effective since 1 Jan 2023. This
 *   replaced an older, since-superseded 75-day figure from a 2008-2015 SLA
 *   window — 75 is NOT the current number, a stale figure previously used
 *   here and worth double-checking again if this code is revisited, since
 *   SLA policy has changed more than once.
 * Payout cap: only 60 days can be paid out across an entire career (37 U.S.C. §501(b)).
 * Daily rate: monthly basic pay ÷ 30 — the DFAS leave sell-back/terminal-leave
 * formula (base pay only, no BAH/BAS/special pays). This is NOT (monthly ×
 * 12) / 365 — verified against DFAS separation-finance guidance; using a
 * 365-day-year divisor understates the payout by ~1.4%.
 */

import { BASIC_PAY_DATA_YEAR, getBasicPay } from '@/data/basic-pay-rates';
import { PayGrade } from '@/data/bah-rates';

export { BASIC_PAY_DATA_YEAR };

export const ACCRUAL_PER_MONTH = 2.5;   // days
export const MAX_CARRYOVER = 60;         // days (standard cap, 10 USC §701)
export const SLA_MAX_CARRYOVER = 90;     // days (60 standard + 30 SLA-protected, effective 1 Jan 2023)
export const MAX_PAYOUT_DAYS = 60;       // days (separation payout cap, 37 U.S.C. §501)
export const DAYS_PER_MONTH = 30;        // DFAS leave daily-rate divisor

export interface LeaveInputs {
  grade: PayGrade;
  yos: number;
  currentBalance: number;     // days currently on the books
  monthsUntilEts: number;     // months from today until ETS/retirement date
  plannedLeaveDays: number;   // leave you plan to use before terminal (R&R, vacation, etc.)
  terminalLeaveDays: number;  // days of terminal leave at the end
  useOrLoseExempt: boolean;   // true = Special Leave Accrual allows 90-day carryover
  // Days of leave already sold back earlier in the career (the 60-day sell-back cap is for the
  // whole career, not per separation). Optional; defaults to 0.
  daysAlreadySold?: number;
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
  terminalLeaveValue: number;   // terminalLeaveDaysUsed × dailyRate (paid as regular pay)
  terminalLeaveDaysUsed: number; // terminal days you actually have the leave for (capped by balance)
  terminalStartOffset: number;  // months before ETS terminal leave begins

  // Use-or-lose warning
  maxCarryover: number;         // 60 or 90 depending on useOrLoseExempt
  uyLossRisk: number;           // days at risk of forfeiture (balance > maxCarryover at FY end)
  uyWarning: boolean;

  // Combined
  totalLeaveValue: number;      // payout + terminal leave pay
  dataYear: number;
}

export function calcLeave(inputs: LeaveInputs): LeaveResult {
  const { grade, yos, currentBalance, monthsUntilEts, plannedLeaveDays, terminalLeaveDays, useOrLoseExempt, daysAlreadySold = 0 } = inputs;

  const monthlyBasicPay = getBasicPay(grade, yos);
  const dailyRate = monthlyBasicPay / DAYS_PER_MONTH;

  const accrualTotal = monthsUntilEts * ACCRUAL_PER_MONTH;
  const maxCarryover = useOrLoseExempt ? SLA_MAX_CARRYOVER : MAX_CARRYOVER;

  // Raw projected balance at ETS after planned leave & terminal leave
  const projectedBalance = Math.max(
    0,
    currentBalance + accrualTotal - plannedLeaveDays - terminalLeaveDays,
  );

  // Only what is left of the 60-day career cap can be sold back.
  const payoutCapLeft = Math.max(0, MAX_PAYOUT_DAYS - Math.max(0, daysAlreadySold));
  const balanceAtEts = Math.min(projectedBalance, payoutCapLeft);
  const payableDays = balanceAtEts;
  const payoutValue = payableDays * dailyRate;

  // Terminal leave: member is still on the rolls and receiving full pay. It is taken FROM the leave
  // balance, so you cannot take (or be paid for) more terminal leave days than you will have after
  // your other planned leave: a 0-day balance with 30 terminal days used to "pay" 30 days.
  const leaveAvailableForTerminal = Math.max(0, currentBalance + accrualTotal - plannedLeaveDays);
  const safeTerm = Math.min(Math.max(0, terminalLeaveDays), leaveAvailableForTerminal);
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
    terminalLeaveDaysUsed: safeTerm,
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
