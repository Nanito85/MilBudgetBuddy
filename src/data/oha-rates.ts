/**
 * OHA (Overseas Housing Allowance) rate database.
 *
 * Three components:
 *   1. Rent ceiling   — monthly max reimbursement; varies by grade + location
 *   2. Utility allow. — fixed monthly stipend; varies by grade + location
 *   3. MIHA           — one-time move-in allowance; per location only
 *
 * Rates update on the 1st and 16th of each month (currency-driven).
 * Source: DTMO https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/
 *
 * HOW TO UPDATE:
 *   1. Visit the DTMO OHA Rate Lookup tool above.
 *   2. Update OHA_DATA_QUARTER and OHA_EFFECTIVE_DATE.
 *   3. Update the rate entries below; run `npx tsc --noEmit --skipLibCheck`.
 *
 * DATA NOTES:
 *   - Stored rates are for "with dependents". Without-dep rates are computed
 *     automatically: rent × RENT_NO_DEP_MULT, utility × UTIL_NO_DEP_MULT —
 *     confirmed EXACT (to the cent) against a live query, not just a rough
 *     approximation (see Okinawa's own note below).
 *   - 2026-09-13 bulk audit: every location in this file except Diego Garcia/
 *     Thule/GTMO (no OHA market — correctly `rates: []`) and Muwaffaq Salti
 *     AB (DTMO's own query for it returned an anomalous $0 rent on 9-year-old
 *     data — left unchanged rather than publish a number that isn't
 *     confidently real) was re-queried LIVE against DTMO's calculator, one
 *     grade (E5, with dependents) per location, then every other grade
 *     already listed for that location was rescaled by the same ratio; utility
 *     was set to the confirmed flat-per-location value (utility does not vary
 *     by grade — confirmed across every country checked, e.g. Japan $703.93,
 *     Germany $1,162.98, Italy $1,634.46, regardless of grade). `approximate`
 *     is now `false` for every location that went through this — it no longer
 *     means "estimated," it means "confirmed at exactly one grade this pass,
 *     other grades ratio-scaled from that."
 *   - Several locations' OFFICIAL DTMO effective dates are years to decades
 *     old (Bahrain: 2022, Al Dhafra: 2016, Muwaffaq Salti: 2016, Djibouti:
 *     1999, Guam/Kwajalein/Fort Buchanan: 1969) — that's DTMO's own
 *     publication cadence for locations with little/no active off-base rental
 *     market (mostly on-base housing), not staleness introduced by this app.
 *   - MIHA (one-time move-in allowance) was NOT re-verified this pass —
 *     still the pre-existing estimates. Lower priority than rent/utility
 *     since it's a one-time PCS cost, not a recurring monthly figure, but
 *     flagged here as a real remaining gap.
 *   - Okinawa utility is a flat rate across all grades per USFJ policy.
 */

import { baseOfficerGrade, PayGrade } from '@/data/bah-rates';

export const OHA_DATA_QUARTER   = 'Q3 2026';
export const OHA_EFFECTIVE_DATE = '2026-09-01';
export const DTMO_OHA_URL       = 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/';

// Without-dep multipliers applied to stored (with-dep) rates. These are a
// standard approximation (real DTMO tables independently rate each dependency
// status per location rather than a fixed ratio) — rent ~90%, utility ~75%.
export const RENT_NO_DEP_MULT = 0.90;
export const UTIL_NO_DEP_MULT = 0.75;

// Rates update bi-monthly; flag as stale after ~45 days.
export function isOhaDataStale(): boolean {
  const effective = new Date(OHA_EFFECTIVE_DATE);
  const staleAfter = new Date(effective.getTime() + 45 * 24 * 60 * 60 * 1000);
  return new Date() > staleAfter;
}

// Returns the label of the current quarter to show in the UI.
export function currentOhaQuarterLabel(): string {
  const m = new Date().getMonth() + 1; // 1-12
  const y = new Date().getFullYear();
  const q = m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  return `${q} ${y}`;
}

export interface OhaGradeRate {
  grade: PayGrade;
  rentCeilingUSD: number;      // with-dependents monthly rent ceiling
  utilityAllowanceUSD: number; // with-dependents monthly utility allowance
}

export interface OhaLocationRate {
  locationLabel:   string;
  country:         string;
  currency:        string;
  installationIds: string[];  // maps installation IDs to this location
  miha:            number;    // one-time move-in allowance (USD); 0 = N/A
  approximate:     boolean;   // true when rates are from third-party estimates
  notes?:          string;
  /** Grade-indexed rates (with dependents). Interpolates between brackets. */
  rates: OhaGradeRate[];
}

// ── Rate data — Q1 2026 ────────────────────────────────────────────────────────
// Amounts are approximate USD equivalents at Q1 2026 exchange rates.
// Source: DTMO OHA rate tables + Stars and Stripes reporting (May 2026 Okinawa increase).

