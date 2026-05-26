// FY2026 General Schedule (GS) Base Pay — effective January 2026
// Source: OPM 2025 base × 2.0% raise (FY2026 NDAA)
// Locality pay multipliers applied separately below.

// [grade][step] — annual salary in dollars, steps 1-10
export const GS_BASE_RATES: Record<number, number[]> = {
  1:  [22426, 23175, 23920, 24665, 25409, 25851, 26590, 27334, 27365, 28057],
  2:  [25223, 25824, 26677, 27365, 27696, 28540, 29383, 30227, 31070, 31914],
  3:  [27522, 28439, 29356, 30273, 31190, 32107, 33024, 33941, 34857, 35774],
  4:  [30891, 31921, 32951, 33981, 35012, 36042, 37072, 38102, 39132, 40163],
  5:  [34556, 35707, 36859, 38010, 39162, 40313, 41465, 42617, 43768, 44920],
  6:  [38509, 39793, 41077, 42362, 43646, 44930, 46214, 47498, 48782, 50067],
  7:  [42862, 44291, 45720, 47150, 48579, 50008, 51437, 52866, 54295, 55724],
  8:  [47630, 49218, 50806, 52394, 53982, 55571, 57159, 58747, 60335, 61923],
  9:  [52843, 54605, 56366, 58128, 59889, 61651, 63412, 65174, 66935, 68697],
  10: [58206, 60146, 62086, 64026, 65966, 67907, 69847, 71787, 73727, 75667],
  11: [64067, 66237, 68406, 70576, 72745, 74915, 77084, 79254, 81424, 83593],
  12: [76786, 79345, 81904, 84463, 87022, 89582, 92141, 94700, 97259, 99818],
  13: [91285, 94328, 97370, 100413, 103456, 106498, 109541, 112584, 115626, 118669],
  14: [107851, 111446, 115042, 118637, 122233, 125828, 129424, 133019, 136615, 140210],
  15: [126894, 131124, 135354, 139584, 143814, 148044, 152274, 156504, 160734, 164964],
};

// Locality pay areas — decimal multiplier added ON TOP of base pay
// (e.g. 0.3326 = 33.26% locality bump)
export interface GSLocality {
  key: string;
  label: string;
  rate: number;  // decimal
  notes?: string;
}

export const GS_LOCALITIES: GSLocality[] = [
  { key: 'RUS',  label: 'Rest of U.S.',                        rate: 0.1706 },
  { key: 'DC',   label: 'Washington DC / Baltimore',           rate: 0.3326, notes: 'Pentagon, DoD HQ, NSA, DIA' },
  { key: 'NY',   label: 'New York / Newark',                   rate: 0.3534 },
  { key: 'SF',   label: 'San Francisco / Oakland / San Jose',  rate: 0.4415 },
  { key: 'LA',   label: 'Los Angeles / Long Beach',            rate: 0.3494 },
  { key: 'SD',   label: 'San Diego / Chula Vista',             rate: 0.3545, notes: 'Navy, Marines' },
  { key: 'SEA',  label: 'Seattle / Tacoma',                    rate: 0.3185, notes: 'JBLM, Coast Guard' },
  { key: 'BOS',  label: 'Boston / Worcester / Providence',     rate: 0.3477 },
  { key: 'CHI',  label: 'Chicago / Naperville',                rate: 0.2927 },
  { key: 'HOU',  label: 'Houston / The Woodlands',             rate: 0.3501 },
  { key: 'DAL',  label: 'Dallas / Fort Worth',                 rate: 0.2693 },
  { key: 'DEN',  label: 'Denver / Aurora',                     rate: 0.2807, notes: 'Buckley SFB, Peterson SFB' },
  { key: 'COS',  label: 'Colorado Springs',                    rate: 0.2611, notes: 'Fort Carson, Peterson SFB, Schriever' },
  { key: 'ATL',  label: 'Atlanta / Athens',                    rate: 0.2345 },
  { key: 'PHI',  label: 'Philadelphia / Reading / Camden',     rate: 0.2981 },
  { key: 'PHX',  label: 'Phoenix / Mesa / Scottsdale',         rate: 0.2271, notes: 'Luke AFB, Davis-Monthan' },
  { key: 'HNL',  label: 'Honolulu',                            rate: 0.2184, notes: 'INDOPACOM, Pearl Harbor, Fort Shafter' },
  { key: 'NFK',  label: 'Virginia Beach / Norfolk',            rate: 0.1794, notes: 'NAS Norfolk, Fort Eustis, Langley' },
  { key: 'MIA',  label: 'Miami / Fort Lauderdale',             rate: 0.2428 },
  { key: 'POR',  label: 'Portland / Vancouver / Salem',        rate: 0.2671 },
  { key: 'SAC',  label: 'Sacramento / Roseville',              rate: 0.2828, notes: 'McClellan, Beale AFB' },
  { key: 'MIN',  label: 'Minneapolis / St. Paul',              rate: 0.2643 },
  { key: 'DET',  label: 'Detroit / Warren / Ann Arbor',        rate: 0.2642 },
  { key: 'STL',  label: 'St. Louis / St. Charles',             rate: 0.2138 },
  { key: 'RIC',  label: 'Richmond, VA',                        rate: 0.2260 },
  { key: 'AUS',  label: 'Austin / Round Rock, TX',             rate: 0.2695 },
  { key: 'CLV',  label: 'Cleveland / Akron / Canton, OH',      rate: 0.2156 },
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
