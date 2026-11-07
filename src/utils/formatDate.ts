export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Today as YYYY-MM-DD in the DEVICE's local time zone (toISOString() is UTC, which is already "tomorrow" on a US evening). */
export function localISODate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** This month as YYYY-MM in local time. */
export function localMonthKey(d: Date = new Date()): string {
  return localISODate(d).slice(0, 7);
}

/** "November 2026" for a YYYY-MM key, built from local parts (new Date('2026-11-01') is UTC and shows October in US zones). */
export function monthKeyLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function weekOfYear(): number {
  return Math.floor(dayOfYear() / 7);
}
