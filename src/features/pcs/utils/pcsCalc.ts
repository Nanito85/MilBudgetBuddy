import { getBahRate, PayGrade } from '@/data/bah-rates';
import { Installation } from '@/data/installations';
import { lookupPerDiemByZip, OCONUS_LOCATIONS, STANDARD_LODGING, STANDARD_MEALS, STANDARD_TOTAL } from '@/data/per-diem-rates';
import { lookupNonForeignOconus } from '@/data/nonforeign-oconus-rates';

// A few Installation.state / OCONUS_LOCATIONS.country spellings don't share a substring
// (installations.ts uses common/geographic names; per-diem-rates.ts uses DSSR-style names).
const COUNTRY_ALIASES: Record<string, string> = {
  'united arab emirates': 'uae',
  'british indian ocean territory': 'diego garcia',
};

function countryMatches(instState: string, locCountry: string): boolean {
  const a = instState.toLowerCase();
  // Strip "(US)" / "(US base)" / etc. qualifiers before comparing.
  const b = locCountry.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (a.includes(b) || b.includes(a)) return true;
  const alias = COUNTRY_ALIASES[a];
  return !!alias && (a.includes(alias) || alias.includes(b) || b.includes(alias));
}

export interface StationPerDiem {
  total: number;      // lodging + M&IE, $/day
  lodging: number;    // max lodging rate, $/night
  meals: number;      // M&IE rate, $/day
  oconus: boolean;
  matched: boolean;   // false when we couldn't find a specific locality and fell back to a placeholder
  label: string;
}

// Resolve a locality per-diem rate for an installation, for use in TLE/TLA math.
// CONUS: exact GSA lookup by MHA zip (always resolves — falls back to the GSA
// standard rate for unlisted counties). OCONUS: matched by country first, then by
// name within that country (see countryMatches) — installations in a country with
// no OCONUS_LOCATIONS entries at all (e.g. Marshall Islands, Greenland) correctly
// fall back to the CONUS standard rate as a rough placeholder rather than being
// matched to an unrelated country — use the TLE/TLA calculator's full locality
// picker for an authoritative OCONUS number.
export function getStationPerDiem(inst: Installation): StationPerDiem {
  // Hawaii/Alaska: BAH-CONUS but travel-OCONUS — TLA on the DoD non-foreign per diem
  // schedule, not a GSA CONUS zip lookup. Must be checked before the `!inst.oconus`
  // branch below, since `oconus` itself is false for these installations.
  if (inst.nonForeignOconus) {
    const pd = lookupNonForeignOconus(inst.city, inst.state as 'HI' | 'AK');
    return { total: pd.total, lodging: pd.lodging, meals: pd.meals, oconus: true, matched: pd.matched, label: pd.label };
  }

  if (!inst.oconus) {
    const pd = lookupPerDiemByZip(inst.mhaZip);
    return { total: pd.total, lodging: pd.lodging, meals: pd.meals, oconus: false, matched: true, label: pd.isStandard ? 'Standard CONUS rate' : `${pd.city}, ${pd.state}` };
  }

  // Two-phase match: first narrow OCONUS_LOCATIONS to the installation's own country/territory
  // (via inst.state, which holds the country name for true-OCONUS installations), THEN pick the
  // best name match within that country only. Matching name-words against the full unfiltered
  // list first (the old approach) let generic words like "naval"/"base"/"camp" — shared by
  // installations in totally different countries — outscore a correct single-word country match,
  // e.g. "Naval Base Guam" matching "Naval Base Yokosuka" (Japan) over "Andersen AFB / NS Guam".
  const countryCandidates = OCONUS_LOCATIONS.filter((loc) => countryMatches(inst.state, loc.country));

  if (countryCandidates.length > 0) {
    const nameWords = inst.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
    let best: { loc: (typeof OCONUS_LOCATIONS)[number]; score: number } | null = null;
    for (const loc of countryCandidates) {
      const hay = `${loc.name} ${loc.area}`.toLowerCase();
      const score = nameWords.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
      if (!best || score > best.score) best = { loc, score };
    }
    // best is guaranteed non-null since countryCandidates is non-empty; a same-country match
    // (even a generic "[Other]"-style one) beats falling back to an unrelated CONUS placeholder.
    return { total: best!.loc.total, lodging: best!.loc.lodging, meals: best!.loc.meals, oconus: true, matched: true, label: best!.loc.name };
  }
  return { total: STANDARD_TOTAL, lodging: STANDARD_LODGING, meals: STANDARD_MEALS, oconus: true, matched: false, label: 'Unmatched — placeholder rate' };
}

export interface StationRates {
  bah: number | null;
  label: string;
}

export interface PCSResult {
  current: StationRates;
  gaining: StationRates;
  monthlyDiff: number | null;
  annualDiff: number | null;
  canCompare: boolean;
}

export function calcPCS(
  current: Installation | null,
  gaining: Installation | null,
  grade: PayGrade,
  withDependents: boolean,
): PCSResult {
  const getRate = (inst: Installation | null): StationRates => {
    if (!inst) return { bah: null, label: '' };
    if (inst.oconus) return { bah: null, label: 'OHA (contact finance)' };
    const bah = getBahRate(inst.mhaZip, grade, withDependents);
    return { bah, label: bah != null ? `$${bah.toLocaleString()}/mo` : 'Rate unavailable' };
  };

  const cur = getRate(current);
  const gain = getRate(gaining);
  const canCompare = cur.bah != null && gain.bah != null;
  const monthlyDiff = canCompare ? gain.bah! - cur.bah! : null;

  return {
    current: cur,
    gaining: gain,
    monthlyDiff,
    annualDiff: monthlyDiff != null ? monthlyDiff * 12 : null,
    canCompare,
  };
}

export function formatDiff(amount: number | null): string {
  if (amount == null) return '—';
  const sign = amount >= 0 ? '+' : '';
  return `${sign}$${Math.abs(amount).toLocaleString()}`;
}
