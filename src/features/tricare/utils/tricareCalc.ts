/**
 * TRICARE Cost Estimator — calculation logic.
 *
 * References (DHA "TRICARE 2026 Costs and Fees" official fact sheet,
 * tricare.mil/-/media/Files/TRICARE/Publications/FactSheets/Costs_Fees.pdf,
 * updated May 2026):
 *  - Group A: sponsor's initial enlistment/appointment before Jan 1, 2018.
 *    Group B: on/after Jan 1, 2018.
 *  - TRICARE Select/TRS use FLAT network copays per visit type (not a
 *    percentage of an allowed charge) — only non-network care uses a
 *    20-25% cost-share. This estimator assumes network care throughout.
 *  - Retired Prime enrollment: Group A $381.96 ind/$765 fam/yr;
 *    Group B $462.96 ind/$927 fam/yr.
 *  - Retired Select enrollment: Group A $186.96 ind/$375 fam/yr;
 *    Group B $594.96 ind/$1,191 fam/yr.
 *  - TRICARE Reserve Select (TRS) premium: $57.88/mo member-only,
 *    $286.66/mo member+family.
 *  - Catastrophic caps: Active Duty Group A $1,000, Group B $1,324;
 *    TRS $1,324; Retired Group A Prime $3,000 / Select $4,381;
 *    Retired Group B Prime & Select both $4,635.
 *  - TRICARE Dental Program (TDP, United Concordia) premiums effective
 *    March 1, 2026 – Feb 28, 2027: E4-and-below $8.79/mo (1 dependent) or
 *    $22.85/mo (2+ dependents); E5-and-above $11.72/mo (1 dependent) or
 *    $30.47/mo (2+ dependents). Retirees are not TDP-eligible (they use
 *    FEDVIP instead), so dental cost is $0 in this estimator for 'retired'.
 *  - Rx: generic at MTF FREE; mail-order (90-day) generic $14, brand $44,
 *    non-formulary $85; retail (30-day) generic $16, brand $48,
 *    non-formulary $85.
 */

export type CoverageStatus     = 'active' | 'reserve' | 'retired';
export type BeneficiaryGroup   = 'groupA' | 'groupB';
export type GradeTier          = 'e1_e4' | 'e5_plus';
export type FamilySize         = 'individual' | 'plus_one' | 'family';
export type UsageLevel         = 'low' | 'medium' | 'high';
export type DentalPlan         = 'none' | 'one' | 'multi';

export interface TricareInputs {
  status:     CoverageStatus;
  group:      BeneficiaryGroup;
  gradeTier:  GradeTier;
  familySize: FamilySize;
  usage:      UsageLevel;
  dental:     DentalPlan;
}

export interface PlanDetail {
  name:            string;   // "TRICARE Prime" etc.
  tag:             string;   // "PRIME" | "SELECT" | "TRS"
  annualEnrollment: number;  // enrollment fee or TRS premium
  deductible:      number;   // annual deductible
  estimatedCopays: number;   // estimated copays/cost-shares
  estimatedRx:     number;   // estimated Rx out-of-pocket
  dentalCost:      number;   // annual dental (if selected)
  totalEstimate:   number;   // sum of all above
  catCap:          number;   // catastrophic cap (worst-case ceiling)
  pros:            string[];
  cons:            string[];
}

export interface TricareResult {
  prime:          PlanDetail;
  alt:            PlanDetail;  // Select (active/retired) or TRS (reserve)
  savingsForPrime: number;     // positive = prime costs MORE; negative = prime costs LESS
  winnerTag:       'prime' | 'alt' | 'same';
  note:            string;
}

// ── Visit profiles by usage level ─────────────────────────────────────────────
interface VisitProfile { pcm: number; specialist: number; urgentCare: number; er: number; }

