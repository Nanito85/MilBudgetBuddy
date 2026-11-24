/**
 * Historical military pay raises and retired-pay COLAs.
 *
 * Retired pay is NOT based on today's pay table: it is the average of the
 * member's basic pay over the 36 months BEFORE they retired (High-3), in the
 * dollars of those years, then grown each December by the retiree COLA
 * (the same CPI-W adjustment Social Security uses). Someone who retired in
 * 2020 therefore starts from the 2018-2020 pay tables and gets the 2020-2025
 * COLAs — not the 2026 basic pay raise.
 *
 * The app only ships the current pay table (BASIC_PAY_DATA_YEAR), so earlier
 * tables are rebuilt by backing each later year's across-the-board raise out
 * of it. That is accurate to within rounding for most grades (targeted raises
 * to specific grades are not captured).
 */
import { BASIC_PAY_DATA_YEAR, getBasicPay } from './basic-pay-rates';
import type { PayGrade } from './bah-rates';

/** Across-the-board basic pay raise effective Jan 1 of the given year (%). */
const PAY_RAISE_PCT: Record<number, number> = {
  2000: 4.8, 2001: 3.7, 2002: 6.9, 2003: 4.15, 2004: 4.15, 2005: 3.5, 2006: 3.1,
  2007: 2.2, 2008: 3.5, 2009: 3.9, 2010: 3.4, 2011: 1.4, 2012: 1.6, 2013: 1.7,
  2014: 1.0, 2015: 1.0, 2016: 1.3, 2017: 2.1, 2018: 2.4, 2019: 2.6, 2020: 3.1,
  2021: 3.0, 2022: 2.7, 2023: 4.6, 2024: 5.2, 2025: 4.5, 2026: 3.8,
};
/** Used for any year before the table above starts. */
const FALLBACK_RAISE_PCT = 3.0;

/** Retiree COLA effective Dec 1 of the given year (%). */
const RETIREE_COLA_PCT: Record<number, number> = {
  2000: 3.5, 2001: 2.6, 2002: 1.4, 2003: 2.1, 2004: 2.7, 2005: 4.1, 2006: 3.3,
  2007: 2.3, 2008: 5.8, 2009: 0, 2010: 0, 2011: 3.6, 2012: 1.7, 2013: 1.5,
  2014: 1.7, 2015: 0, 2016: 0.3, 2017: 2.0, 2018: 2.8, 2019: 1.6, 2020: 1.3,
  2021: 5.9, 2022: 8.7, 2023: 3.2, 2024: 2.5, 2025: 2.8,
};
const FALLBACK_COLA_PCT = 2.5;
const LATEST_KNOWN_COLA_YEAR = 2025;

function parseYmd(date: string | undefined): { y: number; m: number; d: number } | null {
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
  if (m < 1 || m > 12) return null;
  return { y, m, d };
}

/** Multiplier turning a current-table pay figure into what that year's table paid. */
function payTableFactor(year: number): number {
  let factor = 1;
  for (let y = year + 1; y <= BASIC_PAY_DATA_YEAR; y++) {
    factor /= 1 + (PAY_RAISE_PCT[y] ?? FALLBACK_RAISE_PCT) / 100;
  }
  return factor;
}

export interface RetiredPayHistory {
  /** 36-month average basic pay, in the dollars of the retirement years. */
  high3: number;
  /** Cumulative retiree COLA growth since retirement (1 = none yet). */
  colaFactor: number;
}

/**
 * High-3 (in the pay-table dollars of the 36 months before retirement) and the
 * COLA growth earned since. Returns null without a valid retirement date, so
 * callers can fall back to the current-table approximation.
 *
 * Assumes the member held `grade` through the whole window, same as the
 * quick-estimate High-3 elsewhere in the app.
 */
export function getRetiredPayHistory(
  grade: PayGrade,
  yosAtRetirement: number,
  retirementDate: string | undefined,
  now: Date = new Date(),
): RetiredPayHistory | null {
  const ret = parseYmd(retirementDate);
  if (!ret) return null;

  let total = 0;
  for (let m = 0; m < 36; m++) {
    // Month index counted back from the retirement month.
    const idx = ret.y * 12 + (ret.m - 1) - m;
    const year = Math.floor(idx / 12);
    const yosThen = Math.max(0, yosAtRetirement - m / 12);
    total += getBasicPay(grade, yosThen) * payTableFactor(year);
  }
  const high3 = total / 36;

  // COLAs take effect Dec 1. The first one after retirement is prorated by the
  // months actually retired (capped at a full year).
  const retMonths = ret.y * 12 + (ret.m - 1);
  let colaFactor = 1;
  let first = true;
  for (let y = ret.y; y <= LATEST_KNOWN_COLA_YEAR; y++) {
    const dec1Months = y * 12 + 11;
    if (dec1Months < retMonths + (ret.d > 1 ? 1 : 0)) continue; // retired after this Dec 1
    if (new Date(y, 11, 1) > now) break;
    const pct = (RETIREE_COLA_PCT[y] ?? FALLBACK_COLA_PCT) / 100;
    const share = first ? Math.min(1, Math.max(0, (dec1Months - retMonths) / 12)) : 1;
    colaFactor *= 1 + pct * share;
    first = false;
  }
  return { high3, colaFactor };
}
