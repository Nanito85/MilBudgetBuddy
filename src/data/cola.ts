/**
 * CONUS COLA (Cost of Living Allowance) eligible installation IDs.
 *
 * CONUS COLA applies when the local cost of living exceeds 108% of the
 * national average. It has been progressively reduced since 2012 and now
 * applies primarily to Hawaii, parts of Alaska, and a handful of CA/DC areas.
 *
 * OCONUS COLA is separate and handled by finance/OHA calculation.
 *
 * Sources: DoD FMR Vol 7A Ch 68; militarypay.defense.gov/Pay/COLA
 */

export interface ColaInfo {
  installationId: string;
  state: string;
  monthlyEstimate: string;   // rough range for E5 w/dep (varies by grade)
  notes: string;
}

export const COLA_ELIGIBLE: ColaInfo[] = [
  // ── Hawaii ──────────────────────────────────────────────────────────────────
  {
    installationId: 'schofield',
    state: 'HI',
    monthlyEstimate: '$250–$450/mo',
    notes: 'Hawaii is the highest CONUS COLA area. Rate varies by pay grade and dependent status. Losing this on PCS to CONUS can be a significant pay cut.',
  },
  {
    installationId: 'jbphh',
    state: 'HI',
    monthlyEstimate: '$250–$450/mo',
    notes: 'Joint Base Pearl Harbor-Hickam receives full Hawaii CONUS COLA. Verify current rate at militarypay.defense.gov.',
  },
  {
    installationId: 'mcb_hawaii',
    state: 'HI',
    monthlyEstimate: '$250–$450/mo',
    notes: 'MCB Hawaii (Kaneohe Bay) receives Hawaii CONUS COLA. Windward Oahu is one of the highest-cost COLA areas.',
  },
  // ── Alaska ──────────────────────────────────────────────────────────────────
  {
    installationId: 'fort_wainwright',
    state: 'AK',
    monthlyEstimate: '$100–$200/mo',
    notes: 'Fairbanks area qualifies for Alaska CONUS COLA. Rate is lower than Hawaii but still meaningful for total pay comparisons.',
  },
  {
    installationId: 'fort_richardson',
    state: 'AK',
    monthlyEstimate: '$80–$160/mo',
    notes: 'JBER-Anchorage area receives Alaska CONUS COLA. Verify current rate at militarypay.defense.gov.',
  },
  // ── California ──────────────────────────────────────────────────────────────
  {
    installationId: 'presidio_monterey',
    state: 'CA',
    monthlyEstimate: '$50–$150/mo',
    notes: 'Monterey area may qualify for California CONUS COLA depending on grade. Verify at militarypay.defense.gov — CONUS COLA has been phased down in many CA areas.',
  },
];

const COLA_MAP = new Map<string, ColaInfo>(
  COLA_ELIGIBLE.map((c) => [c.installationId, c]),
);

export function getColaInfo(installationId: string): ColaInfo | null {
  return COLA_MAP.get(installationId) ?? null;
}

export function hasColaEligibility(installationId: string): boolean {
  return COLA_MAP.has(installationId);
}
