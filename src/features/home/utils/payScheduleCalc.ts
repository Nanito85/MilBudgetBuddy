/**
 * Pure pay-schedule date math — no React/React Native imports, so it can be
 * unit-verified directly (see scripts/verify-calculations.ts) without
 * pulling in react-native's Flow-typed source, which a plain Node/tsx run
 * can't transform. Used by PayDayCountdown.tsx.
 */

// Adjust for weekends: if payday falls on a weekend, it moves to the prior
// Friday. Federal holidays can also shift the actual DFAS deposit by a day
// or two beyond this — this app doesn't maintain a federal holiday
// calendar, so this is a close estimate, not a guarantee of the exact date.
export function adjustedPayDay(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 0) { const r = new Date(d); r.setDate(d.getDate() - 2); return r; }
  if (day === 6) { const r = new Date(d); r.setDate(d.getDate() - 1); return r; }
  return d;
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
