/**
 * US state income tax effective rates for active duty military.
 * Rates are approximate effective rates on typical military base pay ($35k–$90k range).
 * Many states fully exempt active duty military pay — see `militaryExempt`.
 * Always verify with your state's tax authority or a tax professional.
 */

export interface StateTaxInfo {
  code: string;
  name: string;
  effectiveRate: number; // decimal, e.g. 0.05 = 5%
  militaryExempt: boolean;
  // Active-duty pay is exempt only while the member is stationed OUTSIDE
  // this state (a domiciliary with no home in the state, or one the state
  // treats as a nonresident while stationed elsewhere). Taxed at
  // effectiveRate when the duty station is in the state.
  exemptWhenStationedOutside?: boolean;
  // Effective rate on ordinary wages and pensions where it differs from
  // effectiveRate — i.e. states that exempt active-duty pay (effectiveRate 0)
  // but still tax civilian (GS) wages and, unless fully exempt, retired pay.
  // Without it a GS employee in e.g. Illinois or Michigan was shown $0 state
  // tax. Single filer at $60k wages, 2026 brackets/deductions (Tax Foundation,
  // "State Individual Income Tax Rates and Brackets, 2026").
  civilianRate?: number;
  note?: string;
}

export const US_STATES: StateTaxInfo[] = [
  { code: 'AK', name: 'Alaska',         effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
  { code: 'AL', name: 'Alabama',        effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.046 },
  { code: 'AR', name: 'Arkansas',       effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0355 },
  { code: 'AZ', name: 'Arizona',        effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0215 },
  { code: 'CA', name: 'California',     effectiveRate: 0.062,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside CA (FTB Pub 1032)' },
  { code: 'CO', name: 'Colorado',       effectiveRate: 0.044,  militaryExempt: false },
  { code: 'CT', name: 'Connecticut',    effectiveRate: 0.050,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside CT with no CT home and 30 days or less in CT' },
  { code: 'DC', name: 'Washington D.C.',effectiveRate: 0.075,  militaryExempt: false },
  { code: 'DE', name: 'Delaware',       effectiveRate: 0.042,  militaryExempt: false },
  { code: 'FL', name: 'Florida',        effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
  { code: 'GA', name: 'Georgia',        effectiveRate: 0.0549, militaryExempt: false },
  { code: 'HI', name: 'Hawaii',         effectiveRate: 0.075,  militaryExempt: false },
  { code: 'IA', name: 'Iowa',           effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0271 },
  { code: 'ID', name: 'Idaho',          effectiveRate: 0.058,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside ID' },
  { code: 'IL', name: 'Illinois',       effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0471 },
  { code: 'IN', name: 'Indiana',        effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.029 },
  { code: 'KS', name: 'Kansas',         effectiveRate: 0.055,  militaryExempt: false },
  { code: 'KY', name: 'Kentucky',       effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.033 },
  { code: 'LA', name: 'Louisiana',      effectiveRate: 0.035,  militaryExempt: false },
  { code: 'MA', name: 'Massachusetts',  effectiveRate: 0.050,  militaryExempt: false },
  { code: 'MD', name: 'Maryland',       effectiveRate: 0.058,  militaryExempt: false },
  { code: 'ME', name: 'Maine',          effectiveRate: 0.065,  militaryExempt: false },
  { code: 'MI', name: 'Michigan',       effectiveRate: 0,      militaryExempt: true,  note: 'Military pay exempt', civilianRate: 0.0383 },
  { code: 'MN', name: 'Minnesota',      effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0426 },
  { code: 'MO', name: 'Missouri',       effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0314 },
  { code: 'MS', name: 'Mississippi',    effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0278 },
  { code: 'MT', name: 'Montana',        effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0344 },
  { code: 'NC', name: 'North Carolina', effectiveRate: 0.0475, militaryExempt: false },
  { code: 'ND', name: 'North Dakota',   effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0 },
  { code: 'NE', name: 'Nebraska',       effectiveRate: 0.052,  militaryExempt: false },
  { code: 'NH', name: 'New Hampshire',  effectiveRate: 0,      militaryExempt: true,  note: 'No wage income tax' },
  { code: 'NJ', name: 'New Jersey',     effectiveRate: 0.058,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside NJ with no NJ home and 30 days or less in NJ' },
  { code: 'NM', name: 'New Mexico',     effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0276 },
  { code: 'NV', name: 'Nevada',         effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
  { code: 'NY', name: 'New York',       effectiveRate: 0.063,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside NY with no NY home and 30 days or less in NY' },
  { code: 'OH', name: 'Ohio',           effectiveRate: 0.0145, militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside OH' },
  { code: 'OK', name: 'Oklahoma',       effectiveRate: 0,      militaryExempt: true,  note: 'Active duty pay exempt', civilianRate: 0.0359 },
  { code: 'OR', name: 'Oregon',         effectiveRate: 0.083,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside OR; up to $6,000 subtractable in-state' },
  { code: 'PA', name: 'Pennsylvania',   effectiveRate: 0.0307, militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside PA' },
  { code: 'RI', name: 'Rhode Island',   effectiveRate: 0.054,  militaryExempt: false },
  { code: 'SC', name: 'South Carolina', effectiveRate: 0.062,  militaryExempt: false },
  { code: 'SD', name: 'South Dakota',   effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
  { code: 'TN', name: 'Tennessee',      effectiveRate: 0,      militaryExempt: true,  note: 'No wage income tax' },
  { code: 'TX', name: 'Texas',          effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
  { code: 'UT', name: 'Utah',           effectiveRate: 0.0465, militaryExempt: false },
  { code: 'VA', name: 'Virginia',       effectiveRate: 0.0575, militaryExempt: false },
  { code: 'VT', name: 'Vermont',        effectiveRate: 0.066,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside VT' },
  { code: 'WA', name: 'Washington',     effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
  { code: 'WI', name: 'Wisconsin',      effectiveRate: 0.065,  militaryExempt: false },
  { code: 'WV', name: 'West Virginia',  effectiveRate: 0.060,  militaryExempt: false, exemptWhenStationedOutside: true, note: 'Exempt while stationed outside WV (30 days or less in WV)' },
  { code: 'WY', name: 'Wyoming',        effectiveRate: 0,      militaryExempt: true,  note: 'No state income tax' },
];

export function getStateTaxInfo(code: string | undefined): StateTaxInfo | undefined {
  if (!code) return undefined;
  return US_STATES.find((s) => s.code === code);
}

export function getStateTaxRate(code: string | undefined): number {
  return getStateTaxInfo(code)?.effectiveRate ?? 0;
}

/**
 * State tax rate on ACTIVE-DUTY pay for a member domiciled in `code` and
 * stationed in `dutyStationState` (a state code, or a country/territory for
 * OCONUS). An unknown duty station is treated as in-state — the
 * conservative (taxed) answer — rather than assuming an exemption.
 */
export function getActiveDutyStateTaxRate(code: string | undefined, dutyStationState: string | undefined): number {
  const info = getStateTaxInfo(code);
  if (!info || info.militaryExempt) return 0;
  if (info.exemptWhenStationedOutside && dutyStationState && dutyStationState !== info.code) return 0;
  return info.effectiveRate;
}

export const NO_INCOME_TAX_STATES = new Set(['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']);

/**
 * One short, precise label for a state's treatment of military pay, shared
 * by every state picker (Profile, Onboarding, Retirement Calculator) so the
 * same state never reads "NO TAX" in one place and "PENSION EXEMPT" in
 * another. Null when the pay is taxed.
 */
export function stateTaxBadge(code: string, retired: boolean, civilian = false): string | null {
  if (NO_INCOME_TAX_STATES.has(code)) return 'NO INCOME TAX';
  // Military exemptions don't apply to a civilian's wages.
  if (civilian) return null;
  if (retired) return RETIREMENT_TAX_EXEMPT_STATES.has(code) ? 'PENSION EXEMPT' : null;
  const info = getStateTaxInfo(code);
  if (info?.militaryExempt) return 'MIL PAY EXEMPT';
  if (info?.exemptWhenStationedOutside) return 'EXEMPT IF STATIONED OUT OF STATE';
  return null;
}

/**
 * States that fully, unconditionally exempt MILITARY RETIREMENT PAY (the
 * pension) from state income tax — a materially different, and generally
 * far more generous, list than `militaryExempt` above (which is scoped to
 * active-duty pay only, per this file's own header). calcLES() was reusing
 * the active-duty US_STATES table for retirees too, so a retiree living in,
 * say, Kansas or Utah — both of which fully exempt retirement pay but tax
 * active-duty pay — was shown a state tax deduction on their pension that
 * doesn't actually apply. Verified against themilitarywallet.com's 2026
 * state-by-state breakdown, cross-checked against a second source for KS/UT.
 *
 * Only unconditional, uncapped exemptions are marked true here — states with
 * an income cap, AGI phase-out, or age gate (e.g. CO, DE, GA, ID, KY, MD,
 * MT, NM, OR, VT, VA) are left false/taxed at this file's existing
 * effectiveRate, same "don't model partial exemptions as full" principle
 * used for the active-duty table. Utah's mechanism is technically a
 * nonrefundable tax credit (retired pay × 4.85%) rather than an income
 * exclusion, but since Utah's flat rate is also 4.85% the credit fully
 * offsets the tax for virtually every retiree — treated as exempt here to
 * reflect that real-world net effect.
 */
export const RETIREMENT_TAX_EXEMPT_STATES = new Set([
  // No state income tax at all
  'AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY',
  // Fully, unconditionally exempt military retirement pay
  'AL', 'AZ', 'AR', 'CT', 'HI', 'IL', 'IN', 'IA', 'KS', 'LA', 'ME', 'MA',
  'MI', 'MN', 'MS', 'MO', 'NE', 'NJ', 'NY', 'NC', 'ND', 'OH', 'OK', 'PA',
  'RI', 'SC', 'UT', 'WV', 'WI',
]);

export function getRetirementStateTaxRate(code: string | undefined): number {
  if (!code) return 0;
  if (RETIREMENT_TAX_EXEMPT_STATES.has(code)) return 0;
  // A pension is ordinary income, so it's taxed like civilian wages — not at
  // the active-duty rate, which is 0 in states that exempt active-duty pay
  // but still (at least partly) tax retired pay (KY, MT, NM).
  return getCivilianStateTaxRate(code);
}

/** State tax rate on ordinary (non-military) wages, e.g. a GS paycheck. */
export function getCivilianStateTaxRate(code: string | undefined): number {
  const info = getStateTaxInfo(code);
  return info?.civilianRate ?? info?.effectiveRate ?? 0;
}
