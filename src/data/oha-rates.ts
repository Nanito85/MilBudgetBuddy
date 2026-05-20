/**
 * OHA (Overseas Housing Allowance) rate database.
 *
 * OHA consists of two components:
 *   1. Rent ceiling — reimburses actual rent paid up to the ceiling
 *   2. Utility/MIHA allowance — fixed monthly allowance for utilities
 *
 * Rates are set QUARTERLY by DTMO and fluctuate with local exchange rates.
 * Source: https://www.travel.dod.mil/Allowances/OHA/
 *
 * HOW TO UPDATE:
 *   1. Visit https://www.travel.dod.mil/Allowances/OHA/OHA-Rate-Details/
 *   2. Download the quarterly rate table for each country.
 *   3. Update OHA_DATA_QUARTER to the new quarter (e.g., 'Q3 2026').
 *   4. Update OHA_EFFECTIVE_DATE to the new effective date.
 *   5. Update the RATES entries below with the new values.
 *   6. Run: npx tsc --noEmit --skipLibCheck to verify no type errors.
 *
 * QUARTERLY SCHEDULE:
 *   Q1: effective January 1
 *   Q2: effective April 1
 *   Q3: effective July 1
 *   Q4: effective October 1
 */

import { PayGrade } from '@/data/bah-rates';

export const OHA_DATA_QUARTER   = 'Q1 2026';
export const OHA_EFFECTIVE_DATE = '2026-01-01';

// Check whether OHA data is potentially stale (more than ~91 days old).
export function isOhaDataStale(): boolean {
  const effective = new Date(OHA_EFFECTIVE_DATE);
  const staleAfter = new Date(effective.getTime() + 91 * 24 * 60 * 60 * 1000);
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
  rentCeilingUSD: number;        // maximum monthly rent reimbursed
  utilityAllowanceUSD: number;   // fixed monthly utility/MIHA amount
}

export interface OhaLocationRate {
  /** Must match an OhaLocation.label in oha-locations.ts */
  locationLabel: string;
  country: string;
  /** ISO currency code for the local market (informational) */
  currency: string;
  /** Grade-indexed rates — if a grade is missing, interpolate from nearest bracket */
  rates: OhaGradeRate[];
}

// ── Rate data — Q1 2026 ────────────────────────────────────────────────────────
// Amounts are approximate USD equivalents at Q1 2026 exchange rates.
// Source: DTMO OHA rate tables + Stars and Stripes reporting (May 2026 Okinawa increase).

