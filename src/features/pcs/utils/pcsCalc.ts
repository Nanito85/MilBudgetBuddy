import { getBahRate, PayGrade } from '@/data/bah-rates';
import { Installation } from '@/data/installations';

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
