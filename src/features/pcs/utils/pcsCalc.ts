import { getBahRate, PayGrade } from '@/data/bah-rates';
import { Installation } from '@/data/installations';
import { lookupPerDiemByZip, OCONUS_LOCATIONS, STANDARD_TOTAL } from '@/data/per-diem-rates';

export interface StationPerDiem {
  total: number;      // lodging + M&IE, $/day
  oconus: boolean;
  matched: boolean;   // false when we couldn't find a specific locality and fell back to a placeholder
  label: string;
}

// Resolve a locality per-diem rate for an installation, for use in TLE/TLA math.
// CONUS: exact GSA lookup by MHA zip (always resolves — falls back to the GSA
// standard rate for unlisted counties). OCONUS: fuzzy-matched by name against
// OCONUS_LOCATIONS (name authoring overlaps well, e.g. installation "Camp
// Humphreys" ↔ OCONUS_LOCATIONS "Camp Humphreys"); many smaller OCONUS
// installations aren't in that dataset yet, so unmatched ones fall back to the
// CONUS standard rate as a rough placeholder — use the TLE/TLA calculator's
// full locality picker for an authoritative OCONUS number.
export function getStationPerDiem(inst: Installation): StationPerDiem {
  if (!inst.oconus) {
    const pd = lookupPerDiemByZip(inst.mhaZip);
    return { total: pd.total, oconus: false, matched: true, label: pd.isStandard ? 'Standard CONUS rate' : `${pd.city}, ${pd.state}` };
  }

  const nameWords = inst.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  let best: { loc: (typeof OCONUS_LOCATIONS)[number]; score: number } | null = null;
  for (const loc of OCONUS_LOCATIONS) {
    const hay = `${loc.name} ${loc.area}`.toLowerCase();
    const score = nameWords.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { loc, score };
  }

  if (best) {
    return { total: best.loc.total, oconus: true, matched: true, label: best.loc.name };
  }
  return { total: STANDARD_TOTAL, oconus: true, matched: false, label: 'Unmatched — placeholder rate' };
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
