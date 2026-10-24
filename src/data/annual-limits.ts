/**
 * IRS retirement-account limits for one tax year — the single source for
 * every screen and tip that quotes them (they used to be typed into ~8
 * strings separately, so next year's update would have missed some).
 * Tax year 2026, IRS Notice 2025-67. The IRS publishes the next year's
 * limits around November; they take effect January 1.
 */
export const LIMITS_YEAR = 2026;

export const TSP_ELECTIVE_LIMIT      = 24_500; // employee deferrals, traditional + Roth combined
export const TSP_CATCHUP_50          = 8_000;  // age 50+ (and 64+)
export const TSP_SUPER_CATCHUP_60_63 = 11_250; // ages 60–63 (SECURE 2.0)
export const ANNUAL_ADDITIONS_LIMIT  = 72_000; // all contributions incl. tax-exempt combat-zone pay (IRC 415(c))
export const IRA_LIMIT               = 7_500;
export const IRA_CATCHUP_50          = 1_100;

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
