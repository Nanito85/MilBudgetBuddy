import { PayGrade } from '@/data/bah-rates';
import { MilitaryBranch } from '@/types/user.types';

// ── Rank Variants ──────────────────────────────────────────────────────────────
// Pay grades where two distinct titles/insignia exist at the same grade.

export type RankVariant =
  | 'default'
  | 'army_e4_cpl'        // Corporal (vs Specialist)
  | 'army_e8_1sg'        // First Sergeant (vs Master Sergeant)
  | 'army_e9_csm'        // Command Sergeant Major (vs Sergeant Major)
  | 'army_e9_sma'        // Sergeant Major of the Army
  | 'marines_e8_1stsgt'  // First Sergeant (vs Master Sergeant)
  | 'marines_e9_sgtmaj'; // Sergeant Major (vs Master Gunnery Sergeant)

export interface RankVariantOption {
  variant: RankVariant;
  abbrev: string;
  fullName: string;
}

export const DUAL_RANKS: Partial<Record<string, RankVariantOption[]>> = {
  'army-E4': [
    { variant: 'default',       abbrev: 'SPC', fullName: 'Specialist' },
    { variant: 'army_e4_cpl',   abbrev: 'CPL', fullName: 'Corporal' },
  ],
  'army-E8': [
    { variant: 'default',      abbrev: 'MSG', fullName: 'Master Sergeant' },
    { variant: 'army_e8_1sg',  abbrev: '1SG', fullName: 'First Sergeant' },
  ],
  'army-E9': [
    { variant: 'default',      abbrev: 'SGM', fullName: 'Sergeant Major' },
    { variant: 'army_e9_csm',  abbrev: 'CSM', fullName: 'Command Sergeant Major' },
    { variant: 'army_e9_sma',  abbrev: 'SMA', fullName: 'Sergeant Major of the Army' },
  ],
  'marines-E8': [
    { variant: 'default',            abbrev: 'MSgt',   fullName: 'Master Sergeant' },
    { variant: 'marines_e8_1stsgt',  abbrev: '1stSgt', fullName: 'First Sergeant' },
  ],
  'marines-E9': [
    { variant: 'default',           abbrev: 'MGySgt', fullName: 'Master Gunnery Sergeant' },
    { variant: 'marines_e9_sgtmaj', abbrev: 'SgtMaj', fullName: 'Sergeant Major' },
  ],
};

export function getDualVariants(
  branch: MilitaryBranch,
  grade: PayGrade,
): RankVariantOption[] | null {
  return DUAL_RANKS[`${branch}-${grade}`] ?? null;
}

export function getVariantAbbrev(
  branch: MilitaryBranch,
  grade: PayGrade,
  variant: RankVariant,
): string | null {
  const opts = getDualVariants(branch, grade);
  if (!opts) return null;
  return opts.find((o) => o.variant === variant)?.abbrev ?? opts[0].abbrev;
}

// ── Insignia Visual Rows ──────────────────────────────────────────────────────
// Each string in the array is one centered row of the insignia badge.
//
// Symbols used:
//   ^   chevron stripe pointing up  (Army / Marines / AF / SF)
//   ∨   chevron stripe pointing down (Navy / CG petty officers)
//   ⌣   rocker arc below chevrons   (curved up like a rainbow)
//   ◆   diamond                     (First Sergeant)
//   ★   star                        (Sergeant Major / general/flag officer)
//   ⊛   star-in-circle              (Command Sergeant Major wreath)
//   ✦   four-point star device       (SMA / special)
//   ✚   crossed rifles/device        (Marine Corps)
//   ⚓   anchor                       (Navy/CG chief)
//   |   officer bar                  (O1-O3 junior officers)
//   ◻   warrant bar/square           (Warrant Officers W1-W5)

export type InsigniaRows = string[];

// ── Army ──────────────────────────────────────────────────────────────────────
function armyRows(grade: PayGrade, variant: RankVariant): InsigniaRows {
  switch (grade) {
    case 'E1': return [];
    case 'E2': return ['^'];
    case 'E3': return ['^', '⌣'];
    case 'E4': return variant === 'army_e4_cpl' ? ['^^'] : ['⊙'];
    case 'E5': return ['^^^'];
    case 'E6': return ['^^^', '⌣'];
    case 'E7': return ['^^^', '⌣⌣'];
    case 'E8': return variant === 'army_e8_1sg'
      ? ['^^^', '⌣⌣⌣', '◆']
      : ['^^^', '⌣⌣⌣'];
    case 'E9':
      if (variant === 'army_e9_csm')  return ['^^^', '⌣⌣⌣', '⊛'];
      if (variant === 'army_e9_sma')  return ['^^^', '⌣⌣⌣', '✦'];
      return ['^^^', '⌣⌣⌣', '★'];
    case 'W1': return ['◻'];
    case 'W2': return ['◻◻'];
    case 'W3': return ['◻◻◻'];
    case 'W4': return ['◻◻◻◻'];
    case 'W5': return ['◻◻◻◻◻'];
    case 'O1': return ['|'];
    case 'O2': return ['|'];
    case 'O3': return ['| |'];
    case 'O4': return ['❧'];
    case 'O5': return ['❧'];
    case 'O6': return ['✵'];
    case 'O7': return ['★'];
    case 'O8': return ['★★'];
    case 'O9': return ['★★★'];
    case 'O10': return ['★★★★'];
    default: return [];
  }
}