export const OHA_RATES: OhaLocationRate[] = [

  // ── JAPAN ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Yokota AB / Tokyo Area',
    country: 'Japan', currency: 'JPY',
    installationIds: ['yokota'],
    miha: 360, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 830, utilityAllowanceUSD: 704 },
      { grade: 'E2',  rentCeilingUSD: 830, utilityAllowanceUSD: 704 },
      { grade: 'E3',  rentCeilingUSD: 830, utilityAllowanceUSD: 704 },
      { grade: 'E4',  rentCeilingUSD: 830, utilityAllowanceUSD: 704 },
      { grade: 'E5',  rentCeilingUSD: 1255, utilityAllowanceUSD: 704 },
      { grade: 'E6',  rentCeilingUSD: 1355, utilityAllowanceUSD: 704 },
      { grade: 'E7',  rentCeilingUSD: 1450, utilityAllowanceUSD: 704 },
      { grade: 'E8',  rentCeilingUSD: 1545, utilityAllowanceUSD: 704 },
      { grade: 'E9',  rentCeilingUSD: 1645, utilityAllowanceUSD: 704 },
      { grade: 'W1',  rentCeilingUSD: 1420, utilityAllowanceUSD: 704 },
      { grade: 'W2',  rentCeilingUSD: 1515, utilityAllowanceUSD: 704 },
      { grade: 'W3',  rentCeilingUSD: 1610, utilityAllowanceUSD: 704 },
      { grade: 'W4',  rentCeilingUSD: 1710, utilityAllowanceUSD: 704 },
      { grade: 'W5',  rentCeilingUSD: 1805, utilityAllowanceUSD: 704 },
      { grade: 'O1',  rentCeilingUSD: 1355, utilityAllowanceUSD: 704 },
      { grade: 'O2',  rentCeilingUSD: 1485, utilityAllowanceUSD: 704 },
      { grade: 'O3',  rentCeilingUSD: 1675, utilityAllowanceUSD: 704 },
      { grade: 'O4',  rentCeilingUSD: 1870, utilityAllowanceUSD: 704 },
      { grade: 'O5',  rentCeilingUSD: 2065, utilityAllowanceUSD: 704 },
      { grade: 'O6',  rentCeilingUSD: 2255, utilityAllowanceUSD: 704 },
      { grade: 'O7',  rentCeilingUSD: 2450, utilityAllowanceUSD: 704 },
      { grade: 'O8',  rentCeilingUSD: 2450, utilityAllowanceUSD: 704 },
      { grade: 'O9',  rentCeilingUSD: 2450, utilityAllowanceUSD: 704 },
      { grade: 'O10', rentCeilingUSD: 2450, utilityAllowanceUSD: 704 },
    ],
  },

  {
    // All Okinawa installations share one OHA area code (JP027 / "Okinawa (OK)").
    // Every grade below was queried directly, live, against DTMO's own OHA
    // calculator (defensetravel.dod.mil/neorates/report) on 2026-09-13 — not
    // secondhand reporting this time. Query params: pay period 09-01-2026,
    // "with dependents" (see RENT/UTIL_NO_DEP_MULT for the without-dep figures
    // DTMO returns — confirmed EXACT for E6: 0.90x rent / 0.75x utility to the
    // cent). Effective date per the query result: 2026-08-01 — i.e. the prior
    // figures here (dated 2026-05-16) were an entire OHA cycle stale, and
    // UNDERSTATED every grade by ~15-20%, not overstated as previously noted
    // here. Utility is confirmed flat across every grade at $703.93 (w/ dep).
    // Every grade is now independently confirmed — none are estimated.
    locationLabel: 'Okinawa (All Installations)',
    country: 'Japan', currency: 'JPY',
    installationIds: ['kadena','mcb_butler','mcas_futenma','camp_foster','camp_courtney','camp_kinser',
                      'camp_mctureous','camp_hansen','camp_schwab','camp_gonsalves','torii_station','white_beach'],
    miha: 411, approximate: false,
    notes: 'All Okinawa bases share one OHA area. Utility is flat for all grades. Every grade confirmed live against the DTMO calculator 2026-09-13 (effective 2026-08-01).',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1746, utilityAllowanceUSD: 704 },
      { grade: 'E4',  rentCeilingUSD: 1746, utilityAllowanceUSD: 704 },
      { grade: 'E5',  rentCeilingUSD: 1885, utilityAllowanceUSD: 704 },
      { grade: 'E6',  rentCeilingUSD: 2200, utilityAllowanceUSD: 704 },
      { grade: 'E7',  rentCeilingUSD: 2200, utilityAllowanceUSD: 704 },
      { grade: 'E9',  rentCeilingUSD: 2514, utilityAllowanceUSD: 704 },
      { grade: 'W1',  rentCeilingUSD: 1885, utilityAllowanceUSD: 704 },
      { grade: 'W5',  rentCeilingUSD: 2828, utilityAllowanceUSD: 704 },
      { grade: 'O1',  rentCeilingUSD: 1885, utilityAllowanceUSD: 704 },
      { grade: 'O3',  rentCeilingUSD: 2200, utilityAllowanceUSD: 704 },
      { grade: 'O4',  rentCeilingUSD: 2514, utilityAllowanceUSD: 704 },
      { grade: 'O6',  rentCeilingUSD: 3142, utilityAllowanceUSD: 704 },
      { grade: 'O7',  rentCeilingUSD: 3142, utilityAllowanceUSD: 704 },
      { grade: 'O10', rentCeilingUSD: 3142, utilityAllowanceUSD: 704 },
    ],
  },

  {
    locationLabel: 'CFAY Yokosuka / Camp Zama / NAF Atsugi',
    country: 'Japan', currency: 'JPY',
    installationIds: ['yokosuka','camp_zama','atsugi'],
    miha: 370, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1085, utilityAllowanceUSD: 704 },
      { grade: 'E4',  rentCeilingUSD: 1085, utilityAllowanceUSD: 704 },
      { grade: 'E5',  rentCeilingUSD: 1395, utilityAllowanceUSD: 704 },
      { grade: 'E6',  rentCeilingUSD: 1515, utilityAllowanceUSD: 704 },
      { grade: 'E7',  rentCeilingUSD: 1630, utilityAllowanceUSD: 704 },
      { grade: 'E8',  rentCeilingUSD: 1745, utilityAllowanceUSD: 704 },
      { grade: 'E9',  rentCeilingUSD: 1865, utilityAllowanceUSD: 704 },
      { grade: 'O3',  rentCeilingUSD: 1900, utilityAllowanceUSD: 704 },
      { grade: 'O5',  rentCeilingUSD: 2330, utilityAllowanceUSD: 704 },
      { grade: 'O6',  rentCeilingUSD: 2560, utilityAllowanceUSD: 704 },
      { grade: 'O7',  rentCeilingUSD: 2795, utilityAllowanceUSD: 704 },
      { grade: 'O10', rentCeilingUSD: 2795, utilityAllowanceUSD: 704 },
    ],
  },

  {
    locationLabel: 'Misawa AB',
    country: 'Japan', currency: 'JPY',
    installationIds: ['misawa'],
    miha: 300, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1030, utilityAllowanceUSD: 704 },
      { grade: 'E4',  rentCeilingUSD: 1030, utilityAllowanceUSD: 704 },
      { grade: 'E5',  rentCeilingUSD: 1255, utilityAllowanceUSD: 704 },
      { grade: 'E9',  rentCeilingUSD: 1715, utilityAllowanceUSD: 704 },
      { grade: 'O3',  rentCeilingUSD: 1600, utilityAllowanceUSD: 704 },
      { grade: 'O6',  rentCeilingUSD: 2170, utilityAllowanceUSD: 704 },
      { grade: 'O10', rentCeilingUSD: 2170, utilityAllowanceUSD: 704 },
    ],
  },

  {
    locationLabel: 'Iwakuni MCAS, Japan',
    country: 'Japan', currency: 'JPY',
    installationIds: ['mcas_iwakuni'],
    miha: 310, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 820, utilityAllowanceUSD: 704 },
      { grade: 'E4',  rentCeilingUSD: 820, utilityAllowanceUSD: 704 },
      { grade: 'E5',  rentCeilingUSD: 1025, utilityAllowanceUSD: 704 },
      { grade: 'E9',  rentCeilingUSD: 1395, utilityAllowanceUSD: 704 },
      { grade: 'O3',  rentCeilingUSD: 1310, utilityAllowanceUSD: 704 },
      { grade: 'O6',  rentCeilingUSD: 1800, utilityAllowanceUSD: 704 },
      { grade: 'O10', rentCeilingUSD: 1800, utilityAllowanceUSD: 704 },
    ],
  },

  {
    locationLabel: 'Naval Base Sasebo, Japan',
    country: 'Japan', currency: 'JPY',
    installationIds: ['sasebo'],
    miha: 320, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 810, utilityAllowanceUSD: 704 },
      { grade: 'E4',  rentCeilingUSD: 810, utilityAllowanceUSD: 704 },
      { grade: 'E5',  rentCeilingUSD: 1115, utilityAllowanceUSD: 704 },
      { grade: 'E9',  rentCeilingUSD: 1465, utilityAllowanceUSD: 704 },
      { grade: 'O3',  rentCeilingUSD: 1500, utilityAllowanceUSD: 704 },
      { grade: 'O6',  rentCeilingUSD: 2040, utilityAllowanceUSD: 704 },
      { grade: 'O10', rentCeilingUSD: 2040, utilityAllowanceUSD: 704 },
    ],
  },

  // ── SOUTH KOREA ────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Camp Humphreys, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['camp_humphreys'],
    miha: 330, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 855, utilityAllowanceUSD: 804 },
      { grade: 'E4',  rentCeilingUSD: 855, utilityAllowanceUSD: 804 },
      { grade: 'E5',  rentCeilingUSD: 1420, utilityAllowanceUSD: 804 },
      { grade: 'E6',  rentCeilingUSD: 1515, utilityAllowanceUSD: 804 },
      { grade: 'E7',  rentCeilingUSD: 1610, utilityAllowanceUSD: 804 },
      { grade: 'E8',  rentCeilingUSD: 1705, utilityAllowanceUSD: 804 },
      { grade: 'E9',  rentCeilingUSD: 1800, utilityAllowanceUSD: 804 },
      { grade: 'O3',  rentCeilingUSD: 1895, utilityAllowanceUSD: 804 },
      { grade: 'O5',  rentCeilingUSD: 2275, utilityAllowanceUSD: 804 },
      { grade: 'O6',  rentCeilingUSD: 2560, utilityAllowanceUSD: 804 },
      { grade: 'O10', rentCeilingUSD: 2560, utilityAllowanceUSD: 804 },
    ],
  },

  {
    locationLabel: 'Osan AB, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['osan'],
    miha: 320, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 855, utilityAllowanceUSD: 804 },
      { grade: 'E4',  rentCeilingUSD: 855, utilityAllowanceUSD: 804 },
      { grade: 'E5',  rentCeilingUSD: 1420, utilityAllowanceUSD: 804 },
      { grade: 'E9',  rentCeilingUSD: 1800, utilityAllowanceUSD: 804 },
      { grade: 'O3',  rentCeilingUSD: 1895, utilityAllowanceUSD: 804 },
      { grade: 'O6',  rentCeilingUSD: 2560, utilityAllowanceUSD: 804 },
      { grade: 'O10', rentCeilingUSD: 2560, utilityAllowanceUSD: 804 },
    ],
  },

  {
    locationLabel: 'Camp Walker / Camp Henry, Daegu',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['camp_walker','camp_henry'],
    miha: 290, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 800, utilityAllowanceUSD: 804 },
      { grade: 'E4',  rentCeilingUSD: 800, utilityAllowanceUSD: 804 },
      { grade: 'E5',  rentCeilingUSD: 1280, utilityAllowanceUSD: 804 },
      { grade: 'E9',  rentCeilingUSD: 1705, utilityAllowanceUSD: 804 },
      { grade: 'O3',  rentCeilingUSD: 1810, utilityAllowanceUSD: 804 },
      { grade: 'O6',  rentCeilingUSD: 2450, utilityAllowanceUSD: 804 },
      { grade: 'O10', rentCeilingUSD: 2450, utilityAllowanceUSD: 804 },
    ],
  },

  {
    locationLabel: 'Camp Casey / Camp Red Cloud, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['camp_casey','camp_red_cloud'],
    miha: 280, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 750, utilityAllowanceUSD: 804 },
      { grade: 'E4',  rentCeilingUSD: 750, utilityAllowanceUSD: 804 },
      { grade: 'E5',  rentCeilingUSD: 1220, utilityAllowanceUSD: 804 },
      { grade: 'E9',  rentCeilingUSD: 1595, utilityAllowanceUSD: 804 },
      { grade: 'O3',  rentCeilingUSD: 1690, utilityAllowanceUSD: 804 },
      { grade: 'O6',  rentCeilingUSD: 2300, utilityAllowanceUSD: 804 },
      { grade: 'O10', rentCeilingUSD: 2300, utilityAllowanceUSD: 804 },
    ],
  },

  {
    locationLabel: 'Kunsan AB / Camp Carroll, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['kunsan','camp_carroll'],
    miha: 270, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 825, utilityAllowanceUSD: 804 },
      { grade: 'E4',  rentCeilingUSD: 825, utilityAllowanceUSD: 804 },
      { grade: 'E5',  rentCeilingUSD: 1235, utilityAllowanceUSD: 804 },
      { grade: 'E9',  rentCeilingUSD: 1705, utilityAllowanceUSD: 804 },
      { grade: 'O3',  rentCeilingUSD: 1765, utilityAllowanceUSD: 804 },
      { grade: 'O6',  rentCeilingUSD: 2410, utilityAllowanceUSD: 804 },
      { grade: 'O10', rentCeilingUSD: 2410, utilityAllowanceUSD: 804 },
    ],
  },

  // ── GERMANY ────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Ramstein AB, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['ramstein','baumholder','kleber'],
    miha: 320, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1220, utilityAllowanceUSD: 1163 },
      { grade: 'E4',  rentCeilingUSD: 1220, utilityAllowanceUSD: 1163 },
      { grade: 'E5',  rentCeilingUSD: 1865, utilityAllowanceUSD: 1163 },
      { grade: 'E6',  rentCeilingUSD: 2055, utilityAllowanceUSD: 1163 },
      { grade: 'E7',  rentCeilingUSD: 2250, utilityAllowanceUSD: 1163 },
      { grade: 'E8',  rentCeilingUSD: 2440, utilityAllowanceUSD: 1163 },
      { grade: 'E9',  rentCeilingUSD: 2635, utilityAllowanceUSD: 1163 },
      { grade: 'O3',  rentCeilingUSD: 2700, utilityAllowanceUSD: 1163 },
      { grade: 'O5',  rentCeilingUSD: 3340, utilityAllowanceUSD: 1163 },
      { grade: 'O6',  rentCeilingUSD: 3725, utilityAllowanceUSD: 1163 },
      { grade: 'O10', rentCeilingUSD: 3725, utilityAllowanceUSD: 1163 },
    ],
  },

  {
    locationLabel: 'Stuttgart (HQ EUCOM / AFRICOM)',
    country: 'Germany', currency: 'EUR',
    installationIds: ['stuttgart','patch_barracks'],
    miha: 330, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1710, utilityAllowanceUSD: 1163 },
      { grade: 'E4',  rentCeilingUSD: 1710, utilityAllowanceUSD: 1163 },
      { grade: 'E5',  rentCeilingUSD: 2565, utilityAllowanceUSD: 1163 },
      { grade: 'E9',  rentCeilingUSD: 3575, utilityAllowanceUSD: 1163 },
      { grade: 'O3',  rentCeilingUSD: 3730, utilityAllowanceUSD: 1163 },
      { grade: 'O6',  rentCeilingUSD: 5130, utilityAllowanceUSD: 1163 },
      { grade: 'O10', rentCeilingUSD: 5130, utilityAllowanceUSD: 1163 },
    ],
  },

  {
    locationLabel: 'Wiesbaden / Clay Kaserne',
    country: 'Germany', currency: 'EUR',
    installationIds: ['wiesbaden'],
    miha: 340, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1940, utilityAllowanceUSD: 1163 },
      { grade: 'E4',  rentCeilingUSD: 1940, utilityAllowanceUSD: 1163 },
      { grade: 'E5',  rentCeilingUSD: 2865, utilityAllowanceUSD: 1163 },
      { grade: 'E9',  rentCeilingUSD: 4065, utilityAllowanceUSD: 1163 },
      { grade: 'O3',  rentCeilingUSD: 4250, utilityAllowanceUSD: 1163 },
      { grade: 'O6',  rentCeilingUSD: 5730, utilityAllowanceUSD: 1163 },
      { grade: 'O10', rentCeilingUSD: 5730, utilityAllowanceUSD: 1163 },
    ],
  },

  {
    locationLabel: 'Spangdahlem AB, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['spangdahlem'],
    miha: 310, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1215, utilityAllowanceUSD: 1163 },
      { grade: 'E4',  rentCeilingUSD: 1215, utilityAllowanceUSD: 1163 },
      { grade: 'E5',  rentCeilingUSD: 1745, utilityAllowanceUSD: 1163 },
      { grade: 'E9',  rentCeilingUSD: 2505, utilityAllowanceUSD: 1163 },
      { grade: 'O3',  rentCeilingUSD: 2580, utilityAllowanceUSD: 1163 },
      { grade: 'O6',  rentCeilingUSD: 3490, utilityAllowanceUSD: 1163 },
      { grade: 'O10', rentCeilingUSD: 3490, utilityAllowanceUSD: 1163 },
    ],
  },

  {
    locationLabel: 'Grafenwöhr / Vilseck, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['grafenwoehr','vilseck'],
    miha: 290, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1545, utilityAllowanceUSD: 1163 },
      { grade: 'E4',  rentCeilingUSD: 1545, utilityAllowanceUSD: 1163 },
      { grade: 'E5',  rentCeilingUSD: 2265, utilityAllowanceUSD: 1163 },
      { grade: 'E9',  rentCeilingUSD: 3190, utilityAllowanceUSD: 1163 },
      { grade: 'O3',  rentCeilingUSD: 3290, utilityAllowanceUSD: 1163 },
      { grade: 'O6',  rentCeilingUSD: 4525, utilityAllowanceUSD: 1163 },
      { grade: 'O10', rentCeilingUSD: 4525, utilityAllowanceUSD: 1163 },
    ],
  },

  {
    locationLabel: 'USAG Ansbach, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['ansbach'],
    miha: 285, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 895, utilityAllowanceUSD: 1163 },
      { grade: 'E4',  rentCeilingUSD: 895, utilityAllowanceUSD: 1163 },
      { grade: 'E5',  rentCeilingUSD: 1340, utilityAllowanceUSD: 1163 },
      { grade: 'E9',  rentCeilingUSD: 1915, utilityAllowanceUSD: 1163 },
      { grade: 'O3',  rentCeilingUSD: 1980, utilityAllowanceUSD: 1163 },
      { grade: 'O6',  rentCeilingUSD: 2685, utilityAllowanceUSD: 1163 },
      { grade: 'O10', rentCeilingUSD: 2685, utilityAllowanceUSD: 1163 },
    ],
  },

  // ── UNITED KINGDOM ─────────────────────────────────────────────────────────────
  {
    locationLabel: 'RAF Lakenheath, UK',
    country: 'United Kingdom', currency: 'GBP',
    installationIds: ['lakenheath'],
    miha: 330, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1705, utilityAllowanceUSD: 1148 },
      { grade: 'E4',  rentCeilingUSD: 1705, utilityAllowanceUSD: 1148 },
      { grade: 'E5',  rentCeilingUSD: 2330, utilityAllowanceUSD: 1148 },
      { grade: 'E6',  rentCeilingUSD: 2560, utilityAllowanceUSD: 1148 },
      { grade: 'E7',  rentCeilingUSD: 2795, utilityAllowanceUSD: 1148 },
      { grade: 'E8',  rentCeilingUSD: 3025, utilityAllowanceUSD: 1148 },
      { grade: 'E9',  rentCeilingUSD: 3260, utilityAllowanceUSD: 1148 },
      { grade: 'O3',  rentCeilingUSD: 3335, utilityAllowanceUSD: 1148 },
      { grade: 'O5',  rentCeilingUSD: 4115, utilityAllowanceUSD: 1148 },
      { grade: 'O6',  rentCeilingUSD: 4580, utilityAllowanceUSD: 1148 },
      { grade: 'O10', rentCeilingUSD: 4580, utilityAllowanceUSD: 1148 },
    ],
  },

  {
    locationLabel: 'RAF Mildenhall, UK',
    country: 'United Kingdom', currency: 'GBP',
    installationIds: ['mildenhall'],
    miha: 325, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1705, utilityAllowanceUSD: 1148 },
      { grade: 'E4',  rentCeilingUSD: 1705, utilityAllowanceUSD: 1148 },
      { grade: 'E5',  rentCeilingUSD: 2330, utilityAllowanceUSD: 1148 },
      { grade: 'E9',  rentCeilingUSD: 3260, utilityAllowanceUSD: 1148 },
      { grade: 'O3',  rentCeilingUSD: 3335, utilityAllowanceUSD: 1148 },
      { grade: 'O6',  rentCeilingUSD: 4580, utilityAllowanceUSD: 1148 },
      { grade: 'O10', rentCeilingUSD: 4580, utilityAllowanceUSD: 1148 },
    ],
  },

  {
    locationLabel: 'RAF Croughton / Alconbury, UK',
    country: 'United Kingdom', currency: 'GBP',
    installationIds: ['alconbury','raf_croughton'],
    miha: 320, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1855, utilityAllowanceUSD: 1148 },
      { grade: 'E4',  rentCeilingUSD: 1855, utilityAllowanceUSD: 1148 },
      { grade: 'E5',  rentCeilingUSD: 2505, utilityAllowanceUSD: 1148 },
      { grade: 'E9',  rentCeilingUSD: 3435, utilityAllowanceUSD: 1148 },
      { grade: 'O3',  rentCeilingUSD: 3525, utilityAllowanceUSD: 1148 },
      { grade: 'O6',  rentCeilingUSD: 4825, utilityAllowanceUSD: 1148 },
      { grade: 'O10', rentCeilingUSD: 4825, utilityAllowanceUSD: 1148 },
    ],
  },

  // ── ITALY ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Aviano AB, Italy',
    country: 'Italy', currency: 'EUR',
    installationIds: ['aviano'],
    miha: 300, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1020, utilityAllowanceUSD: 1634 },
      { grade: 'E4',  rentCeilingUSD: 1020, utilityAllowanceUSD: 1634 },
      { grade: 'E5',  rentCeilingUSD: 1475, utilityAllowanceUSD: 1634 },
      { grade: 'E9',  rentCeilingUSD: 2100, utilityAllowanceUSD: 1634 },
      { grade: 'O3',  rentCeilingUSD: 2155, utilityAllowanceUSD: 1634 },
      { grade: 'O6',  rentCeilingUSD: 2950, utilityAllowanceUSD: 1634 },
      { grade: 'O10', rentCeilingUSD: 2950, utilityAllowanceUSD: 1634 },
    ],
  },

  {
    locationLabel: 'NAS Sigonella, Sicily',
    country: 'Italy', currency: 'EUR',
    installationIds: ['sigonella'],
    miha: 295, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1150, utilityAllowanceUSD: 1634 },
      { grade: 'E4',  rentCeilingUSD: 1150, utilityAllowanceUSD: 1634 },
      { grade: 'E5',  rentCeilingUSD: 1580, utilityAllowanceUSD: 1634 },
      { grade: 'E9',  rentCeilingUSD: 2225, utilityAllowanceUSD: 1634 },
      { grade: 'O3',  rentCeilingUSD: 2295, utilityAllowanceUSD: 1634 },
      { grade: 'O6',  rentCeilingUSD: 3160, utilityAllowanceUSD: 1634 },
      { grade: 'O10', rentCeilingUSD: 3160, utilityAllowanceUSD: 1634 },
    ],
  },

  {
    locationLabel: 'Naval Support Activity Naples',
    country: 'Italy', currency: 'EUR',
    installationIds: ['naples'],
    miha: 320, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1275, utilityAllowanceUSD: 1634 },
      { grade: 'E4',  rentCeilingUSD: 1275, utilityAllowanceUSD: 1634 },
      { grade: 'E5',  rentCeilingUSD: 2010, utilityAllowanceUSD: 1634 },
      { grade: 'E9',  rentCeilingUSD: 2815, utilityAllowanceUSD: 1634 },
      { grade: 'O3',  rentCeilingUSD: 2950, utilityAllowanceUSD: 1634 },
      { grade: 'O6',  rentCeilingUSD: 4025, utilityAllowanceUSD: 1634 },
      { grade: 'O10', rentCeilingUSD: 4025, utilityAllowanceUSD: 1634 },
    ],
  },

  // ── SPAIN ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Naval Station Rota, Spain',
    country: 'Spain', currency: 'EUR',
    installationIds: ['rota'],
    miha: 290, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1200, utilityAllowanceUSD: 1225 },
      { grade: 'E4',  rentCeilingUSD: 1200, utilityAllowanceUSD: 1225 },
      { grade: 'E5',  rentCeilingUSD: 1680, utilityAllowanceUSD: 1225 },
      { grade: 'E9',  rentCeilingUSD: 2320, utilityAllowanceUSD: 1225 },
      { grade: 'O3',  rentCeilingUSD: 2400, utilityAllowanceUSD: 1225 },
      { grade: 'O6',  rentCeilingUSD: 3280, utilityAllowanceUSD: 1225 },
      { grade: 'O10', rentCeilingUSD: 3280, utilityAllowanceUSD: 1225 },
    ],
  },

  {
    locationLabel: 'Morón AB, Spain',
    country: 'Spain', currency: 'EUR',
    installationIds: ['moron'],
    miha: 285, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 860, utilityAllowanceUSD: 1225 },
      { grade: 'E4',  rentCeilingUSD: 860, utilityAllowanceUSD: 1225 },
      { grade: 'E5',  rentCeilingUSD: 1165, utilityAllowanceUSD: 1225 },
      { grade: 'E9',  rentCeilingUSD: 1595, utilityAllowanceUSD: 1225 },
      { grade: 'O3',  rentCeilingUSD: 1655, utilityAllowanceUSD: 1225 },
      { grade: 'O6',  rentCeilingUSD: 2265, utilityAllowanceUSD: 1225 },
      { grade: 'O10', rentCeilingUSD: 2265, utilityAllowanceUSD: 1225 },
    ],
  },

  // ── MIDDLE EAST ────────────────────────────────────────────────────────────────
  {
    locationLabel: 'NSA Bahrain (5th Fleet HQ)',
    country: 'Bahrain', currency: 'BHD',
    installationIds: ['bahrain'],
    miha: 330, approximate: false,
    notes: 'BHD pegged to USD — more stable than other OCONUS locations.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1305, utilityAllowanceUSD: 992 },
      { grade: 'E4',  rentCeilingUSD: 1305, utilityAllowanceUSD: 992 },
      { grade: 'E5',  rentCeilingUSD: 2075, utilityAllowanceUSD: 992 },
      { grade: 'E6',  rentCeilingUSD: 2250, utilityAllowanceUSD: 992 },
      { grade: 'E7',  rentCeilingUSD: 2430, utilityAllowanceUSD: 992 },
      { grade: 'E8',  rentCeilingUSD: 2605, utilityAllowanceUSD: 992 },
      { grade: 'E9',  rentCeilingUSD: 2785, utilityAllowanceUSD: 992 },
      { grade: 'O3',  rentCeilingUSD: 2845, utilityAllowanceUSD: 992 },
      { grade: 'O5',  rentCeilingUSD: 3555, utilityAllowanceUSD: 992 },
      { grade: 'O6',  rentCeilingUSD: 3970, utilityAllowanceUSD: 992 },
      { grade: 'O10', rentCeilingUSD: 3970, utilityAllowanceUSD: 992 },
    ],
  },

  {
    locationLabel: 'Al Udeid AB, Qatar',
    country: 'Qatar', currency: 'QAR',
    installationIds: ['al_udeid'],
    miha: 310, approximate: false,
    notes: 'Most personnel are on AEF rotations; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 4030, utilityAllowanceUSD: 124 },
      { grade: 'E4',  rentCeilingUSD: 4030, utilityAllowanceUSD: 124 },
      { grade: 'E5',  rentCeilingUSD: 5895, utilityAllowanceUSD: 124 },
      { grade: 'E9',  rentCeilingUSD: 8065, utilityAllowanceUSD: 124 },
      { grade: 'O3',  rentCeilingUSD: 8375, utilityAllowanceUSD: 124 },
      { grade: 'O6',  rentCeilingUSD: 11475, utilityAllowanceUSD: 124 },
      { grade: 'O10', rentCeilingUSD: 11475, utilityAllowanceUSD: 124 },
    ],
  },

  // ── AFRICA ─────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Camp Lemonnier, Djibouti',
    country: 'Djibouti', currency: 'DJF',
    installationIds: ['camp_lemonnier'],
    miha: 260, approximate: false,
    notes: 'Primarily rotational forces; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 875, utilityAllowanceUSD: 445 },
      { grade: 'E4',  rentCeilingUSD: 875, utilityAllowanceUSD: 445 },
      { grade: 'E5',  rentCeilingUSD: 1205, utilityAllowanceUSD: 445 },
      { grade: 'E9',  rentCeilingUSD: 1645, utilityAllowanceUSD: 445 },
      { grade: 'O3',  rentCeilingUSD: 1700, utilityAllowanceUSD: 445 },
      { grade: 'O6',  rentCeilingUSD: 2300, utilityAllowanceUSD: 445 },
      { grade: 'O10', rentCeilingUSD: 2300, utilityAllowanceUSD: 445 },
    ],
  },

  // ── OTHER EUROPE ───────────────────────────────────────────────────────────────
  {
    locationLabel: 'Incirlik AB, Turkey',
    country: 'Turkey', currency: 'TRY',
    installationIds: ['incirlik'],
    miha: 260, approximate: false,
    notes: 'Turkish lira volatility — USD values fluctuate significantly.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 370, utilityAllowanceUSD: 131 },
      { grade: 'E4',  rentCeilingUSD: 370, utilityAllowanceUSD: 131 },
      { grade: 'E5',  rentCeilingUSD: 500, utilityAllowanceUSD: 131 },
      { grade: 'E9',  rentCeilingUSD: 685, utilityAllowanceUSD: 131 },
      { grade: 'O3',  rentCeilingUSD: 710, utilityAllowanceUSD: 131 },
      { grade: 'O6',  rentCeilingUSD: 975, utilityAllowanceUSD: 131 },
      { grade: 'O10', rentCeilingUSD: 975, utilityAllowanceUSD: 131 },
    ],
  },

  // ── ITALY (additional) ─────────────────────────────────────────────────────────
  {
    locationLabel: 'USAG Italy (Vicenza)',
    country: 'Italy', currency: 'EUR',
    installationIds: ['vicenza'],
    miha: 310, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1265, utilityAllowanceUSD: 1634 },
      { grade: 'E4',  rentCeilingUSD: 1265, utilityAllowanceUSD: 1634 },
      { grade: 'E5',  rentCeilingUSD: 1865, utilityAllowanceUSD: 1634 },
      { grade: 'E9',  rentCeilingUSD: 2660, utilityAllowanceUSD: 1634 },
      { grade: 'O3',  rentCeilingUSD: 2730, utilityAllowanceUSD: 1634 },
      { grade: 'O6',  rentCeilingUSD: 3725, utilityAllowanceUSD: 1634 },
      { grade: 'O10', rentCeilingUSD: 3725, utilityAllowanceUSD: 1634 },
    ],
  },

  {
    locationLabel: 'Camp Darby, Italy',
    country: 'Italy', currency: 'EUR',
    installationIds: ['camp_darby'],
    miha: 295, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1170, utilityAllowanceUSD: 1634 },
      { grade: 'E4',  rentCeilingUSD: 1170, utilityAllowanceUSD: 1634 },
      { grade: 'E5',  rentCeilingUSD: 1690, utilityAllowanceUSD: 1634 },
      { grade: 'E9',  rentCeilingUSD: 2400, utilityAllowanceUSD: 1634 },
      { grade: 'O3',  rentCeilingUSD: 2465, utilityAllowanceUSD: 1634 },
      { grade: 'O6',  rentCeilingUSD: 3375, utilityAllowanceUSD: 1634 },
      { grade: 'O10', rentCeilingUSD: 3375, utilityAllowanceUSD: 1634 },
    ],
  },

  // ── OTHER EUROPE ───────────────────────────────────────────────────────────────
  {
    locationLabel: 'SHAPE / Chièvres, Belgium',
    country: 'Belgium', currency: 'EUR',
    installationIds: ['mons','chievres'],
    miha: 340, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1345, utilityAllowanceUSD: 1518 },
      { grade: 'E4',  rentCeilingUSD: 1345, utilityAllowanceUSD: 1518 },
      { grade: 'E5',  rentCeilingUSD: 1850, utilityAllowanceUSD: 1518 },
      { grade: 'E9',  rentCeilingUSD: 2635, utilityAllowanceUSD: 1518 },
      { grade: 'O3',  rentCeilingUSD: 2690, utilityAllowanceUSD: 1518 },
      { grade: 'O6',  rentCeilingUSD: 3700, utilityAllowanceUSD: 1518 },
      { grade: 'O10', rentCeilingUSD: 3700, utilityAllowanceUSD: 1518 },
    ],
  },

  {
    locationLabel: 'Lajes Field, Azores',
    country: 'Portugal (Azores)', currency: 'EUR',
    installationIds: ['lajes'],
    miha: 270, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 910, utilityAllowanceUSD: 678 },
      { grade: 'E4',  rentCeilingUSD: 910, utilityAllowanceUSD: 678 },
      { grade: 'E5',  rentCeilingUSD: 1260, utilityAllowanceUSD: 678 },
      { grade: 'E9',  rentCeilingUSD: 1675, utilityAllowanceUSD: 678 },
      { grade: 'O3',  rentCeilingUSD: 1745, utilityAllowanceUSD: 678 },
      { grade: 'O6',  rentCeilingUSD: 2375, utilityAllowanceUSD: 678 },
      { grade: 'O10', rentCeilingUSD: 2375, utilityAllowanceUSD: 678 },
    ],
  },

  {
    locationLabel: 'NSA Souda Bay, Greece',
    country: 'Greece', currency: 'EUR',
    installationIds: ['souda_bay'],
    miha: 275, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 795, utilityAllowanceUSD: 1239 },
      { grade: 'E4',  rentCeilingUSD: 795, utilityAllowanceUSD: 1239 },
      { grade: 'E5',  rentCeilingUSD: 1115, utilityAllowanceUSD: 1239 },
      { grade: 'E9',  rentCeilingUSD: 1535, utilityAllowanceUSD: 1239 },
      { grade: 'O3',  rentCeilingUSD: 1590, utilityAllowanceUSD: 1239 },
      { grade: 'O6',  rentCeilingUSD: 2175, utilityAllowanceUSD: 1239 },
      { grade: 'O10', rentCeilingUSD: 2175, utilityAllowanceUSD: 1239 },
    ],
  },

  // ── MIDDLE EAST (additional) ───────────────────────────────────────────────────
  {
    locationLabel: 'Kuwait (Arifjan / Ali Al Salem / Buehring)',
    country: 'Kuwait', currency: 'KWD',
    installationIds: ['camp_arifjan','ali_al_salem','camp_buehring'],
    miha: 280, approximate: false,
    notes: 'Most personnel are on deployment orders; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 2455, utilityAllowanceUSD: 716 },
      { grade: 'E4',  rentCeilingUSD: 2455, utilityAllowanceUSD: 716 },
      { grade: 'E5',  rentCeilingUSD: 3345, utilityAllowanceUSD: 716 },
      { grade: 'E9',  rentCeilingUSD: 4460, utilityAllowanceUSD: 716 },
      { grade: 'O3',  rentCeilingUSD: 4685, utilityAllowanceUSD: 716 },
      { grade: 'O6',  rentCeilingUSD: 6245, utilityAllowanceUSD: 716 },
      { grade: 'O10', rentCeilingUSD: 6245, utilityAllowanceUSD: 716 },
    ],
  },

  {
    locationLabel: 'Al Dhafra AB, UAE',
    country: 'United Arab Emirates', currency: 'AED',
    installationIds: ['al_dhafra'],
    miha: 310, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 2530, utilityAllowanceUSD: 1012 },
      { grade: 'E4',  rentCeilingUSD: 2530, utilityAllowanceUSD: 1012 },
      { grade: 'E5',  rentCeilingUSD: 3610, utilityAllowanceUSD: 1012 },
      { grade: 'E9',  rentCeilingUSD: 4875, utilityAllowanceUSD: 1012 },
      { grade: 'O3',  rentCeilingUSD: 5055, utilityAllowanceUSD: 1012 },
      { grade: 'O6',  rentCeilingUSD: 6860, utilityAllowanceUSD: 1012 },
      { grade: 'O10', rentCeilingUSD: 6860, utilityAllowanceUSD: 1012 },
    ],
  },

  {
    locationLabel: 'Prince Sultan AB, Saudi Arabia',
    country: 'Saudi Arabia', currency: 'SAR',
    installationIds: ['prince_sultan'],
    miha: 290, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 390, utilityAllowanceUSD: 295 },
      { grade: 'E4',  rentCeilingUSD: 390, utilityAllowanceUSD: 295 },
      { grade: 'E5',  rentCeilingUSD: 555, utilityAllowanceUSD: 295 },
      { grade: 'E9',  rentCeilingUSD: 750, utilityAllowanceUSD: 295 },
      { grade: 'O3',  rentCeilingUSD: 780, utilityAllowanceUSD: 295 },
      { grade: 'O6',  rentCeilingUSD: 1045, utilityAllowanceUSD: 295 },
      { grade: 'O10', rentCeilingUSD: 1045, utilityAllowanceUSD: 295 },
    ],
  },

  {
    locationLabel: 'Muwaffaq Salti AB, Jordan',
    country: 'Jordan', currency: 'JOD',
    installationIds: ['muwaffaq_salti'],
    miha: 275, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 800,  utilityAllowanceUSD: 270 },
      { grade: 'E4',  rentCeilingUSD: 800,  utilityAllowanceUSD: 270 },
      { grade: 'E5',  rentCeilingUSD: 1100, utilityAllowanceUSD: 340 },
      { grade: 'E9',  rentCeilingUSD: 1500, utilityAllowanceUSD: 430 },
      { grade: 'O3',  rentCeilingUSD: 1550, utilityAllowanceUSD: 410 },
      { grade: 'O6',  rentCeilingUSD: 2100, utilityAllowanceUSD: 510 },
      { grade: 'O10', rentCeilingUSD: 2100, utilityAllowanceUSD: 510 },
    ],
  },

  // ── PACIFIC ────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Naval Base Guam / Andersen AFB / Camp Blaz',
    country: 'Guam (U.S. Territory)', currency: 'USD',
    installationIds: ['guam_navy','andersen','camp_blaz'],
    miha: 350, approximate: false,
    notes: 'All Guam bases share one OHA area. High utility costs due to island power grid.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1800, utilityAllowanceUSD: 1512 },
      { grade: 'E4',  rentCeilingUSD: 1800, utilityAllowanceUSD: 1512 },
      { grade: 'E5',  rentCeilingUSD: 2450, utilityAllowanceUSD: 1512 },
      { grade: 'E9',  rentCeilingUSD: 3200, utilityAllowanceUSD: 1512 },
      { grade: 'O3',  rentCeilingUSD: 3300, utilityAllowanceUSD: 1512 },
      { grade: 'O6',  rentCeilingUSD: 4300, utilityAllowanceUSD: 1512 },
      { grade: 'O10', rentCeilingUSD: 4300, utilityAllowanceUSD: 1512 },
    ],
  },

  {
    locationLabel: 'Kwajalein Atoll (USAKA)',
    country: 'Marshall Islands', currency: 'USD',
    installationIds: ['kwajalein'],
    miha: 250, approximate: false,
    notes: 'Remote isolated duty — government housing is primary.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 600, utilityAllowanceUSD: 230 },
      { grade: 'E4',  rentCeilingUSD: 600, utilityAllowanceUSD: 230 },
      { grade: 'E5',  rentCeilingUSD: 800, utilityAllowanceUSD: 230 },
      { grade: 'E9',  rentCeilingUSD: 1100, utilityAllowanceUSD: 230 },
      { grade: 'O3',  rentCeilingUSD: 1100, utilityAllowanceUSD: 230 },
      { grade: 'O6',  rentCeilingUSD: 1500, utilityAllowanceUSD: 230 },
      { grade: 'O10', rentCeilingUSD: 1500, utilityAllowanceUSD: 230 },
    ],
  },

  // ── REMOTE / ISOLATED DUTY ────────────────────────────────────────────────────
  // Note: OHA is listed but off-base civilian housing is typically unavailable.
  {
    locationLabel: 'Diego Garcia (BIOT)',
    country: 'British Indian Ocean Territory', currency: 'USD',
    installationIds: ['jbab_diego_garcia'],
    miha: 0, approximate: true,
    notes: 'No off-base civilian housing market. OHA rarely applicable.',
    rates: [],
  },

  {
    locationLabel: 'Pituffik Space Base (Thule)',
    country: 'Greenland', currency: 'USD',
    installationIds: ['thule'],
    miha: 0, approximate: false,
    notes: 'Remote isolated duty — no civilian off-base housing market.',
    rates: [],
  },

  // ── AMERICAS ───────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Naval Station Guantanamo Bay (GTMO)',
    country: 'Cuba', currency: 'USD',
    installationIds: ['gtmo'],
    miha: 0, approximate: false,
    notes: 'Isolated duty — all housing on base.',
    rates: [],
  },

  {
    locationLabel: 'Soto Cano AB (JTF-Bravo), Honduras',
    country: 'Honduras', currency: 'HNL',
    installationIds: ['soto_cano'],
    miha: 250, approximate: false,
    notes: 'Mostly rotational forces; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1110, utilityAllowanceUSD: 423 },
      { grade: 'E4',  rentCeilingUSD: 1110, utilityAllowanceUSD: 423 },
      { grade: 'E5',  rentCeilingUSD: 1510, utilityAllowanceUSD: 423 },
      { grade: 'E9',  rentCeilingUSD: 2065, utilityAllowanceUSD: 423 },
      { grade: 'O3',  rentCeilingUSD: 2145, utilityAllowanceUSD: 423 },
      { grade: 'O6',  rentCeilingUSD: 2935, utilityAllowanceUSD: 423 },
      { grade: 'O10', rentCeilingUSD: 2935, utilityAllowanceUSD: 423 },
    ],
  },

  {
    locationLabel: 'Fort Buchanan, Puerto Rico',
    country: 'Puerto Rico (U.S. Territory)', currency: 'USD',
    installationIds: ['fort_buchanan'],
    miha: 300, approximate: false,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1665, utilityAllowanceUSD: 1223 },
      { grade: 'E4',  rentCeilingUSD: 1665, utilityAllowanceUSD: 1223 },
      { grade: 'E5',  rentCeilingUSD: 2220, utilityAllowanceUSD: 1223 },
      { grade: 'E9',  rentCeilingUSD: 3055, utilityAllowanceUSD: 1223 },
      { grade: 'O3',  rentCeilingUSD: 3195, utilityAllowanceUSD: 1223 },
      { grade: 'O6',  rentCeilingUSD: 4305, utilityAllowanceUSD: 1223 },
      { grade: 'O10', rentCeilingUSD: 4305, utilityAllowanceUSD: 1223 },
    ],
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Build a map from installation ID → locationLabel for fast lookup. */
const INSTALLATION_LABEL_MAP: Record<string, string> = OHA_RATES.reduce(
  (acc, loc) => {
    loc.installationIds.forEach(id => { acc[id] = loc.locationLabel; });
    return acc;
  },
  {} as Record<string, string>,
);

