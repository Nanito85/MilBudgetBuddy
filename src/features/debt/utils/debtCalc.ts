import { Debt } from '@/store/debt.store';

export type PayoffStrategy = 'avalanche' | 'snowball';

export interface DebtPayoffRow {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  monthsToPayoff: number;
  totalPaid: number;
  totalInterest: number;
  payoffDate: Date;
}

export interface PayoffResult {
  rows: DebtPayoffRow[];
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
  payoffDate: Date;
  monthlyCost: number;   // min payments + extra
}

interface SimDebt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  paidOffMonth: number | null;
  totalInterest: number;
  totalPaid: number;
}

export function calcPayoff(
  debts: Debt[],
  extraMonthly: number,
  strategy: PayoffStrategy,
): PayoffResult | null {
  if (debts.length === 0) return null;

  const sim: SimDebt[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    paidOffMonth: null,
    totalInterest: 0,
    totalPaid: 0,
  }));

  const totalMin = sim.reduce((s, d) => s + d.minPayment, 0);
  const totalPayment = totalMin + extraMonthly;

  let month = 0;
  const MAX_MONTHS = 600;  // 50 years safety cap

  while (sim.some((d) => d.balance > 0) && month < MAX_MONTHS) {
    month++;

    // Pick the target debt for extra payment
    const active = sim.filter((d) => d.balance > 0);
    let targetId: string | null = null;

    if (active.length > 0) {
      if (strategy === 'avalanche') {
        // Highest APR first
        const sorted = [...active].sort((a, b) => b.apr - a.apr);
        targetId = sorted[0].id;
      } else {
        // Smallest balance first
        const sorted = [...active].sort((a, b) => a.balance - b.balance);
        targetId = sorted[0].id;
      }
    }

    // Collect freed minimums from already-paid debts
    let snowballExtra = extraMonthly;
    for (const d of sim) {
      if (d.paidOffMonth !== null) snowballExtra += d.minPayment;
    }

    for (const d of sim) {
      if (d.balance <= 0) continue;

      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.totalInterest += interest;

      let payment = d.minPayment;
      if (d.id === targetId) payment += snowballExtra - extraMonthly;
      if (d.id === targetId) payment += extraMonthly;

      payment = Math.min(payment, d.balance + interest);
      d.totalPaid += payment;
      d.balance = Math.max(0, d.balance + interest - payment);

      if (d.balance === 0 && d.paidOffMonth === null) {
        d.paidOffMonth = month;
      }
    }
  }

  const today = new Date();
  const rows: DebtPayoffRow[] = sim
    .map((d) => {
      const months = d.paidOffMonth ?? month;
      const payoffDate = new Date(today.getFullYear(), today.getMonth() + months, 1);
      return {
        id: d.id,
        name: d.name,
        balance: debts.find((x) => x.id === d.id)!.balance,
        apr: d.apr,
        minPayment: d.minPayment,
        monthsToPayoff: months,
        totalPaid: Math.round(d.totalPaid),
        totalInterest: Math.round(d.totalInterest),
        payoffDate,
      };
    })
    .sort((a, b) => a.monthsToPayoff - b.monthsToPayoff);

  const payoffDate = new Date(today.getFullYear(), today.getMonth() + month, 1);

  return {
    rows,
    totalMonths: month,
    totalInterest: Math.round(sim.reduce((s, d) => s + d.totalInterest, 0)),
    totalPaid: Math.round(sim.reduce((s, d) => s + d.totalPaid, 0)),
    payoffDate,
    monthlyCost: totalPayment,
  };
}

export function fmtMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}yr`;
  return `${y}yr ${m}mo`;
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
