/**
 * TRICARE Cost Estimator — calculation logic.
 *
 * References:
 *  - TRICARE Prime/Select FY2026 cost-shares: tricare.mil/costs
 *  - Active Duty family deductibles: Select E1-E4 $50 ind/$100 fam; E5+ $150/$300
 *  - Retired under-65 Group B (retired on/after 1 Jan 2018): Prime $462.96 ind/$927 fam/year
 *  - Retired under-65 Group A (retired before 1 Jan 2018): Prime $381.96 ind/$765 fam/year
 *  - TRICARE Reserve Select FY2026 premium: $57.88/month member-only, $286.66/month member+family
 *  - Catastrophic cap: Active Duty $1,000/year; Retired/Reserve $3,500/year
 *  - TRICARE Dental Program (TDP) via United Concordia: active duty family rates
 *  - Rx: Generic at MTF/mail-order FREE; network retail generic $13/30-day
 */

export type CoverageStatus = 'active' | 'reserve' | 'retired';
export type GradeTier    = 'e1_e4' | 'e5_plus';
export type FamilySize   = 'individual' | 'plus_one' | 'family';
export type UsageLevel   = 'low' | 'medium' | 'high';
export type DentalPlan   = 'none' | 'member' | 'plus_one' | 'family';

export interface TricareInputs {
  status:     CoverageStatus;
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

// ── Allowed-charge averages (network rates) used for 20% cost-share estimate ──
const ALLOWED: Record<string, number> = {
  pcm:       175,   // primary care visit
  specialist: 250,  // specialist visit
  urgentCare: 125,  // urgent care visit
  er:        900,   // ER visit
};

// ── Visit profiles by usage level ─────────────────────────────────────────────
const VISITS: Record<UsageLevel, { pcm: number; specialist: number; urgentCare: number; er: number }> = {
  low:    { pcm: 3,  specialist: 1, urgentCare: 0, er: 0 },
  medium: { pcm: 7,  specialist: 3, urgentCare: 1, er: 0 },
  high:   { pcm: 14, specialist: 7, urgentCare: 2, er: 1 },
};

// ── Rx out-of-pocket (mail-order generics are FREE so cost is minimal) ────────
const RX_ANNUAL: Record<UsageLevel, number> = { low: 0, medium: 52, high: 156 };

// ── Dental TDP (United Concordia FY2026) ──────────────────────────────────────
const TDP_MONTHLY: Record<DentalPlan, number> = {
  none:    0,
  member:  14.06,
  plus_one: 33.99,
  family:  45.36,
};

// ── Prime copays by status ─────────────────────────────────────────────────────
const PRIME_COPAYS: Record<CoverageStatus, { pcm: number; specialist: number; urgentCare: number; er: number }> = {
  // Active Duty: $0 for everything at MTF; nominal for civilian network
  active:  { pcm: 0,  specialist: 0,  urgentCare: 0,  er: 0  },
  reserve: { pcm: 22, specialist: 33, urgentCare: 22, er: 58 },
  retired: { pcm: 22, specialist: 33, urgentCare: 22, er: 58 },
};

// ── Select / TRS deductibles ──────────────────────────────────────────────────
function selectDeductible(status: CoverageStatus, gradeTier: GradeTier, familySize: FamilySize): number {
  if (status === 'active') {
    const base = gradeTier === 'e1_e4' ? 50 : 150;
    return familySize === 'individual' ? base : base * 2;
  }
  // Retired / Reserve: $150 individual, $300 family
  return familySize === 'individual' ? 150 : 300;
}

function selectCostShareTotal(
  status: CoverageStatus,
  gradeTier: GradeTier,
  familySize: FamilySize,
  usage: UsageLevel,
): number {
  const v = VISITS[usage];
  const totalAllowed =
    v.pcm * ALLOWED.pcm +
    v.specialist * ALLOWED.specialist +
    v.urgentCare * ALLOWED.urgentCare +
    v.er * ALLOWED.er;
  const deductible = selectDeductible(status, gradeTier, familySize);
  const afterDeductible = Math.max(0, totalAllowed - deductible);
  return afterDeductible * 0.20; // 20% network cost-share
}

// ── Prime enrollment fees ─────────────────────────────────────────────────────
function primeEnrollmentFee(status: CoverageStatus, familySize: FamilySize): number {
  if (status === 'active') return 0;
  if (status === 'reserve') {
    // TRS separate — handled in alt plan
    return 0;
  }
  // Retired under-65, Group B (retired on/after 1 Jan 2018) — FY2026 rate
  return familySize === 'individual' ? 463 : 927;
}

// ── Prime copay total ──────────────────────────────────────────────────────────
function primeCopayTotal(status: CoverageStatus, usage: UsageLevel): number {
  const copay = PRIME_COPAYS[status];
  const v = VISITS[usage];
  return (
    v.pcm * copay.pcm +
    v.specialist * copay.specialist +
    v.urgentCare * copay.urgentCare +
    v.er * copay.er
  );
}

// ── TRS premium (Reserve Select) — FY2026 rates ──────────────────────────────
function trsAnnualPremium(familySize: FamilySize): number {
  return familySize === 'individual' ? 57.88 * 12 : 286.66 * 12;
}

// ── Catastrophic caps ──────────────────────────────────────────────────────────
function catCap(status: CoverageStatus): number {
  return status === 'active' ? 1000 : 3500;
}

// ── Pros/cons ──────────────────────────────────────────────────────────────────
const PRIME_PROS: Record<CoverageStatus, string[]> = {
  active:  ['$0 cost at MTF', 'Referrals handled for you', 'Best for frequent users', 'No deductible'],
  reserve: ['Predictable small copays', 'No deductible', 'Great MTF access', 'Lower high-use cost'],
  retired: ['Low fixed copays', 'No deductible surprises', 'Best for frequent use', 'MTF access'],
};
const PRIME_CONS: Record<CoverageStatus, string[]> = {
  active:  ['Requires PCM referrals', 'Tied to MTF location', 'Less flexible provider choice'],
  reserve: ['PCM referral required', 'MTF proximity matters', 'Separate enrollment required'],
  retired: ['Annual enrollment fee (~$463 ind/$927 fam)', 'Referral required for specialist', 'Must re-enroll annually'],
};
const SELECT_PROS: Record<CoverageStatus, string[]> = {
  active:  ['See any network provider', 'No referrals needed', 'More provider flexibility'],
  reserve: ['No enrollment fee', 'See any network provider', 'No referrals needed'],
  retired: ['No enrollment fee', 'No PCM referral needed', 'Good for low/occasional use'],
};
const SELECT_CONS: Record<CoverageStatus, string[]> = {
  active:  ['Annual deductible applies', '20% cost-share after deductible', 'Can add up with frequent visits'],
  reserve: ['TRS monthly premium', 'Annual deductible applies', '20% cost-share'],
  retired: ['Annual deductible', '20% cost-share can be significant', 'Less predictable costs'],
};

// ── Main function ─────────────────────────────────────────────────────────────
export function calcTricare(inputs: TricareInputs): TricareResult {
  const { status, gradeTier, familySize, usage, dental } = inputs;

  const dentalCostAnnual = TDP_MONTHLY[dental] * 12;
  const rx = RX_ANNUAL[usage];

  // ── Prime ──
  const primeEnroll = primeEnrollmentFee(status, familySize);
  const primeCopays = primeCopayTotal(status, usage);
  const primeTotal = Math.min(
    primeEnroll + primeCopays + rx + dentalCostAnnual,
    primeEnroll + catCap(status) + dentalCostAnnual,
  );

  const prime: PlanDetail = {
    name: status === 'active' ? 'TRICARE Prime' : status === 'reserve' ? 'TRICARE Prime Remote' : 'TRICARE Prime',
    tag: 'PRIME',
    annualEnrollment: primeEnroll,
    deductible: 0,
    estimatedCopays: Math.min(primeCopays, catCap(status)),
    estimatedRx: rx,
    dentalCost: dentalCostAnnual,
    totalEstimate: primeTotal,
    catCap: catCap(status),
    pros: PRIME_PROS[status],
    cons: PRIME_CONS[status],
  };

  // ── Select / TRS ──
  const altEnroll = status === 'reserve' ? trsAnnualPremium(familySize) : 0;
  const deductible = selectDeductible(status, gradeTier, familySize);
  const altCostShare = selectCostShareTotal(status, gradeTier, familySize, usage);
  const altCopays = deductible + altCostShare;
  const altTotal = Math.min(
    altEnroll + altCopays + rx + dentalCostAnnual,
    altEnroll + catCap(status) + dentalCostAnnual,
  );

  const altName = status === 'reserve' ? 'TRICARE Reserve Select' : 'TRICARE Select';
  const altTag  = status === 'reserve' ? 'TRS' : 'SELECT';

  const alt: PlanDetail = {
    name: altName,
    tag: altTag,
    annualEnrollment: altEnroll,
    deductible,
    estimatedCopays: Math.min(altCostShare, catCap(status)),
    estimatedRx: rx,
    dentalCost: dentalCostAnnual,
    totalEstimate: altTotal,
    catCap: catCap(status),
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
    note = 'Active Duty families pay $0 enrollment on both plans. Prime offers $0 copays at MTFs; Select gives referral-free civilian access with deductible + 20% cost-share.';
  } else if (status === 'reserve') {
    note = 'TRICARE Reserve Select requires a monthly premium. Coverage and cost-shares mirror TRICARE Select. Prime Remote is an option near MTFs.';
  } else {
    note = 'Retired under-65. Prime charges an enrollment fee but small fixed copays. Select has no enrollment fee but applies a deductible + 20% cost-share—better for low-use families.';
  }

  return { prime, alt, savingsForPrime, winnerTag, note };
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