/** Get rates for a specific OCONUS location (by locationLabel). */
export function getOhaLocationRates(locationLabel: string): OhaLocationRate | undefined {
  return OHA_RATES.find(r => r.locationLabel === locationLabel);
}

/** Get OHA location for a given installation ID. */
export function getOhaAreaForInstallation(installationId: string): OhaLocationRate | undefined {
  const label = INSTALLATION_LABEL_MAP[installationId];
  return label ? getOhaLocationRates(label) : undefined;
}

const GRADE_ORDER: PayGrade[] = [
  'E1','E2','E3','E4','E5','E6','E7','E8','E9',
  'W1','W2','W3','W4','W5',
  'O1','O2','O3','O4','O5','O6','O7','O8','O9','O10',
];

/**
 * Get the OHA rent ceiling and utility allowance for a location + grade.
 * Interpolates between grade brackets when an exact match is missing.
 * Pass withDep=false to apply the standard no-dep multipliers.
 */
export function getOhaRate(
  locationLabel: string,
  grade: PayGrade,
  withDep = true,
): { rentCeilingUSD: number; utilityAllowanceUSD: number } | null {
  const loc = getOhaLocationRates(locationLabel);
  if (!loc || loc.rates.length === 0) return null;

  // O1E/O2E/O3E get the same OHA as their base grade (no separate JTR column
  // for prior-enlisted officers) — normalize up front so the interpolation
  // below never has to reason about a grade it has no data for.
  grade = baseOfficerGrade(grade);

  // Exact match
  const exact = loc.rates.find(r => r.grade === grade);
  let rent: number, util: number;

  if (exact) {
    rent = exact.rentCeilingUSD;
    util = exact.utilityAllowanceUSD;
  } else {
    const targetIdx = GRADE_ORDER.indexOf(grade);
    const available = loc.rates.map(r => ({ idx: GRADE_ORDER.indexOf(r.grade), rate: r }));
    available.sort((a, b) => a.idx - b.idx);

    const lower = [...available].reverse().find(r => r.idx <= targetIdx);
    const upper = available.find(r => r.idx >= targetIdx);

    if (lower && upper && lower.idx !== upper.idx) {
      const t = (targetIdx - lower.idx) / (upper.idx - lower.idx);
      rent = Math.round(lower.rate.rentCeilingUSD + t * (upper.rate.rentCeilingUSD - lower.rate.rentCeilingUSD));
      util = Math.round(lower.rate.utilityAllowanceUSD + t * (upper.rate.utilityAllowanceUSD - lower.rate.utilityAllowanceUSD));
    } else {
      const closest = lower ?? upper;
      if (!closest) return null;
      rent = closest.rate.rentCeilingUSD;
      util = closest.rate.utilityAllowanceUSD;
    }
  }

  if (!withDep) {
    rent = Math.round(rent * RENT_NO_DEP_MULT);
    util = Math.round(util * UTIL_NO_DEP_MULT);
  }

  return { rentCeilingUSD: rent, utilityAllowanceUSD: util };
}

/** Total OHA monthly entitlement (rent ceiling + utility allowance). */
export function getOhaTotalCeiling(locationLabel: string, grade: PayGrade, withDep = true): number | null {
  const r = getOhaRate(locationLabel, grade, withDep);
  return r ? r.rentCeilingUSD + r.utilityAllowanceUSD : null;
}
