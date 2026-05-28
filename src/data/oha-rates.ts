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
 *     automatically: rent × RENT_NO_DEP_MULT, utility × UTIL_NO_DEP_MULT.
 *   - Most rates are approximate (third-party sources, Q1 2026 exchange rates).
 *   - Okinawa utility is a flat rate across all grades per USFJ policy.
 */

import { PayGrade } from '@/data/bah-rates';

export const OHA_DATA_QUARTER   = 'Q2 2026';
export const OHA_EFFECTIVE_DATE = '2026-05-16';
export const DTMO_OHA_URL       = 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/';

// Without-dep multipliers applied to stored (with-dep) rates.
export const RENT_NO_DEP_MULT = 0.83;
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
    miha: 360, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1290, utilityAllowanceUSD: 530 },
      { grade: 'E2',  rentCeilingUSD: 1290, utilityAllowanceUSD: 530 },
      { grade: 'E3',  rentCeilingUSD: 1290, utilityAllowanceUSD: 530 },
      { grade: 'E4',  rentCeilingUSD: 1290, utilityAllowanceUSD: 530 },
      { grade: 'E5',  rentCeilingUSD: 1950, utilityAllowanceUSD: 650 },
      { grade: 'E6',  rentCeilingUSD: 2100, utilityAllowanceUSD: 670 },
      { grade: 'E7',  rentCeilingUSD: 2250, utilityAllowanceUSD: 690 },
      { grade: 'E8',  rentCeilingUSD: 2400, utilityAllowanceUSD: 710 },
      { grade: 'E9',  rentCeilingUSD: 2550, utilityAllowanceUSD: 730 },
      { grade: 'W1',  rentCeilingUSD: 2200, utilityAllowanceUSD: 680 },
      { grade: 'W2',  rentCeilingUSD: 2350, utilityAllowanceUSD: 700 },
      { grade: 'W3',  rentCeilingUSD: 2500, utilityAllowanceUSD: 720 },
      { grade: 'W4',  rentCeilingUSD: 2650, utilityAllowanceUSD: 740 },
      { grade: 'W5',  rentCeilingUSD: 2800, utilityAllowanceUSD: 760 },
      { grade: 'O1',  rentCeilingUSD: 2100, utilityAllowanceUSD: 670 },
      { grade: 'O2',  rentCeilingUSD: 2300, utilityAllowanceUSD: 700 },
      { grade: 'O3',  rentCeilingUSD: 2600, utilityAllowanceUSD: 730 },
      { grade: 'O4',  rentCeilingUSD: 2900, utilityAllowanceUSD: 760 },
      { grade: 'O5',  rentCeilingUSD: 3200, utilityAllowanceUSD: 790 },
      { grade: 'O6',  rentCeilingUSD: 3500, utilityAllowanceUSD: 820 },
      { grade: 'O7',  rentCeilingUSD: 3800, utilityAllowanceUSD: 850 },
      { grade: 'O8',  rentCeilingUSD: 3800, utilityAllowanceUSD: 850 },
      { grade: 'O9',  rentCeilingUSD: 3800, utilityAllowanceUSD: 850 },
      { grade: 'O10', rentCeilingUSD: 3800, utilityAllowanceUSD: 850 },
    ],
  },

  {
    // All Okinawa installations share one OHA area code (JA048).
    // Rates reflect the May 16 2026 increase per Stars & Stripes / USFJ.
    // Utility is a flat rate across all grades per USFJ policy.
    locationLabel: 'Okinawa (All Installations)',
    country: 'Japan', currency: 'JPY',
    installationIds: ['kadena','mcb_butler','camp_foster','camp_courtney','camp_kinser',
                      'camp_mctureous','camp_hansen','camp_schwab','torii_station','white_beach'],
    miha: 320, approximate: true,
    notes: 'All Okinawa bases share one OHA area. Utility is flat for all grades.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1800, utilityAllowanceUSD: 662 },
      { grade: 'E4',  rentCeilingUSD: 1800, utilityAllowanceUSD: 662 },
      { grade: 'E5',  rentCeilingUSD: 1943, utilityAllowanceUSD: 662 },
      { grade: 'E6',  rentCeilingUSD: 2050, utilityAllowanceUSD: 662 },
      { grade: 'E7',  rentCeilingUSD: 2105, utilityAllowanceUSD: 662 },
      { grade: 'E9',  rentCeilingUSD: 2250, utilityAllowanceUSD: 662 },
      { grade: 'W1',  rentCeilingUSD: 2100, utilityAllowanceUSD: 662 },
      { grade: 'W5',  rentCeilingUSD: 2450, utilityAllowanceUSD: 662 },
      { grade: 'O1',  rentCeilingUSD: 1943, utilityAllowanceUSD: 662 },
      { grade: 'O3',  rentCeilingUSD: 2105, utilityAllowanceUSD: 662 },
      { grade: 'O4',  rentCeilingUSD: 2600, utilityAllowanceUSD: 662 },
      { grade: 'O6',  rentCeilingUSD: 3100, utilityAllowanceUSD: 662 },
      { grade: 'O7',  rentCeilingUSD: 3500, utilityAllowanceUSD: 662 },
      { grade: 'O10', rentCeilingUSD: 3500, utilityAllowanceUSD: 662 },
    ],
  },

  {
    locationLabel: 'CFAY Yokosuka / Camp Zama / NAF Atsugi',
    country: 'Japan', currency: 'JPY',
    installationIds: ['yokosuka','camp_zama','atsugi'],
    miha: 370, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1400, utilityAllowanceUSD: 500 },
      { grade: 'E4',  rentCeilingUSD: 1400, utilityAllowanceUSD: 500 },
      { grade: 'E5',  rentCeilingUSD: 1800, utilityAllowanceUSD: 600 },
      { grade: 'E6',  rentCeilingUSD: 1950, utilityAllowanceUSD: 620 },
      { grade: 'E7',  rentCeilingUSD: 2100, utilityAllowanceUSD: 640 },
      { grade: 'E8',  rentCeilingUSD: 2250, utilityAllowanceUSD: 660 },
      { grade: 'E9',  rentCeilingUSD: 2400, utilityAllowanceUSD: 680 },
      { grade: 'O3',  rentCeilingUSD: 2450, utilityAllowanceUSD: 660 },
      { grade: 'O5',  rentCeilingUSD: 3000, utilityAllowanceUSD: 720 },
      { grade: 'O6',  rentCeilingUSD: 3300, utilityAllowanceUSD: 750 },
      { grade: 'O7',  rentCeilingUSD: 3600, utilityAllowanceUSD: 780 },
      { grade: 'O10', rentCeilingUSD: 3600, utilityAllowanceUSD: 780 },
    ],
  },

  {
    locationLabel: 'Misawa AB',
    country: 'Japan', currency: 'JPY',
    installationIds: ['misawa'],
    miha: 300, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 900, utilityAllowanceUSD: 400 },
      { grade: 'E4',  rentCeilingUSD: 900, utilityAllowanceUSD: 400 },
      { grade: 'E5',  rentCeilingUSD: 1100, utilityAllowanceUSD: 450 },
      { grade: 'E9',  rentCeilingUSD: 1500, utilityAllowanceUSD: 530 },
      { grade: 'O3',  rentCeilingUSD: 1400, utilityAllowanceUSD: 490 },
      { grade: 'O6',  rentCeilingUSD: 1900, utilityAllowanceUSD: 570 },
      { grade: 'O10', rentCeilingUSD: 1900, utilityAllowanceUSD: 570 },
    ],
  },

  {
    locationLabel: 'Iwakuni MCAS, Japan',
    country: 'Japan', currency: 'JPY',
    installationIds: ['mcas_iwakuni'],
    miha: 310, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1000, utilityAllowanceUSD: 420 },
      { grade: 'E4',  rentCeilingUSD: 1000, utilityAllowanceUSD: 420 },
      { grade: 'E5',  rentCeilingUSD: 1250, utilityAllowanceUSD: 470 },
      { grade: 'E9',  rentCeilingUSD: 1700, utilityAllowanceUSD: 550 },
      { grade: 'O3',  rentCeilingUSD: 1600, utilityAllowanceUSD: 520 },
      { grade: 'O6',  rentCeilingUSD: 2200, utilityAllowanceUSD: 600 },
      { grade: 'O10', rentCeilingUSD: 2200, utilityAllowanceUSD: 600 },
    ],
  },

  {
    locationLabel: 'Naval Base Sasebo, Japan',
    country: 'Japan', currency: 'JPY',
    installationIds: ['sasebo'],
    miha: 320, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1050, utilityAllowanceUSD: 470 },
      { grade: 'E4',  rentCeilingUSD: 1050, utilityAllowanceUSD: 470 },
      { grade: 'E5',  rentCeilingUSD: 1450, utilityAllowanceUSD: 560 },
      { grade: 'E9',  rentCeilingUSD: 1900, utilityAllowanceUSD: 660 },
      { grade: 'O3',  rentCeilingUSD: 1950, utilityAllowanceUSD: 640 },
      { grade: 'O6',  rentCeilingUSD: 2650, utilityAllowanceUSD: 760 },
      { grade: 'O10', rentCeilingUSD: 2650, utilityAllowanceUSD: 760 },
    ],
  },

  // ── SOUTH KOREA ────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Camp Humphreys, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['camp_humphreys'],
    miha: 330, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 900,  utilityAllowanceUSD: 310 },
      { grade: 'E4',  rentCeilingUSD: 900,  utilityAllowanceUSD: 310 },
      { grade: 'E5',  rentCeilingUSD: 1500, utilityAllowanceUSD: 410 },
      { grade: 'E6',  rentCeilingUSD: 1600, utilityAllowanceUSD: 430 },
      { grade: 'E7',  rentCeilingUSD: 1700, utilityAllowanceUSD: 450 },
      { grade: 'E8',  rentCeilingUSD: 1800, utilityAllowanceUSD: 470 },
      { grade: 'E9',  rentCeilingUSD: 1900, utilityAllowanceUSD: 490 },
      { grade: 'O3',  rentCeilingUSD: 2000, utilityAllowanceUSD: 480 },
      { grade: 'O5',  rentCeilingUSD: 2400, utilityAllowanceUSD: 530 },
      { grade: 'O6',  rentCeilingUSD: 2700, utilityAllowanceUSD: 570 },
      { grade: 'O10', rentCeilingUSD: 2700, utilityAllowanceUSD: 570 },
    ],
  },

  {
    locationLabel: 'Osan AB, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['osan'],
    miha: 320, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 900,  utilityAllowanceUSD: 310 },
      { grade: 'E4',  rentCeilingUSD: 900,  utilityAllowanceUSD: 310 },
      { grade: 'E5',  rentCeilingUSD: 1500, utilityAllowanceUSD: 410 },
      { grade: 'E9',  rentCeilingUSD: 1900, utilityAllowanceUSD: 490 },
      { grade: 'O3',  rentCeilingUSD: 2000, utilityAllowanceUSD: 480 },
      { grade: 'O6',  rentCeilingUSD: 2700, utilityAllowanceUSD: 570 },
      { grade: 'O10', rentCeilingUSD: 2700, utilityAllowanceUSD: 570 },
    ],
  },

  {
    locationLabel: 'Camp Walker / Camp Henry, Daegu',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['camp_walker','camp_henry'],
    miha: 290, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 750,  utilityAllowanceUSD: 280 },
      { grade: 'E4',  rentCeilingUSD: 750,  utilityAllowanceUSD: 280 },
      { grade: 'E5',  rentCeilingUSD: 1200, utilityAllowanceUSD: 380 },
      { grade: 'E9',  rentCeilingUSD: 1600, utilityAllowanceUSD: 460 },
      { grade: 'O3',  rentCeilingUSD: 1700, utilityAllowanceUSD: 450 },
      { grade: 'O6',  rentCeilingUSD: 2300, utilityAllowanceUSD: 540 },
      { grade: 'O10', rentCeilingUSD: 2300, utilityAllowanceUSD: 540 },
    ],
  },

  {
    locationLabel: 'Camp Casey / Camp Red Cloud, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['camp_casey','camp_red_cloud'],
    miha: 280, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 800,  utilityAllowanceUSD: 290 },
      { grade: 'E4',  rentCeilingUSD: 800,  utilityAllowanceUSD: 290 },
      { grade: 'E5',  rentCeilingUSD: 1300, utilityAllowanceUSD: 390 },
      { grade: 'E9',  rentCeilingUSD: 1700, utilityAllowanceUSD: 470 },
      { grade: 'O3',  rentCeilingUSD: 1800, utilityAllowanceUSD: 460 },
      { grade: 'O6',  rentCeilingUSD: 2450, utilityAllowanceUSD: 550 },
      { grade: 'O10', rentCeilingUSD: 2450, utilityAllowanceUSD: 550 },
    ],
  },

  {
    locationLabel: 'Kunsan AB / Camp Carroll, South Korea',
    country: 'South Korea', currency: 'KRW',
    installationIds: ['kunsan','camp_carroll'],
    miha: 270, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 700,  utilityAllowanceUSD: 260 },
      { grade: 'E4',  rentCeilingUSD: 700,  utilityAllowanceUSD: 260 },
      { grade: 'E5',  rentCeilingUSD: 1050, utilityAllowanceUSD: 350 },
      { grade: 'E9',  rentCeilingUSD: 1450, utilityAllowanceUSD: 430 },
      { grade: 'O3',  rentCeilingUSD: 1500, utilityAllowanceUSD: 420 },
      { grade: 'O6',  rentCeilingUSD: 2050, utilityAllowanceUSD: 510 },
      { grade: 'O10', rentCeilingUSD: 2050, utilityAllowanceUSD: 510 },
    ],
  },

  // ── GERMANY ────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Ramstein AB, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['ramstein','baumholder','kleber'],
    miha: 320, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 950,  utilityAllowanceUSD: 520 },
      { grade: 'E4',  rentCeilingUSD: 950,  utilityAllowanceUSD: 520 },
      { grade: 'E5',  rentCeilingUSD: 1450, utilityAllowanceUSD: 620 },
      { grade: 'E6',  rentCeilingUSD: 1600, utilityAllowanceUSD: 660 },
      { grade: 'E7',  rentCeilingUSD: 1750, utilityAllowanceUSD: 700 },
      { grade: 'E8',  rentCeilingUSD: 1900, utilityAllowanceUSD: 740 },
      { grade: 'E9',  rentCeilingUSD: 2050, utilityAllowanceUSD: 780 },
      { grade: 'O3',  rentCeilingUSD: 2100, utilityAllowanceUSD: 760 },
      { grade: 'O5',  rentCeilingUSD: 2600, utilityAllowanceUSD: 850 },
      { grade: 'O6',  rentCeilingUSD: 2900, utilityAllowanceUSD: 880 },
      { grade: 'O10', rentCeilingUSD: 2900, utilityAllowanceUSD: 880 },
    ],
  },

  {
    locationLabel: 'Stuttgart (HQ EUCOM / AFRICOM)',
    country: 'Germany', currency: 'EUR',
    installationIds: ['stuttgart','patch_barracks'],
    miha: 330, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1100, utilityAllowanceUSD: 600 },
      { grade: 'E4',  rentCeilingUSD: 1100, utilityAllowanceUSD: 600 },
      { grade: 'E5',  rentCeilingUSD: 1650, utilityAllowanceUSD: 720 },
      { grade: 'E9',  rentCeilingUSD: 2300, utilityAllowanceUSD: 860 },
      { grade: 'O3',  rentCeilingUSD: 2400, utilityAllowanceUSD: 840 },
      { grade: 'O6',  rentCeilingUSD: 3300, utilityAllowanceUSD: 970 },
      { grade: 'O10', rentCeilingUSD: 3300, utilityAllowanceUSD: 970 },
    ],
  },

  {
    locationLabel: 'Wiesbaden / Clay Kaserne',
    country: 'Germany', currency: 'EUR',
    installationIds: ['wiesbaden'],
    miha: 340, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1050, utilityAllowanceUSD: 580 },
      { grade: 'E4',  rentCeilingUSD: 1050, utilityAllowanceUSD: 580 },
      { grade: 'E5',  rentCeilingUSD: 1550, utilityAllowanceUSD: 690 },
      { grade: 'E9',  rentCeilingUSD: 2200, utilityAllowanceUSD: 840 },
      { grade: 'O3',  rentCeilingUSD: 2300, utilityAllowanceUSD: 820 },
      { grade: 'O6',  rentCeilingUSD: 3100, utilityAllowanceUSD: 950 },
      { grade: 'O10', rentCeilingUSD: 3100, utilityAllowanceUSD: 950 },
    ],
  },

  {
    locationLabel: 'Spangdahlem AB, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['spangdahlem'],
    miha: 310, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 800,  utilityAllowanceUSD: 480 },
      { grade: 'E4',  rentCeilingUSD: 800,  utilityAllowanceUSD: 480 },
      { grade: 'E5',  rentCeilingUSD: 1150, utilityAllowanceUSD: 560 },
      { grade: 'E9',  rentCeilingUSD: 1650, utilityAllowanceUSD: 680 },
      { grade: 'O3',  rentCeilingUSD: 1700, utilityAllowanceUSD: 660 },
      { grade: 'O6',  rentCeilingUSD: 2300, utilityAllowanceUSD: 780 },
      { grade: 'O10', rentCeilingUSD: 2300, utilityAllowanceUSD: 780 },
    ],
  },

  {
    locationLabel: 'Grafenwöhr / Vilseck, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['grafenwoehr','vilseck'],
    miha: 290, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 750,  utilityAllowanceUSD: 460 },
      { grade: 'E4',  rentCeilingUSD: 750,  utilityAllowanceUSD: 460 },
      { grade: 'E5',  rentCeilingUSD: 1100, utilityAllowanceUSD: 540 },
      { grade: 'E9',  rentCeilingUSD: 1550, utilityAllowanceUSD: 650 },
      { grade: 'O3',  rentCeilingUSD: 1600, utilityAllowanceUSD: 640 },
      { grade: 'O6',  rentCeilingUSD: 2200, utilityAllowanceUSD: 760 },
      { grade: 'O10', rentCeilingUSD: 2200, utilityAllowanceUSD: 760 },
    ],
  },

  {
    locationLabel: 'USAG Ansbach, Germany',
    country: 'Germany', currency: 'EUR',
    installationIds: ['ansbach'],
    miha: 285, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 700,  utilityAllowanceUSD: 450 },
      { grade: 'E4',  rentCeilingUSD: 700,  utilityAllowanceUSD: 450 },
      { grade: 'E5',  rentCeilingUSD: 1050, utilityAllowanceUSD: 530 },
      { grade: 'E9',  rentCeilingUSD: 1500, utilityAllowanceUSD: 640 },
      { grade: 'O3',  rentCeilingUSD: 1550, utilityAllowanceUSD: 620 },
      { grade: 'O6',  rentCeilingUSD: 2100, utilityAllowanceUSD: 750 },
      { grade: 'O10', rentCeilingUSD: 2100, utilityAllowanceUSD: 750 },
    ],
  },

  // ── UNITED KINGDOM ─────────────────────────────────────────────────────────────
  {
    locationLabel: 'RAF Lakenheath, UK',
    country: 'United Kingdom', currency: 'GBP',
    installationIds: ['lakenheath'],
    miha: 330, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1100, utilityAllowanceUSD: 420 },
      { grade: 'E4',  rentCeilingUSD: 1100, utilityAllowanceUSD: 420 },
      { grade: 'E5',  rentCeilingUSD: 1500, utilityAllowanceUSD: 510 },
      { grade: 'E6',  rentCeilingUSD: 1650, utilityAllowanceUSD: 540 },
      { grade: 'E7',  rentCeilingUSD: 1800, utilityAllowanceUSD: 570 },
      { grade: 'E8',  rentCeilingUSD: 1950, utilityAllowanceUSD: 600 },
      { grade: 'E9',  rentCeilingUSD: 2100, utilityAllowanceUSD: 630 },
      { grade: 'O3',  rentCeilingUSD: 2150, utilityAllowanceUSD: 610 },
      { grade: 'O5',  rentCeilingUSD: 2650, utilityAllowanceUSD: 690 },
      { grade: 'O6',  rentCeilingUSD: 2950, utilityAllowanceUSD: 730 },
      { grade: 'O10', rentCeilingUSD: 2950, utilityAllowanceUSD: 730 },
    ],
  },

  {
    locationLabel: 'RAF Mildenhall, UK',
    country: 'United Kingdom', currency: 'GBP',
    installationIds: ['mildenhall'],
    miha: 325, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1100, utilityAllowanceUSD: 420 },
      { grade: 'E4',  rentCeilingUSD: 1100, utilityAllowanceUSD: 420 },
      { grade: 'E5',  rentCeilingUSD: 1500, utilityAllowanceUSD: 510 },
      { grade: 'E9',  rentCeilingUSD: 2100, utilityAllowanceUSD: 630 },
      { grade: 'O3',  rentCeilingUSD: 2150, utilityAllowanceUSD: 610 },
      { grade: 'O6',  rentCeilingUSD: 2950, utilityAllowanceUSD: 730 },
      { grade: 'O10', rentCeilingUSD: 2950, utilityAllowanceUSD: 730 },
    ],
  },

  {
    locationLabel: 'RAF Croughton / Alconbury, UK',
    country: 'United Kingdom', currency: 'GBP',
    installationIds: ['alconbury','raf_croughton'],
    miha: 320, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1000, utilityAllowanceUSD: 390 },
      { grade: 'E4',  rentCeilingUSD: 1000, utilityAllowanceUSD: 390 },
      { grade: 'E5',  rentCeilingUSD: 1350, utilityAllowanceUSD: 470 },
      { grade: 'E9',  rentCeilingUSD: 1850, utilityAllowanceUSD: 580 },
      { grade: 'O3',  rentCeilingUSD: 1900, utilityAllowanceUSD: 560 },
      { grade: 'O6',  rentCeilingUSD: 2600, utilityAllowanceUSD: 670 },
      { grade: 'O10', rentCeilingUSD: 2600, utilityAllowanceUSD: 670 },
    ],
  },

  // ── ITALY ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Aviano AB, Italy',
    country: 'Italy', currency: 'EUR',
    installationIds: ['aviano'],
    miha: 300, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 900,  utilityAllowanceUSD: 380 },
      { grade: 'E4',  rentCeilingUSD: 900,  utilityAllowanceUSD: 380 },
      { grade: 'E5',  rentCeilingUSD: 1300, utilityAllowanceUSD: 460 },
      { grade: 'E9',  rentCeilingUSD: 1850, utilityAllowanceUSD: 580 },
      { grade: 'O3',  rentCeilingUSD: 1900, utilityAllowanceUSD: 560 },
      { grade: 'O6',  rentCeilingUSD: 2600, utilityAllowanceUSD: 670 },
      { grade: 'O10', rentCeilingUSD: 2600, utilityAllowanceUSD: 670 },
    ],
  },

  {
    locationLabel: 'NAS Sigonella, Sicily',
    country: 'Italy', currency: 'EUR',
    installationIds: ['sigonella'],
    miha: 295, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 800,  utilityAllowanceUSD: 350 },
      { grade: 'E4',  rentCeilingUSD: 800,  utilityAllowanceUSD: 350 },
      { grade: 'E5',  rentCeilingUSD: 1100, utilityAllowanceUSD: 420 },
      { grade: 'E9',  rentCeilingUSD: 1550, utilityAllowanceUSD: 530 },
      { grade: 'O3',  rentCeilingUSD: 1600, utilityAllowanceUSD: 510 },
      { grade: 'O6',  rentCeilingUSD: 2200, utilityAllowanceUSD: 620 },
      { grade: 'O10', rentCeilingUSD: 2200, utilityAllowanceUSD: 620 },
    ],
  },

  {
    locationLabel: 'Naval Support Activity Naples',
    country: 'Italy', currency: 'EUR',
    installationIds: ['naples'],
    miha: 320, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 950,  utilityAllowanceUSD: 390 },
      { grade: 'E4',  rentCeilingUSD: 950,  utilityAllowanceUSD: 390 },
      { grade: 'E5',  rentCeilingUSD: 1500, utilityAllowanceUSD: 490 },
      { grade: 'E9',  rentCeilingUSD: 2100, utilityAllowanceUSD: 620 },
      { grade: 'O3',  rentCeilingUSD: 2200, utilityAllowanceUSD: 600 },
      { grade: 'O6',  rentCeilingUSD: 3000, utilityAllowanceUSD: 730 },
      { grade: 'O10', rentCeilingUSD: 3000, utilityAllowanceUSD: 730 },
    ],
  },

  // ── SPAIN ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Naval Station Rota, Spain',
    country: 'Spain', currency: 'EUR',
    installationIds: ['rota'],
    miha: 290, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 750,  utilityAllowanceUSD: 320 },
      { grade: 'E4',  rentCeilingUSD: 750,  utilityAllowanceUSD: 320 },
      { grade: 'E5',  rentCeilingUSD: 1050, utilityAllowanceUSD: 400 },
      { grade: 'E9',  rentCeilingUSD: 1450, utilityAllowanceUSD: 500 },
      { grade: 'O3',  rentCeilingUSD: 1500, utilityAllowanceUSD: 480 },
      { grade: 'O6',  rentCeilingUSD: 2050, utilityAllowanceUSD: 590 },
      { grade: 'O10', rentCeilingUSD: 2050, utilityAllowanceUSD: 590 },
    ],
  },

  {
    locationLabel: 'Morón AB, Spain',
    country: 'Spain', currency: 'EUR',
    installationIds: ['moron'],
    miha: 285, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 700,  utilityAllowanceUSD: 300 },
      { grade: 'E4',  rentCeilingUSD: 700,  utilityAllowanceUSD: 300 },
      { grade: 'E5',  rentCeilingUSD: 950,  utilityAllowanceUSD: 370 },
      { grade: 'E9',  rentCeilingUSD: 1300, utilityAllowanceUSD: 460 },
      { grade: 'O3',  rentCeilingUSD: 1350, utilityAllowanceUSD: 440 },
      { grade: 'O6',  rentCeilingUSD: 1850, utilityAllowanceUSD: 550 },
      { grade: 'O10', rentCeilingUSD: 1850, utilityAllowanceUSD: 550 },
    ],
  },

  // ── MIDDLE EAST ────────────────────────────────────────────────────────────────
  {
    locationLabel: 'NSA Bahrain (5th Fleet HQ)',
    country: 'Bahrain', currency: 'BHD',
    installationIds: ['bahrain'],
    miha: 330, approximate: true,
    notes: 'BHD pegged to USD — more stable than other OCONUS locations.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1100, utilityAllowanceUSD: 330 },
      { grade: 'E4',  rentCeilingUSD: 1100, utilityAllowanceUSD: 330 },
      { grade: 'E5',  rentCeilingUSD: 1750, utilityAllowanceUSD: 450 },
      { grade: 'E6',  rentCeilingUSD: 1900, utilityAllowanceUSD: 470 },
      { grade: 'E7',  rentCeilingUSD: 2050, utilityAllowanceUSD: 490 },
      { grade: 'E8',  rentCeilingUSD: 2200, utilityAllowanceUSD: 510 },
      { grade: 'E9',  rentCeilingUSD: 2350, utilityAllowanceUSD: 530 },
      { grade: 'O3',  rentCeilingUSD: 2400, utilityAllowanceUSD: 510 },
      { grade: 'O5',  rentCeilingUSD: 3000, utilityAllowanceUSD: 590 },
      { grade: 'O6',  rentCeilingUSD: 3350, utilityAllowanceUSD: 640 },
      { grade: 'O10', rentCeilingUSD: 3350, utilityAllowanceUSD: 640 },
    ],
  },

  {
    locationLabel: 'Al Udeid AB, Qatar',
    country: 'Qatar', currency: 'QAR',
    installationIds: ['al_udeid'],
    miha: 310, approximate: true,
    notes: 'Most personnel are on AEF rotations; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1300, utilityAllowanceUSD: 380 },
      { grade: 'E4',  rentCeilingUSD: 1300, utilityAllowanceUSD: 380 },
      { grade: 'E5',  rentCeilingUSD: 1900, utilityAllowanceUSD: 490 },
      { grade: 'E9',  rentCeilingUSD: 2600, utilityAllowanceUSD: 600 },
      { grade: 'O3',  rentCeilingUSD: 2700, utilityAllowanceUSD: 580 },
      { grade: 'O6',  rentCeilingUSD: 3700, utilityAllowanceUSD: 710 },
      { grade: 'O10', rentCeilingUSD: 3700, utilityAllowanceUSD: 710 },
    ],
  },

  // ── AFRICA ─────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Camp Lemonnier, Djibouti',
    country: 'Djibouti', currency: 'DJF',
    installationIds: ['camp_lemonnier'],
    miha: 260, approximate: true,
    notes: 'Primarily rotational forces; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 800,  utilityAllowanceUSD: 280 },
      { grade: 'E4',  rentCeilingUSD: 800,  utilityAllowanceUSD: 280 },
      { grade: 'E5',  rentCeilingUSD: 1100, utilityAllowanceUSD: 350 },
      { grade: 'E9',  rentCeilingUSD: 1500, utilityAllowanceUSD: 440 },
      { grade: 'O3',  rentCeilingUSD: 1550, utilityAllowanceUSD: 420 },
      { grade: 'O6',  rentCeilingUSD: 2100, utilityAllowanceUSD: 520 },
      { grade: 'O10', rentCeilingUSD: 2100, utilityAllowanceUSD: 520 },
    ],
  },

  // ── OTHER EUROPE ───────────────────────────────────────────────────────────────
  {
    locationLabel: 'Incirlik AB, Turkey',
    country: 'Turkey', currency: 'TRY',
    installationIds: ['incirlik'],
    miha: 260, approximate: true,
    notes: 'Turkish lira volatility — USD values fluctuate significantly.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 700,  utilityAllowanceUSD: 260 },
      { grade: 'E4',  rentCeilingUSD: 700,  utilityAllowanceUSD: 260 },
      { grade: 'E5',  rentCeilingUSD: 950,  utilityAllowanceUSD: 330 },
      { grade: 'E9',  rentCeilingUSD: 1300, utilityAllowanceUSD: 420 },
      { grade: 'O3',  rentCeilingUSD: 1350, utilityAllowanceUSD: 400 },
      { grade: 'O6',  rentCeilingUSD: 1850, utilityAllowanceUSD: 500 },
      { grade: 'O10', rentCeilingUSD: 1850, utilityAllowanceUSD: 500 },
    ],
  },

  // ── ITALY (additional) ─────────────────────────────────────────────────────────
  {
    locationLabel: 'USAG Italy (Vicenza)',
    country: 'Italy', currency: 'EUR',
    installationIds: ['vicenza'],
    miha: 310, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 950,  utilityAllowanceUSD: 390 },
      { grade: 'E4',  rentCeilingUSD: 950,  utilityAllowanceUSD: 390 },
      { grade: 'E5',  rentCeilingUSD: 1400, utilityAllowanceUSD: 480 },
      { grade: 'E9',  rentCeilingUSD: 2000, utilityAllowanceUSD: 600 },
      { grade: 'O3',  rentCeilingUSD: 2050, utilityAllowanceUSD: 580 },
      { grade: 'O6',  rentCeilingUSD: 2800, utilityAllowanceUSD: 710 },
      { grade: 'O10', rentCeilingUSD: 2800, utilityAllowanceUSD: 710 },
    ],
  },

  {
    locationLabel: 'Camp Darby, Italy',
    country: 'Italy', currency: 'EUR',
    installationIds: ['camp_darby'],
    miha: 295, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 900,  utilityAllowanceUSD: 370 },
      { grade: 'E4',  rentCeilingUSD: 900,  utilityAllowanceUSD: 370 },
      { grade: 'E5',  rentCeilingUSD: 1300, utilityAllowanceUSD: 460 },
      { grade: 'E9',  rentCeilingUSD: 1850, utilityAllowanceUSD: 580 },
      { grade: 'O3',  rentCeilingUSD: 1900, utilityAllowanceUSD: 560 },
      { grade: 'O6',  rentCeilingUSD: 2600, utilityAllowanceUSD: 680 },
      { grade: 'O10', rentCeilingUSD: 2600, utilityAllowanceUSD: 680 },
    ],
  },

  // ── OTHER EUROPE ───────────────────────────────────────────────────────────────
  {
    locationLabel: 'SHAPE / Chièvres, Belgium',
    country: 'Belgium', currency: 'EUR',
    installationIds: ['mons','chievres'],
    miha: 340, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1200, utilityAllowanceUSD: 560 },
      { grade: 'E4',  rentCeilingUSD: 1200, utilityAllowanceUSD: 560 },
      { grade: 'E5',  rentCeilingUSD: 1650, utilityAllowanceUSD: 680 },
      { grade: 'E9',  rentCeilingUSD: 2350, utilityAllowanceUSD: 860 },
      { grade: 'O3',  rentCeilingUSD: 2400, utilityAllowanceUSD: 840 },
      { grade: 'O6',  rentCeilingUSD: 3300, utilityAllowanceUSD: 980 },
      { grade: 'O10', rentCeilingUSD: 3300, utilityAllowanceUSD: 980 },
    ],
  },

  {
    locationLabel: 'Lajes Field, Azores',
    country: 'Portugal (Azores)', currency: 'EUR',
    installationIds: ['lajes'],
    miha: 270, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 650,  utilityAllowanceUSD: 300 },
      { grade: 'E4',  rentCeilingUSD: 650,  utilityAllowanceUSD: 300 },
      { grade: 'E5',  rentCeilingUSD: 900,  utilityAllowanceUSD: 370 },
      { grade: 'E9',  rentCeilingUSD: 1200, utilityAllowanceUSD: 460 },
      { grade: 'O3',  rentCeilingUSD: 1250, utilityAllowanceUSD: 440 },
      { grade: 'O6',  rentCeilingUSD: 1700, utilityAllowanceUSD: 540 },
      { grade: 'O10', rentCeilingUSD: 1700, utilityAllowanceUSD: 540 },
    ],
  },

  {
    locationLabel: 'NSA Souda Bay, Greece',
    country: 'Greece', currency: 'EUR',
    installationIds: ['souda_bay'],
    miha: 275, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 750,  utilityAllowanceUSD: 310 },
      { grade: 'E4',  rentCeilingUSD: 750,  utilityAllowanceUSD: 310 },
      { grade: 'E5',  rentCeilingUSD: 1050, utilityAllowanceUSD: 390 },
      { grade: 'E9',  rentCeilingUSD: 1450, utilityAllowanceUSD: 490 },
      { grade: 'O3',  rentCeilingUSD: 1500, utilityAllowanceUSD: 470 },
      { grade: 'O6',  rentCeilingUSD: 2050, utilityAllowanceUSD: 580 },
      { grade: 'O10', rentCeilingUSD: 2050, utilityAllowanceUSD: 580 },
    ],
  },

  // ── MIDDLE EAST (additional) ───────────────────────────────────────────────────
  {
    locationLabel: 'Kuwait (Arifjan / Ali Al Salem / Buehring)',
    country: 'Kuwait', currency: 'KWD',
    installationIds: ['camp_arifjan','ali_al_salem','camp_buehring'],
    miha: 280, approximate: true,
    notes: 'Most personnel are on deployment orders; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1100, utilityAllowanceUSD: 330 },
      { grade: 'E4',  rentCeilingUSD: 1100, utilityAllowanceUSD: 330 },
      { grade: 'E5',  rentCeilingUSD: 1500, utilityAllowanceUSD: 420 },
      { grade: 'E9',  rentCeilingUSD: 2000, utilityAllowanceUSD: 530 },
      { grade: 'O3',  rentCeilingUSD: 2100, utilityAllowanceUSD: 510 },
      { grade: 'O6',  rentCeilingUSD: 2800, utilityAllowanceUSD: 620 },
      { grade: 'O10', rentCeilingUSD: 2800, utilityAllowanceUSD: 620 },
    ],
  },

  {
    locationLabel: 'Al Dhafra AB, UAE',
    country: 'United Arab Emirates', currency: 'AED',
    installationIds: ['al_dhafra'],
    miha: 310, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1400, utilityAllowanceUSD: 370 },
      { grade: 'E4',  rentCeilingUSD: 1400, utilityAllowanceUSD: 370 },
      { grade: 'E5',  rentCeilingUSD: 2000, utilityAllowanceUSD: 480 },
      { grade: 'E9',  rentCeilingUSD: 2700, utilityAllowanceUSD: 600 },
      { grade: 'O3',  rentCeilingUSD: 2800, utilityAllowanceUSD: 580 },
      { grade: 'O6',  rentCeilingUSD: 3800, utilityAllowanceUSD: 710 },
      { grade: 'O10', rentCeilingUSD: 3800, utilityAllowanceUSD: 710 },
    ],
  },

  {
    locationLabel: 'Prince Sultan AB, Saudi Arabia',
    country: 'Saudi Arabia', currency: 'SAR',
    installationIds: ['prince_sultan'],
    miha: 290, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1200, utilityAllowanceUSD: 340 },
      { grade: 'E4',  rentCeilingUSD: 1200, utilityAllowanceUSD: 340 },
      { grade: 'E5',  rentCeilingUSD: 1700, utilityAllowanceUSD: 440 },
      { grade: 'E9',  rentCeilingUSD: 2300, utilityAllowanceUSD: 560 },
      { grade: 'O3',  rentCeilingUSD: 2400, utilityAllowanceUSD: 540 },
      { grade: 'O6',  rentCeilingUSD: 3200, utilityAllowanceUSD: 660 },
      { grade: 'O10', rentCeilingUSD: 3200, utilityAllowanceUSD: 660 },
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
    miha: 350, approximate: true,
    notes: 'All Guam bases share one OHA area. High utility costs due to island power grid.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1800, utilityAllowanceUSD: 1180 },
      { grade: 'E4',  rentCeilingUSD: 1800, utilityAllowanceUSD: 1180 },
      { grade: 'E5',  rentCeilingUSD: 2450, utilityAllowanceUSD: 1576 },
      { grade: 'E9',  rentCeilingUSD: 3200, utilityAllowanceUSD: 1900 },
      { grade: 'O3',  rentCeilingUSD: 3300, utilityAllowanceUSD: 1850 },
      { grade: 'O6',  rentCeilingUSD: 4300, utilityAllowanceUSD: 2200 },
      { grade: 'O10', rentCeilingUSD: 4300, utilityAllowanceUSD: 2200 },
    ],
  },

  {
    locationLabel: 'Kwajalein Atoll (USAKA)',
    country: 'Marshall Islands', currency: 'USD',
    installationIds: ['kwajalein'],
    miha: 250, approximate: true,
    notes: 'Remote isolated duty — government housing is primary.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 600,  utilityAllowanceUSD: 260 },
      { grade: 'E4',  rentCeilingUSD: 600,  utilityAllowanceUSD: 260 },
      { grade: 'E5',  rentCeilingUSD: 800,  utilityAllowanceUSD: 320 },
      { grade: 'E9',  rentCeilingUSD: 1100, utilityAllowanceUSD: 400 },
      { grade: 'O3',  rentCeilingUSD: 1100, utilityAllowanceUSD: 390 },
      { grade: 'O6',  rentCeilingUSD: 1500, utilityAllowanceUSD: 480 },
      { grade: 'O10', rentCeilingUSD: 1500, utilityAllowanceUSD: 480 },
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
    miha: 250, approximate: true,
    notes: 'Mostly rotational forces; verify PCS OHA eligibility.',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 700,  utilityAllowanceUSD: 240 },
      { grade: 'E4',  rentCeilingUSD: 700,  utilityAllowanceUSD: 240 },
      { grade: 'E5',  rentCeilingUSD: 950,  utilityAllowanceUSD: 310 },
      { grade: 'E9',  rentCeilingUSD: 1300, utilityAllowanceUSD: 390 },
      { grade: 'O3',  rentCeilingUSD: 1350, utilityAllowanceUSD: 370 },
      { grade: 'O6',  rentCeilingUSD: 1850, utilityAllowanceUSD: 460 },
      { grade: 'O10', rentCeilingUSD: 1850, utilityAllowanceUSD: 460 },
    ],
  },

  {
    locationLabel: 'Fort Buchanan, Puerto Rico',
    country: 'Puerto Rico (U.S. Territory)', currency: 'USD',
    installationIds: ['fort_buchanan'],
    miha: 300, approximate: true,
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1200, utilityAllowanceUSD: 360 },
      { grade: 'E4',  rentCeilingUSD: 1200, utilityAllowanceUSD: 360 },
      { grade: 'E5',  rentCeilingUSD: 1600, utilityAllowanceUSD: 460 },
      { grade: 'E9',  rentCeilingUSD: 2200, utilityAllowanceUSD: 580 },
      { grade: 'O3',  rentCeilingUSD: 2300, utilityAllowanceUSD: 560 },
      { grade: 'O6',  rentCeilingUSD: 3100, utilityAllowanceUSD: 680 },
      { grade: 'O10', rentCeilingUSD: 3100, utilityAllowanceUSD: 680 },
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
