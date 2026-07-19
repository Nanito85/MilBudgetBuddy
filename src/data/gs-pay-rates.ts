// FY2026 General Schedule (GS) Base Pay — effective January 11, 2026 (first full
// pay period of 2026). Source: OPM Salary Table 2026-GS — 1.0% across-the-board
// base increase from 2025 (NOT 2.0%). Locality pay rates are FROZEN at 2025
// levels for 2026 (no locality update was issued) — see GS_LOCALITIES below.
// Verify at opm.gov/policy-data-oversight/pay-leave/salaries-wages/salary-tables/26tables/html/gs.

// [grade][step] — annual salary in dollars, steps 1-10
export const GS_BASE_RATES: Record<number, number[]> = {
  1:  [22584, 23341, 24092, 24840, 25589, 26028, 26771, 27519, 27550, 28248],
  2:  [25393, 25997, 26839, 27550, 27858, 28677, 29496, 30315, 31134, 31953],
  3:  [27708, 28632, 29556, 30480, 31404, 32328, 33252, 34176, 35100, 36024],
  4:  [31103, 32140, 33177, 34214, 35251, 36288, 37325, 38362, 39399, 40436],
  5:  [34799, 35959, 37119, 38279, 39439, 40599, 41759, 42919, 44079, 45239],
  6:  [38791, 40084, 41377, 42670, 43963, 45256, 46549, 47842, 49135, 50428],
  7:  [43106, 44543, 45980, 47417, 48854, 50291, 51728, 53165, 54602, 56039],
  8:  [47738, 49329, 50920, 52511, 54102, 55693, 57284, 58875, 60466, 62057],
  9:  [52727, 54485, 56243, 58001, 59759, 61517, 63275, 65033, 66791, 68549],
  10: [58064, 59999, 61934, 63869, 65804, 67739, 69674, 71609, 73544, 75479],
  11: [63795, 65922, 68049, 70176, 72303, 74430, 76557, 78684, 80811, 82938],
  12: [76463, 79012, 81561, 84110, 86659, 89208, 91757, 94306, 96855, 99404],
  13: [90925, 93956, 96987, 100018, 103049, 106080, 109111, 112142, 115173, 118204],
  14: [107446, 111028, 114610, 118192, 121774, 125356, 128938, 132520, 136102, 139684],
  15: [126384, 130597, 134810, 139023, 143236, 147449, 151662, 155875, 160088, 164301],
};

// Locality pay areas — decimal multiplier added ON TOP of base pay
// (e.g. 0.3394 = 33.94% locality bump). OPM issued no locality update for
// 2026 — these are the official 2026 rates, unchanged from 2025.
// Source: OPM 2026 locality pay area definitions and pay percentages.
export interface GSLocality {
  key: string;
  label: string;
  rate: number;  // decimal
  notes?: string;
}

export const GS_LOCALITIES: GSLocality[] = [
  { key: 'RUS',  label: 'Rest of U.S.',                        rate: 0.1706 },
  { key: 'DC',   label: 'Washington DC / Baltimore',           rate: 0.3394, notes: 'Pentagon, DoD HQ, NSA, DIA' },
  { key: 'NY',   label: 'New York / Newark',                   rate: 0.3795 },
  { key: 'SF',   label: 'San Francisco / Oakland / San Jose',  rate: 0.4634 },
  { key: 'LA',   label: 'Los Angeles / Long Beach',            rate: 0.3647 },
  { key: 'SD',   label: 'San Diego / Chula Vista',             rate: 0.3372, notes: 'Navy, Marines' },
  { key: 'SEA',  label: 'Seattle / Tacoma',                    rate: 0.3157, notes: 'JBLM, Coast Guard' },
  { key: 'BOS',  label: 'Boston / Worcester / Providence',     rate: 0.3258 },
  { key: 'CHI',  label: 'Chicago / Naperville',                rate: 0.3086 },
  { key: 'HOU',  label: 'Houston / The Woodlands',             rate: 0.3500 },
  { key: 'DAL',  label: 'Dallas / Fort Worth',                 rate: 0.2726 },
  { key: 'DEN',  label: 'Denver / Aurora',                     rate: 0.3052, notes: 'Buckley SFB, Peterson SFB' },
  { key: 'COS',  label: 'Colorado Springs',                    rate: 0.2015, notes: 'Fort Carson, Peterson SFB, Schriever' },
  { key: 'ATL',  label: 'Atlanta / Athens',                    rate: 0.2379 },
  { key: 'PHI',  label: 'Philadelphia / Reading / Camden',     rate: 0.2899 },
  { key: 'PHX',  label: 'Phoenix / Mesa / Scottsdale',         rate: 0.2245, notes: 'Luke AFB, Davis-Monthan' },
  { key: 'HNL',  label: 'Honolulu',                            rate: 0.2221, notes: 'INDOPACOM, Pearl Harbor, Fort Shafter' },
  { key: 'NFK',  label: 'Virginia Beach / Norfolk',            rate: 0.1880, notes: 'NAS Norfolk, Fort Eustis, Langley' },
  { key: 'MIA',  label: 'Miami / Fort Lauderdale',             rate: 0.2467 },
  { key: 'POR',  label: 'Portland / Vancouver / Salem',        rate: 0.2613 },
  { key: 'SAC',  label: 'Sacramento / Roseville',              rate: 0.2976, notes: 'McClellan, Beale AFB' },
  { key: 'MIN',  label: 'Minneapolis / St. Paul',              rate: 0.2762 },
  { key: 'DET',  label: 'Detroit / Warren / Ann Arbor',        rate: 0.2912 },
  { key: 'STL',  label: 'St. Louis / St. Charles',             rate: 0.2003 },
  { key: 'RIC',  label: 'Richmond, VA',                        rate: 0.2228 },
  { key: 'AUS',  label: 'Austin / Round Rock, TX',             rate: 0.2035 },
  { key: 'CLV',  label: 'Cleveland / Akron / Canton, OH',      rate: 0.2223 },
];

export function getGSPay(grade: number, step: number, localityKey: string): number {
  const steps = GS_BASE_RATES[grade];
  if (!steps) return 0;
  const idx = Math.max(0, Math.min(9, step - 1));
  const base = steps[idx];
  const locality = GS_LOCALITIES.find((l) => l.key === localityKey);
  const rate = locality?.rate ?? 0.1706;
  return Math.round(base * (1 + rate));
}

export function getGSMonthly(grade: number, step: number, localityKey: string): number {
  return Math.round(getGSPay(grade, step, localityKey) / 12);
}

// Approximate military equivalent for GS grades
export const GS_MILITARY_EQUIV: Record<number, string> = {
  1:  'E-1 to E-2',
  2:  'E-2 to E-3',
  3:  'E-3 to E-4',
  4:  'E-4 to E-5',
  5:  'E-5 / W-1 (entry)',
  6:  'E-6 / W-1',
  7:  'E-6 to E-7 / W-2',
  8:  'E-7 / W-2',
  9:  'E-7 to E-8 / W-3 / O-1',
  10: 'E-8 / W-3 / O-2',
  11: 'E-9 / W-4 / O-3',
  12: 'W-5 / O-4 to O-5',
  13: 'O-5 to O-6',
  14: 'O-6 (Colonel / Captain)',
  15: 'O-7 to O-8 (General / Admiral entry)',
};
