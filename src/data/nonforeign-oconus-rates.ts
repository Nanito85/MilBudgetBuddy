/**
 * Non-foreign OCONUS per diem rates — Hawaii and Alaska.
 *
 * These are a DISTINCT DoD/PDTATAC rate schedule from both:
 *   - GSA CONUS per diem (src/data/gsa-per-diem.ts) — does not cover HI/AK at all.
 *   - State Dept Foreign Per Diem (src/data/per-diem-rates.ts OCONUS_LOCATIONS) — foreign
 *     countries only; Hawaii and Alaska are U.S. states, not foreign, so they never appear there.
 *
 * Hawaii and Alaska installations draw standard BAH (not OHA) per the 2018 JTR reform — see
 * the `oconus` field comment on Installation in installations.ts — but they are still OCONUS
 * for PCS-travel purposes: a move there uses TLA (JTR Ch. 5 Part H: 60 days, no flat-dollar
 * cap), never TLE (CONUS-only: 21 days, $290/day combined cap). Before this file existed, HI/AK
 * installations fell through to the generic $178/day GSA "standard rate" placeholder under TLE
 * rules — both the wrong entitlement type and roughly half the real rate.
 *
 * Sourced 2026-08-13 from DTMO-derived third-party aggregators (perdiem101.com, tdylodging.com,
 * engine.com) cross-checked against each other, since travel.dod.mil blocks direct fetches (see
 * the BAH sourcing note in project memory for the same issue / Wayback workaround). Hawaii rates
 * are flat year-round. Alaska rates are seasonal; per this app's existing "flat max-of-year"
 * convention (same as GSA CONUS and the State Dept OCONUS table), the PEAK-season total is used,
 * with M&IE held at its published (non-seasonal) figure and lodging backed out as
 * peak_total − M&IE. Verify at travel.dod.mil / your installation's finance office before relying
 * on these for an actual claim — DTMO updates OCONUS per diem monthly.
 */

export interface NonForeignOconusArea {
  id: string;
  name: string;
  state: 'HI' | 'AK';
  lodging: number; // max lodging $/night (peak season for AK)
  meals: number;   // M&IE $/day
  total: number;   // lodging + meals
}

export const NON_FOREIGN_OCONUS_AREAS: NonForeignOconusArea[] = [
  // Hawaii — flat year-round rate, all of Oahu (every HI installation in this app is on Oahu).
  { id: 'nf_oahu', name: 'Oahu (Honolulu)', state: 'HI', lodging: 202, meals: 163, total: 365 },

  // Alaska — peak-season totals; M&IE held flat, lodging backed out (see file header).
  { id: 'nf_anchorage', name: 'Anchorage', state: 'AK', lodging: 279, meals: 145, total: 424 },
  { id: 'nf_fairbanks', name: 'Fairbanks', state: 'AK', lodging: 254, meals: 108, total: 362 },
  { id: 'nf_kodiak', name: 'Kodiak', state: 'AK', lodging: 231, meals: 109, total: 340 },
  { id: 'nf_juneau', name: 'Juneau', state: 'AK', lodging: 274, meals: 118, total: 392 },
  { id: 'nf_sitka', name: 'Sitka', state: 'AK', lodging: 274, meals: 116, total: 390 },
];

// Maps each HI/AK installation city (as spelled in installations.ts) to its non-foreign
// OCONUS area. All Oahu cities collapse to the single Oahu rate.
const CITY_TO_AREA: Record<string, string> = {
  'Wahiawa': 'nf_oahu',
  'Honolulu': 'nf_oahu',
  'Kailua': 'nf_oahu',
  'Kapolei': 'nf_oahu',
  'Halawa': 'nf_oahu',
  'Anchorage': 'nf_anchorage',
  'Fairbanks': 'nf_fairbanks',
  'North Pole': 'nf_fairbanks', // Eielson AFB
  'Kodiak': 'nf_kodiak',
  'Juneau': 'nf_juneau',
  'Sitka': 'nf_sitka',
};

export interface NonForeignOconusResult {
  lodging: number;
  meals: number;
  total: number;
  matched: boolean;
  label: string;
}

export function lookupNonForeignOconus(city: string, state: 'HI' | 'AK'): NonForeignOconusResult {
  const areaId = CITY_TO_AREA[city];
  const area = areaId ? NON_FOREIGN_OCONUS_AREAS.find((a) => a.id === areaId) : undefined;
  if (area) {
    return { lodging: area.lodging, meals: area.meals, total: area.total, matched: true, label: area.name };
  }
  // Fallback: statewide average if a city isn't in the map yet.
  const fallback = state === 'HI'
    ? { lodging: 241, meals: 151, total: 392 }
    : { lodging: 222, meals: 114, total: 336 };
  return { ...fallback, matched: false, label: `${state} — statewide estimate` };
}