const VISITS: Record<UsageLevel, VisitProfile> = {
  low:    { pcm: 3,  specialist: 1, urgentCare: 0, er: 0 },
  medium: { pcm: 7,  specialist: 3, urgentCare: 1, er: 0 },
  high:   { pcm: 14, specialist: 7, urgentCare: 2, er: 1 },
};

// ── Rx out-of-pocket (rough annual estimate by usage level) ──────────────────
const RX_ANNUAL: Record<UsageLevel, number> = { low: 0, medium: 52, high: 156 };

// ── TDP (United Concordia) — March 2026-Feb 2027 rates, by sponsor grade ─────
const TDP_MONTHLY: Record<GradeTier, { one: number; multi: number }> = {
  e1_e4:   { one: 8.79,  multi: 22.85 },
  e5_plus: { one: 11.72, multi: 30.47 },
};

function tdpMonthly(gradeTier: GradeTier, dental: DentalPlan): number {
  if (dental === 'none') return 0;
  const t = TDP_MONTHLY[gradeTier];
  return dental === 'one' ? t.one : t.multi;
}

// ── Prime flat network copays per visit (2026 fact sheet) ────────────────────
// Active Duty: $0 everywhere. Retired & Reserve (Prime Remote): identical
// schedule for Group A and Group B per the official table.
const PRIME_COPAYS: Record<CoverageStatus, VisitProfile> = {
  active:  { pcm: 0,  specialist: 0,  urgentCare: 0,  er: 0  },
  reserve: { pcm: 26, specialist: 39, urgentCare: 39, er: 79 },
  retired: { pcm: 26, specialist: 39, urgentCare: 39, er: 79 },
};

// ── Select / TRS flat network copays per visit (2026 fact sheet) ─────────────
const SELECT_COPAYS: Record<string, VisitProfile> = {
  active_groupA:  { pcm: 28, specialist: 39, urgentCare: 28, er: 103 },
  active_groupB:  { pcm: 19, specialist: 33, urgentCare: 26, er: 52  },
  retired_groupA: { pcm: 38, specialist: 52, urgentCare: 38, er: 138 },
  retired_groupB: { pcm: 33, specialist: 52, urgentCare: 52, er: 105 },
  reserve:        { pcm: 19, specialist: 33, urgentCare: 26, er: 52  }, // TRICARE Reserve Select
};

function selectCopaySet(status: CoverageStatus, group: BeneficiaryGroup): VisitProfile {
  if (status === 'reserve') return SELECT_COPAYS.reserve;
  return SELECT_COPAYS[`${status}_${group}`];
}

function copayTotal(copay: VisitProfile, usage: UsageLevel): number {
  const v = VISITS[usage];
  return v.pcm * copay.pcm + v.specialist * copay.specialist + v.urgentCare * copay.urgentCare + v.er * copay.er;
}

// ── Select / TRS deductibles (2026 fact sheet) ────────────────────────────────
interface Deductible { ind: number; fam: number; }

const AD_SELECT_DEDUCTIBLE: Record<BeneficiaryGroup, Record<GradeTier, Deductible>> = {
  groupA: { e1_e4: { ind: 50,  fam: 100 }, e5_plus: { ind: 150, fam: 300 } },
  groupB: { e1_e4: { ind: 66,  fam: 132 }, e5_plus: { ind: 198, fam: 397 } },
};

const RETIRED_SELECT_DEDUCTIBLE: Record<BeneficiaryGroup, Deductible> = {
  groupA: { ind: 150, fam: 300 },
  groupB: { ind: 198, fam: 397 }, // network rate
};

// TRS deductible schedule (single published table, no Group A/B split)
const TRS_DEDUCTIBLE: Record<GradeTier, Deductible> = {
  e1_e4:   { ind: 66,  fam: 132 },
  e5_plus: { ind: 198, fam: 397 },
};

