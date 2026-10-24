/**
 * Pure pay-schedule date math — no React/React Native imports, so it can be
 * unit-verified directly (see scripts/verify-calculations.ts) without
 * pulling in react-native's Flow-typed source, which a plain Node/tsx run
 * can't transform. Used by PayDayCountdown.tsx.
 */

// The federal holidays that can land on a 1st or 15th payday: New Year's Day
// (always Jan 1), MLK Day and Presidents' Day (3rd Monday, the 15th–21st),
// and Labor Day (1st Monday of September). The others never fall on either.
function nthMonday(year: number, month: number, n: number): number {
  const firstDow = new Date(year, month, 1).getDay();
  const firstMonday = 1 + ((8 - firstDow) % 7);
  return firstMonday + (n - 1) * 7;
}

export function isPaydayHoliday(d: Date): boolean {
  const m = d.getMonth();
  const day = d.getDate();
  const y = d.getFullYear();
  if (m === 0 && day === 1) return true;
  if ((m === 0 || m === 1) && day === nthMonday(y, m, 3)) return true;
  if (m === 8 && day === nthMonday(y, m, 1)) return true;
  return false;
}

// DFAS pays on the preceding business day when the 1st or 15th falls on a
// weekend or federal holiday (so Jan 1 pay lands on Dec 31 or earlier).
export function adjustedPayDay(d: Date): Date {
  const r = new Date(d);
  while (r.getDay() === 0 || r.getDay() === 6 || isPaydayHoliday(r)) {
    r.setDate(r.getDate() - 1);
  }
  return r;
}

/**
 * Next pay day for the given schedule.
 * - Active duty / reserve: semi-monthly, the 1st and 15th.
 * - Retired: monthly, the 1st only — military retired pay is a single
 *   monthly disbursement (DFAS Retired & Annuitant Pay schedule), NOT the
 *   active-duty 1st-and-15th split.
 */
export function getPayDayInfo(isRetired: boolean): { label: string; daysAway: number; date: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const todayMidnight = new Date(year, month, today);
  function daysUntil(target: Date): number {
    return Math.round((target.getTime() - todayMidnight.getTime()) / 86400000);
  }

  const nextFirst = adjustedPayDay(new Date(year, month + 1, 1));

  if (isRetired) {
    const adj1st = adjustedPayDay(new Date(year, month, 1));
    const candidates: Array<{ label: string; date: Date }> = [
      { label: '1st', date: adj1st },
      { label: '1st', date: nextFirst },
    ];
    for (const c of candidates) {
      const d = daysUntil(c.date);
      if (d >= 0) return { ...c, daysAway: d };
    }
    return { label: '1st', date: nextFirst, daysAway: daysUntil(nextFirst) };
  }

  const adj1st = adjustedPayDay(new Date(year, month, 1));
  const adj15th = adjustedPayDay(new Date(year, month, 15));

  const candidates: Array<{ label: string; date: Date }> = [
    { label: '1st', date: adj1st },
    { label: '15th', date: adj15th },
    { label: '1st', date: nextFirst },
  ];

  for (const c of candidates) {
    const d = daysUntil(c.date);
    if (d >= 0) return { ...c, daysAway: d };
  }

  // Fallback — should never reach
  return { label: '1st', date: nextFirst, daysAway: daysUntil(nextFirst) };
}