// ── Marines ───────────────────────────────────────────────────────────────────
function marinesRows(grade: PayGrade, variant: RankVariant): InsigniaRows {
  switch (grade) {
    case 'E1': return [];
    case 'E2': return ['^'];
    case 'E3': return ['^', '✚'];
    case 'E4': return ['^^', '✚'];
    case 'E5': return ['^^^', '✚'];
    case 'E6': return ['^^^', '⌣⌣'];
    case 'E7': return ['^^^', '⌣⌣', '✚'];
    case 'E8': return variant === 'marines_e8_1stsgt'
      ? ['^^^', '⌣⌣⌣⌣', '◆']
      : ['^^^', '⌣⌣⌣⌣'];
    case 'E9': return variant === 'marines_e9_sgtmaj'
      ? ['^^^', '⌣⌣⌣⌣', '★', '✚']
      : ['^^^', '⌣⌣⌣⌣', '✦'];
    case 'W1': return ['◻'];
    case 'W2': return ['◻◻'];
    case 'W3': return ['◻◻◻'];
    case 'W4': return ['◻◻◻◻'];
    case 'W5': return ['◻◻◻◻◻'];
    case 'O1': return ['|'];
    case 'O2': return ['|'];
    case 'O3': return ['| |'];
    case 'O4': return ['❧'];
    case 'O5': return ['❧'];
    case 'O6': return ['✵'];
    case 'O7': return ['★'];
    case 'O8': return ['★★'];
    case 'O9': return ['★★★'];
    case 'O10': return ['★★★★'];
    default: return [];
  }
}

// ── Air Force / Space Force ───────────────────────────────────────────────────
// E1–E4: chevron stripes (0–3); E5–E7: NCO "rocker" stripes; E8/E9: + emblem
function airForceRows(grade: PayGrade): InsigniaRows {
  switch (grade) {
    case 'E1': return [];
    case 'E2': return ['^'];
    case 'E3': return ['^^'];
    case 'E4': return ['^^^'];
    case 'E5': return ['—'];
    case 'E6': return ['——'];
    case 'E7': return ['———'];
    case 'E8': return ['———', '◆'];
    case 'E9': return ['———', '★'];
    case 'O1': return ['|'];
    case 'O2': return ['|'];
    case 'O3': return ['| |'];
    case 'O4': return ['❧'];
    case 'O5': return ['❧'];
    case 'O6': return ['✵'];
    case 'O7': return ['★'];
    case 'O8': return ['★★'];
    case 'O9': return ['★★★'];
    case 'O10': return ['★★★★'];
    default: return [];
  }
}

// ── Navy / Coast Guard ────────────────────────────────────────────────────────
// Chevrons point DOWN (∨) for petty officers; chiefs use anchor device.
function navyRows(grade: PayGrade): InsigniaRows {
  switch (grade) {
    case 'E1': return [];
    case 'E2': return ['∨∨'];
    case 'E3': return ['∨∨∨'];
    case 'E4': return ['⚓', '∨'];
    case 'E5': return ['⚓', '∨∨'];
    case 'E6': return ['⚓', '∨∨∨'];
    case 'E7': return ['⚓', '⌣'];
    case 'E8': return ['⚓', '⌣', '★'];
    case 'E9': return ['⚓', '⌣', '★★'];
    case 'W1': return ['◻'];
    case 'W2': return ['◻◻'];
    case 'W3': return ['◻◻◻'];
    case 'W4': return ['◻◻◻◻'];
    case 'W5': return ['◻◻◻◻◻'];
    case 'O1': return ['|'];
    case 'O2': return ['|'];
    case 'O3': return ['| |'];
    case 'O4': return ['❧'];
    case 'O5': return ['❧'];
    case 'O6': return ['✵'];
    case 'O7': return ['★'];
    case 'O8': return ['★★'];
    case 'O9': return ['★★★'];
    case 'O10': return ['★★★★'];
    default: return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export function getInsigniaRows(
  branch: MilitaryBranch,
  grade: PayGrade,
  variant: RankVariant = 'default',
): InsigniaRows {
  switch (branch) {
    case 'army':        return armyRows(grade, variant);
    case 'marines':     return marinesRows(grade, variant);
    case 'air_force':   return airForceRows(grade);
    case 'space_force': return airForceRows(grade);
    case 'navy':        return navyRows(grade);
    case 'coast_guard': return navyRows(grade);
    default:            return [];
  }
}