function selectDeductible(
  status: CoverageStatus,
  group: BeneficiaryGroup,
  gradeTier: GradeTier,
  familySize: FamilySize,
): number {
  const isFam = familySize !== 'individual';
  if (status === 'active') {
    const d = AD_SELECT_DEDUCTIBLE[group][gradeTier];
    return isFam ? d.fam : d.ind;
  }
  if (status === 'reserve') {
    const d = TRS_DEDUCTIBLE[gradeTier];
    return isFam ? d.fam : d.ind;
  }
  const d = RETIRED_SELECT_DEDUCTIBLE[group];
  return isFam ? d.fam : d.ind;
}

// ── Enrollment fees ────────────────────────────────────────────────────────────
const RETIRED_PRIME_ENROLL: Record<BeneficiaryGroup, { ind: number; fam: number }> = {
  groupA: { ind: 382, fam: 765 },
  groupB: { ind: 463, fam: 927 },
};

const RETIRED_SELECT_ENROLL: Record<BeneficiaryGroup, { ind: number; fam: number }> = {
  groupA: { ind: 187, fam: 375 },
  groupB: { ind: 595, fam: 1191 },
};

function primeEnrollmentFee(status: CoverageStatus, group: BeneficiaryGroup, familySize: FamilySize): number {
  if (status !== 'retired') return 0; // Active Duty & TRS Prime Remote: $0
  const e = RETIRED_PRIME_ENROLL[group];
  return familySize === 'individual' ? e.ind : e.fam;
}

function selectEnrollmentFee(status: CoverageStatus, group: BeneficiaryGroup, familySize: FamilySize): number {
  if (status !== 'retired') return 0; // Active Duty Select: $0. TRS: premium instead (handled separately).
  const e = RETIRED_SELECT_ENROLL[group];
  return familySize === 'individual' ? e.ind : e.fam;
}

// ── TRS premium (Reserve Select) — 2026 rates ────────────────────────────────
function trsAnnualPremium(familySize: FamilySize): number {
  return familySize === 'individual' ? 57.88 * 12 : 286.66 * 12;
}

// ── Catastrophic caps ──────────────────────────────────────────────────────────
const AD_CATCAP: Record<BeneficiaryGroup, number> = { groupA: 1000, groupB: 1324 };
const TRS_CATCAP = 1324;
const RETIRED_CATCAP: Record<BeneficiaryGroup, { prime: number; select: number }> = {
  groupA: { prime: 3000, select: 4381 },
  groupB: { prime: 4635, select: 4635 },
};

function catCap(status: CoverageStatus, group: BeneficiaryGroup, plan: 'prime' | 'select'): number {
  if (status === 'active') return AD_CATCAP[group];
  if (status === 'reserve') return TRS_CATCAP;
  return RETIRED_CATCAP[group][plan];
}

// ── Pros/cons ──────────────────────────────────────────────────────────────────
const PRIME_PROS: Record<CoverageStatus, string[]> = {
  active:  ['$0 cost at MTF', 'Referrals handled for you', 'Best for frequent users', 'No deductible'],
  reserve: ['Predictable small copays', 'No deductible', 'Great MTF access', 'Lower high-use cost'],
  retired: ['Predictable fixed copays', 'No deductible surprises', 'Best for frequent use', 'MTF access'],
};
const PRIME_CONS: Record<CoverageStatus, string[]> = {
  active:  ['Requires PCM referrals', 'Tied to MTF location', 'Less flexible provider choice'],
  reserve: ['PCM referral required', 'MTF proximity matters', 'Separate enrollment required'],
  retired: ['Annual enrollment fee', 'Referral required for specialist', 'Must re-enroll annually'],
};
const SELECT_PROS: Record<CoverageStatus, string[]> = {
  active:  ['See any network provider', 'No referrals needed', 'More provider flexibility'],
  reserve: ['See any network provider', 'No referrals needed', 'Flat network copays'],
  retired: ['No PCM referral needed', 'Flat network copays', 'Good for low/occasional use'],
};
const SELECT_CONS: Record<CoverageStatus, string[]> = {
  active:  ['Annual deductible applies', 'Non-network care costs more (20%)', 'Now also has an enrollment-style deductible'],
  reserve: ['TRS monthly premium', 'Annual deductible applies', 'Non-network care costs more (20%)'],
  retired: ['Annual enrollment fee (new since 2021)', 'Annual deductible applies', 'Non-network care costs more (25%)'],
};

