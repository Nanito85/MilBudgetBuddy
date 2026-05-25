import { PayGrade } from '@/data/bah-rates';
import { MilitaryBranch } from '@/types/user.types';

// ── Rank Variants ──────────────────────────────────────────────────────────────
// Pay grades where two distinct titles/insignia exist at the same grade.

export type RankVariant =
  | 'default'
  // Army
  | 'army_e4_cpl'        // Corporal (vs Specialist)
  | 'army_e8_1sg'        // First Sergeant (vs Master Sergeant)
  | 'army_e9_csm'        // Command Sergeant Major (vs Sergeant Major)
  | 'army_e9_sma'        // Sergeant Major of the Army
  // Marines
  | 'marines_e8_1stsgt'  // First Sergeant (vs Master Sergeant)
  | 'marines_e9_sgtmaj'  // Sergeant Major (vs Master Gunnery Sergeant)
  // Air Force
  | 'af_e9_cmsaf'        // Chief Master Sergeant of the Air Force
  // Space Force
  | 'sf_e9_seac'         // Senior Enlisted Advisor of the Space Force
  // Navy
  | 'navy_e9_mcpon'      // Master Chief Petty Officer of the Navy
  // Coast Guard
  | 'cg_e9_mcpocg';      // Master Chief Petty Officer of the Coast Guard

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
  'air_force-E9': [
    { variant: 'default',    abbrev: 'CMSgt', fullName: 'Chief Master Sergeant' },
    { variant: 'af_e9_cmsaf', abbrev: 'CMSAF', fullName: 'Chief Master Sergeant of the Air Force' },
  ],
  'space_force-E9': [
    { variant: 'default',   abbrev: 'CMSgt', fullName: 'Chief Master Sergeant' },
    { variant: 'sf_e9_seac', abbrev: 'SEAC',  fullName: 'Senior Enlisted Advisor of the Space Force' },
  ],
  'navy-E9': [
    { variant: 'default',      abbrev: 'MCPO',  fullName: 'Master Chief Petty Officer' },
    { variant: 'navy_e9_mcpon', abbrev: 'MCPON', fullName: 'Master Chief Petty Officer of the Navy' },
  ],
  'coast_guard-E9': [
    { variant: 'default',       abbrev: 'MCPO',   fullName: 'Master Chief Petty Officer' },
    { variant: 'cg_e9_mcpocg',  abbrev: 'MCPOCG', fullName: 'Master Chief Petty Officer of the Coast Guard' },
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

// Shared officer rows — identical across all branches at the grade level
// O1/O2: 1 bar; O3: 2 bars; O4/O5: oak leaf; O6: eagle; O7-O10: stars
function officerRows(grade: PayGrade): InsigniaRows {
  switch (grade) {
    case 'O1':  return ['▬'];         // Gold bar (2LT / ENS / 2d Lt)
    case 'O2':  return ['▬', '▬'];    // Silver bar (1LT / LTJG / 1st Lt)
    case 'O3':  return ['▬▬'];        // Two bars (CPT / LT / Capt)
    case 'O4':  return ['❋'];         // Oak leaf — Major / LCDR
    case 'O5':  return ['❋', '❋'];    // Oak leaf — LTC / CDR
    case 'O6':  return ['⚔'];         // Eagle — COL / CAPT
    case 'O7':  return ['★'];
    case 'O8':  return ['★', '★'];
    case 'O9':  return ['★', '★', '★'];
    case 'O10': return ['★', '★', '★', '★'];
    default:    return [];
  }
}

// Warrant officer rows — same across all branches
function warrantRows(grade: PayGrade): InsigniaRows {
  switch (grade) {
    case 'W1': return ['◻'];
    case 'W2': return ['◻', '◻'];
    case 'W3': return ['◻', '◻', '◻'];
    case 'W4': return ['◻', '◻', '◻', '◻'];
    case 'W5': return ['◻', '◻', '◻', '◻', '◻'];
    default:   return [];
  }
}

// ── Army ──────────────────────────────────────────────────────────────────────
// Chevrons (∧) stack upward; rockers (⌣) appear below; devices on top row
function armyRows(grade: PayGrade, variant: RankVariant): InsigniaRows {
  switch (grade) {
    case 'E1': return [];                                          // PVT — no insignia
    case 'E2': return ['∧'];                                       // PV2 — 1 chevron
    case 'E3': return ['∧', '⌣'];                                  // PFC — 1 chevron + 1 rocker
    case 'E4': return variant === 'army_e4_cpl'
      ? ['∧', '∧']                                                 // CPL — 2 chevrons
      : ['◉'];                                                     // SPC — eagle device
    case 'E5': return ['∧', '∧', '∧'];                            // SGT — 3 chevrons
    case 'E6': return ['∧', '∧', '∧', '⌣'];                       // SSG — 3 + 1 rocker
    case 'E7': return ['∧', '∧', '∧', '⌣', '⌣'];                  // SFC — 3 + 2 rockers
    case 'E8': return variant === 'army_e8_1sg'
      ? ['◆', '∧', '∧', '∧', '⌣', '⌣', '⌣']                      // 1SG — diamond + 3 + 3 rockers
      : ['∧', '∧', '∧', '⌣', '⌣', '⌣'];                          // MSG — 3 + 3 rockers
    case 'E9':
      if (variant === 'army_e9_csm') return ['⊛', '∧', '∧', '∧', '⌣', '⌣', '⌣']; // CSM — wreath star
      if (variant === 'army_e9_sma') return ['✦', '∧', '∧', '∧', '⌣', '⌣', '⌣']; // SMA — special device
      return ['★', '∧', '∧', '∧', '⌣', '⌣', '⌣'];                // SGM — star
    default: return grade.startsWith('W') ? warrantRows(grade) : officerRows(grade);
  }
}

// ── Marines ───────────────────────────────────────────────────────────────────
// Eagle, Globe & Anchor (✚) device distinguishes USMC enlisted; rockers below
function marinesRows(grade: PayGrade, variant: RankVariant): InsigniaRows {
  switch (grade) {
    case 'E1': return [];                                          // Pvt — no insignia
    case 'E2': return ['∧'];                                       // PFC — 1 chevron
    case 'E3': return ['∧', '✚'];                                  // LCpl — 1 chevron + EGA
    case 'E4': return ['∧', '∧', '✚'];                            // Cpl — 2 chevrons + EGA
    case 'E5': return ['∧', '∧', '∧', '✚'];                       // Sgt — 3 chevrons + EGA
    case 'E6': return ['∧', '∧', '∧', '⌣', '⌣'];                  // SSgt — 3 + 2 rockers
    case 'E7': return ['✚', '∧', '∧', '∧', '⌣', '⌣'];            // GySgt — EGA + 3 + 2 rockers
    case 'E8': return variant === 'marines_e8_1stsgt'
      ? ['◆', '∧', '∧', '∧', '⌣', '⌣', '⌣']                      // 1stSgt — diamond device
      : ['✚', '∧', '∧', '∧', '⌣', '⌣', '⌣'];                     // MSgt — EGA device
    case 'E9': return variant === 'marines_e9_sgtmaj'
      ? ['★', '∧', '∧', '∧', '⌣', '⌣', '⌣', '✚']                 // SgtMaj — star + EGA
      : ['✦', '∧', '∧', '∧', '⌣', '⌣', '⌣', '✚'];               // MGySgt — burst device + EGA
    default: return grade.startsWith('W') ? warrantRows(grade) : officerRows(grade);
  }
}

// ── Air Force / Space Force ───────────────────────────────────────────────────
// E1–E4: 0–3 chevrons; E5–E9: NCO/SNCO stripes (—) + device for E8/E9
function airForceRows(grade: PayGrade, variant: RankVariant = 'default'): InsigniaRows {
  switch (grade) {
    case 'E1': return [];                  // Amn Basic — no insignia
    case 'E2': return ['∧'];              // Amn
    case 'E3': return ['∧', '∧'];         // A1C
    case 'E4': return ['∧', '∧', '∧'];   // SrA
    case 'E5': return ['—'];              // SSgt — 1 rocker stripe
    case 'E6': return ['—', '—'];         // TSgt — 2 rocker stripes
    case 'E7': return ['—', '—', '—'];    // MSgt — 3 rocker stripes
    case 'E8': return ['◆', '—', '—', '—']; // SMSgt — diamond + 3 stripes
    case 'E9': return (variant === 'af_e9_cmsaf' || variant === 'sf_e9_seac')
      ? ['✦', '★', '—', '—', '—']  // CMSAF/SEAC — special device + star + 3 stripes
      : ['★', '—', '—', '—'];       // CMSgt — star + 3 stripes
    default:   return officerRows(grade);
  }
}

// ── Navy / Coast Guard ────────────────────────────────────────────────────────
// E1–E3: rating badge chevrons (∨ pointing down); E4–E6: anchor + chevrons;
// E7–E9 (chiefs): anchor + arcs; officers same as all branches
function navyRows(grade: PayGrade, variant: RankVariant = 'default'): InsigniaRows {
  switch (grade) {
    case 'E1': return [];                      // SR/Rec — no insignia
    case 'E2': return ['∨'];                   // SA — 1 chevron down
    case 'E3': return ['∨', '∨'];              // SN — 2 chevrons down
    case 'E4': return ['⚓', '∨'];             // PO3 — anchor + 1 chevron
    case 'E5': return ['⚓', '∨', '∨'];        // PO2 — anchor + 2 chevrons
    case 'E6': return ['⚓', '∨', '∨', '∨'];   // PO1 — anchor + 3 chevrons
    case 'E7': return ['⚓', '⌣'];             // CPO — anchor + 1 arc
    case 'E8': return ['★', '⚓', '⌣'];        // SCPO — star + anchor + arc
    case 'E9': return (variant === 'navy_e9_mcpon' || variant === 'cg_e9_mcpocg')
      ? ['✦', '★', '★', '⚓', '⌣']  // MCPON/MCPOCG — special device + 2 stars
      : ['★', '★', '⚓', '⌣'];       // MCPO — 2 stars + anchor + arc
    default:   return grade.startsWith('W') ? warrantRows(grade) : officerRows(grade);
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
    case 'air_force':   return airForceRows(grade, variant);
    case 'space_force': return airForceRows(grade, variant);
    case 'navy':        return navyRows(grade, variant);
    case 'coast_guard': return navyRows(grade, variant);
    default:            return [];
  }
}