export const OHA_RATES: OhaLocationRate[] = [

  // ── JAPAN ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Yokota AB / Tokyo Area',
    country: 'Japan',
    currency: 'JPY',
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
    locationLabel: 'Kadena AB, Okinawa',
    country: 'Japan',
    currency: 'JPY',
    // NOTE: OHA was increased May 2026 per Stars & Stripes reporting.
    // E1-E4 received +$396/mo; E5 received +$504/mo above prior ceiling.
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1350, utilityAllowanceUSD: 480 },
      { grade: 'E2',  rentCeilingUSD: 1350, utilityAllowanceUSD: 480 },
      { grade: 'E3',  rentCeilingUSD: 1350, utilityAllowanceUSD: 480 },
      { grade: 'E4',  rentCeilingUSD: 1350, utilityAllowanceUSD: 480 },
      { grade: 'E5',  rentCeilingUSD: 1550, utilityAllowanceUSD: 550 },
      { grade: 'E6',  rentCeilingUSD: 1700, utilityAllowanceUSD: 570 },
      { grade: 'E7',  rentCeilingUSD: 1850, utilityAllowanceUSD: 590 },
      { grade: 'E8',  rentCeilingUSD: 2000, utilityAllowanceUSD: 610 },
      { grade: 'E9',  rentCeilingUSD: 2150, utilityAllowanceUSD: 630 },
      { grade: 'W1',  rentCeilingUSD: 1800, utilityAllowanceUSD: 570 },
      { grade: 'W2',  rentCeilingUSD: 1950, utilityAllowanceUSD: 590 },
      { grade: 'W3',  rentCeilingUSD: 2100, utilityAllowanceUSD: 610 },
      { grade: 'W4',  rentCeilingUSD: 2250, utilityAllowanceUSD: 630 },
      { grade: 'W5',  rentCeilingUSD: 2400, utilityAllowanceUSD: 650 },
      { grade: 'O1',  rentCeilingUSD: 1750, utilityAllowanceUSD: 560 },
      { grade: 'O2',  rentCeilingUSD: 1950, utilityAllowanceUSD: 590 },
      { grade: 'O3',  rentCeilingUSD: 2200, utilityAllowanceUSD: 620 },
      { grade: 'O4',  rentCeilingUSD: 2500, utilityAllowanceUSD: 650 },
      { grade: 'O5',  rentCeilingUSD: 2800, utilityAllowanceUSD: 680 },
      { grade: 'O6',  rentCeilingUSD: 3100, utilityAllowanceUSD: 710 },
      { grade: 'O7',  rentCeilingUSD: 3400, utilityAllowanceUSD: 740 },
      { grade: 'O8',  rentCeilingUSD: 3400, utilityAllowanceUSD: 740 },
      { grade: 'O9',  rentCeilingUSD: 3400, utilityAllowanceUSD: 740 },
      { grade: 'O10', rentCeilingUSD: 3400, utilityAllowanceUSD: 740 },
    ],
  },

  {
    locationLabel: 'CFAY Yokosuka',
    country: 'Japan',
    currency: 'JPY',
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
    country: 'Japan',
    currency: 'JPY',
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
    locationLabel: 'Camp Foster / Futenma, Okinawa',
    country: 'Japan',
    currency: 'JPY',
    rates: [
      { grade: 'E1',  rentCeilingUSD: 1350, utilityAllowanceUSD: 480 },
      { grade: 'E4',  rentCeilingUSD: 1350, utilityAllowanceUSD: 480 },
      { grade: 'E5',  rentCeilingUSD: 1550, utilityAllowanceUSD: 550 },
      { grade: 'E9',  rentCeilingUSD: 2150, utilityAllowanceUSD: 630 },
      { grade: 'O3',  rentCeilingUSD: 2200, utilityAllowanceUSD: 620 },
      { grade: 'O6',  rentCeilingUSD: 3100, utilityAllowanceUSD: 710 },
      { grade: 'O10', rentCeilingUSD: 3100, utilityAllowanceUSD: 710 },
    ],
  },

  {
    locationLabel: 'Iwakuni MCAS, Japan',
    country: 'Japan',
    currency: 'JPY',
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

  // ── SOUTH KOREA ────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Camp Humphreys, South Korea',
    country: 'South Korea',
    currency: 'KRW',
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
    country: 'South Korea',
    currency: 'KRW',
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
    locationLabel: 'Camp Walker / Daegu, South Korea',
    country: 'South Korea',
    currency: 'KRW',
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

  // ── GERMANY ────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Ramstein AB, Germany',
    country: 'Germany',
    currency: 'EUR',
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
    country: 'Germany',
    currency: 'EUR',
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
    country: 'Germany',
    currency: 'EUR',
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
    country: 'Germany',
    currency: 'EUR',
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
    country: 'Germany',
    currency: 'EUR',
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

  // ── UNITED KINGDOM ─────────────────────────────────────────────────────────────
  {
    locationLabel: 'RAF Lakenheath, UK',
    country: 'United Kingdom',
    currency: 'GBP',
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
    country: 'United Kingdom',
    currency: 'GBP',
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
    country: 'United Kingdom',
    currency: 'GBP',
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
    country: 'Italy',
    currency: 'EUR',
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
    country: 'Italy',
    currency: 'EUR',
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
    country: 'Italy',
    currency: 'EUR',
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
    country: 'Spain',
    currency: 'EUR',
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
    country: 'Spain',
    currency: 'EUR',
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
    country: 'Bahrain',
    currency: 'BHD',
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
    country: 'Qatar',
    currency: 'QAR',
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
    country: 'Djibouti',
    currency: 'DJF',
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

  // ── OTHER ──────────────────────────────────────────────────────────────────────
  {
    locationLabel: 'Incirlik AB, Turkey',
    country: 'Turkey',
    currency: 'TRY',
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
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Get rates for a specific OCONUS location (by OhaLocation.label). */
export function getOhaLocationRates(locationLabel: string): OhaLocationRate | undefined {
  return OHA_RATES.find(r => r.locationLabel === locationLabel);
}

/**
 * Get the OHA rate for a specific location and pay grade.
 * Interpolates from the nearest grade bracket if an exact match doesn't exist.
 */
export function getOhaRate(
  locationLabel: string,
  grade: PayGrade,
): { rentCeilingUSD: number; utilityAllowanceUSD: number } | null {
  const loc = getOhaLocationRates(locationLabel);
  if (!loc) return null;

  // Exact match
  const exact = loc.rates.find(r => r.grade === grade);
  if (exact) return { rentCeilingUSD: exact.rentCeilingUSD, utilityAllowanceUSD: exact.utilityAllowanceUSD };

  // Grade order for interpolation
  const GRADE_ORDER: PayGrade[] = [
    'E1','E2','E3','E4','E5','E6','E7','E8','E9',
    'W1','W2','W3','W4','W5',
    'O1','O2','O3','O4','O5','O6','O7','O8','O9','O10',
  ];
  const targetIdx = GRADE_ORDER.indexOf(grade);
  const available = loc.rates.map(r => ({ idx: GRADE_ORDER.indexOf(r.grade), rate: r }));
  available.sort((a, b) => a.idx - b.idx);

  // Find nearest bracket
  const lower = [...available].reverse().find(r => r.idx <= targetIdx);
  const upper = available.find(r => r.idx >= targetIdx);

  if (lower && upper && lower.idx !== upper.idx) {
    const t = (targetIdx - lower.idx) / (upper.idx - lower.idx);
    return {
      rentCeilingUSD: Math.round(lower.rate.rentCeilingUSD + t * (upper.rate.rentCeilingUSD - lower.rate.rentCeilingUSD)),
      utilityAllowanceUSD: Math.round(lower.rate.utilityAllowanceUSD + t * (upper.rate.utilityAllowanceUSD - lower.rate.utilityAllowanceUSD)),
    };
  }

  // Fall back to closest available
  const closest = lower ?? upper;
  if (closest) return { rentCeilingUSD: closest.rate.rentCeilingUSD, utilityAllowanceUSD: closest.rate.utilityAllowanceUSD };
  return null;
}

/** Total OHA entitlement (rent ceiling + utility allowance). */
export function getOhaTotalCeiling(locationLabel: string, grade: PayGrade): number | null {
  const r = getOhaRate(locationLabel, grade);
  return r ? r.rentCeilingUSD + r.utilityAllowanceUSD : null;
}