// ── Main function ─────────────────────────────────────────────────────────────
export function calcTricare(inputs: TricareInputs): TricareResult {
  const { status, group, gradeTier, familySize, usage, dental } = inputs;

  // Retirees are not TDP-eligible (they use FEDVIP, a separate program).
  const dentalCostAnnual = status === 'retired' ? 0 : tdpMonthly(gradeTier, dental) * 12;
  const rx = RX_ANNUAL[usage];

  // ── Prime ──
  const primeEnroll = primeEnrollmentFee(status, group, familySize);
  const primeCopays = copayTotal(PRIME_COPAYS[status], usage);
  const pCap = catCap(status, group, 'prime');
  const primeTotal = Math.min(
    primeEnroll + primeCopays + rx + dentalCostAnnual,
    primeEnroll + pCap + dentalCostAnnual,
  );

  const prime: PlanDetail = {
    name: status === 'active' ? 'TRICARE Prime' : status === 'reserve' ? 'TRICARE Prime Remote' : 'TRICARE Prime',
    tag: 'PRIME',
    annualEnrollment: primeEnroll,
    deductible: 0,
    estimatedCopays: Math.min(primeCopays, pCap),
    estimatedRx: rx,
    dentalCost: dentalCostAnnual,
    totalEstimate: primeTotal,
    catCap: pCap,
    pros: PRIME_PROS[status],
    cons: PRIME_CONS[status],
  };

  // ── Select / TRS ──
  const altEnroll = status === 'reserve'
    ? trsAnnualPremium(familySize)
    : selectEnrollmentFee(status, group, familySize);
  const deductible = selectDeductible(status, group, gradeTier, familySize);
  const altCostShare = copayTotal(selectCopaySet(status, group), usage);
  const altCopays = deductible + altCostShare;
  const aCap = catCap(status, group, 'select');
  const altTotal = Math.min(
    altEnroll + altCopays + rx + dentalCostAnnual,
    altEnroll + aCap + dentalCostAnnual,
  );

  const altName = status === 'reserve' ? 'TRICARE Reserve Select' : 'TRICARE Select';
  const altTag  = status === 'reserve' ? 'TRS' : 'SELECT';

  const alt: PlanDetail = {
    name: altName,
    tag: altTag,
    annualEnrollment: altEnroll,
    deductible,
    estimatedCopays: Math.min(altCostShare, aCap),
    estimatedRx: rx,
    dentalCost: dentalCostAnnual,
    totalEstimate: altTotal,
    catCap: aCap,
    pros: SELECT_PROS[status],
    cons: SELECT_CONS[status],
  };

  // ── Comparison ──
  const savingsForPrime = primeTotal - altTotal; // positive = prime costs more
  const diff = Math.abs(savingsForPrime);
  const winnerTag: 'prime' | 'alt' | 'same' =
    diff < 50 ? 'same' : savingsForPrime > 0 ? 'alt' : 'prime';

  let note = '';
  if (status === 'active') {
    note = 'Active Duty families pay $0 enrollment on both plans. Prime offers $0 copays at MTFs; Select gives referral-free civilian access with a deductible plus flat network copays per visit.';
  } else if (status === 'reserve') {
    note = 'TRICARE Reserve Select requires a monthly premium. Coverage and cost-shares mirror TRICARE Select. Prime Remote is an option near MTFs.';
  } else {
    note = 'Retired under-65. Both Prime and Select now charge an annual enrollment fee. Prime has fixed copays and no deductible; Select has a deductible plus flat network copays — better for low-use families.';
  }

  return { prime, alt, savingsForPrime, winnerTag, note };
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
