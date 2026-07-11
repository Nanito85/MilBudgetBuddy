/**
 * ZIP code (first 3 digits) → state, based on USPS sectional-center-facility
 * allocation blocks. This is structural postal geography, not BAH rate data —
 * used only to figure out roughly where a ZIP is so we can point a user at
 * the nearest *real* BAH rate we have on file, not to look up a rate directly.
 */

interface ZipRange {
  start: number; // inclusive 3-digit prefix
  end: number;   // inclusive 3-digit prefix
  state: string;
}

const RANGES: ZipRange[] = [
  { start: 6,   end: 9,   state: 'PR' },
  { start: 10,  end: 27,  state: 'MA' },
  { start: 28,  end: 29,  state: 'RI' },
  { start: 30,  end: 38,  state: 'NH' },
  { start: 39,  end: 49,  state: 'ME' },
  { start: 50,  end: 59,  state: 'VT' },
  { start: 60,  end: 69,  state: 'CT' },
  { start: 70,  end: 89,  state: 'NJ' },
  { start: 100, end: 149, state: 'NY' },
  { start: 150, end: 196, state: 'PA' },
  { start: 197, end: 199, state: 'DE' },
  { start: 200, end: 205, state: 'DC' },
  { start: 206, end: 219, state: 'MD' },
  { start: 220, end: 246, state: 'VA' },
  { start: 247, end: 268, state: 'WV' },
  { start: 270, end: 289, state: 'NC' },
  { start: 290, end: 299, state: 'SC' },
  { start: 300, end: 319, state: 'GA' },
  { start: 320, end: 349, state: 'FL' },
  { start: 350, end: 369, state: 'AL' },
  { start: 370, end: 385, state: 'TN' },
  { start: 386, end: 397, state: 'MS' },
  { start: 398, end: 399, state: 'GA' },
  { start: 400, end: 427, state: 'KY' },
  { start: 430, end: 458, state: 'OH' },
  { start: 460, end: 479, state: 'IN' },
  { start: 480, end: 499, state: 'MI' },
  { start: 500, end: 528, state: 'IA' },
  { start: 530, end: 549, state: 'WI' },
  { start: 550, end: 567, state: 'MN' },
  { start: 570, end: 577, state: 'SD' },
  { start: 580, end: 588, state: 'ND' },
  { start: 590, end: 599, state: 'MT' },
  { start: 600, end: 629, state: 'IL' },
  { start: 630, end: 658, state: 'MO' },
  { start: 660, end: 679, state: 'KS' },
  { start: 680, end: 693, state: 'NE' },
  { start: 700, end: 714, state: 'LA' },
  { start: 716, end: 729, state: 'AR' },
  { start: 730, end: 749, state: 'OK' },
  { start: 750, end: 799, state: 'TX' },
  { start: 885, end: 885, state: 'TX' },
  { start: 800, end: 816, state: 'CO' },
  { start: 820, end: 831, state: 'WY' },
  { start: 832, end: 838, state: 'ID' },
  { start: 840, end: 847, state: 'UT' },
  { start: 850, end: 865, state: 'AZ' },
  { start: 870, end: 884, state: 'NM' },
  { start: 889, end: 898, state: 'NV' },
  { start: 900, end: 961, state: 'CA' },
  { start: 967, end: 968, state: 'HI' },
  { start: 970, end: 979, state: 'OR' },
  { start: 980, end: 994, state: 'WA' },
  { start: 995, end: 999, state: 'AK' },
];

/** Best-effort state lookup from a 5-digit ZIP code, based on USPS ZIP prefix blocks. */
export function zipToState(zip: string): string | null {
  const digits = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(digits)) return null;
  const prefix = parseInt(digits.slice(0, 3), 10);
  const match = RANGES.find((r) => prefix >= r.start && prefix <= r.end);
  return match?.state ?? null;
}
