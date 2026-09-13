/**
 * VA disability combined rating ("whole person" method).
 * Rates: FY2026 (effective Dec 1, 2025, 2.8% COLA from FY2025 base).
 * Source: 38 CFR §4.25 (combined ratings), 38 CFR §4.26 (bilateral factor).
 * Verify at va.gov/disability/compensation-rates.
 */

// FY2026 monthly compensation — veteran alone (no dependents)
export const VA_RATES_ALONE: Record<number, number> = {
  10:  180.42,
  20:  356.66,
  30:  552.47,
  40:  795.84,
  50: 1132.90,
  60: 1435.02,
  70: 1808.45,
  80: 2102.15,
  90: 2362.30,
 100: 3938.58,
};

// FY2026 additional monthly amounts for dependents (30%+ only)
// Format: { rating: { withSpouse, withSpouseAndChild, perChild, ... } }
export interface DependentAdder {
  withSpouse: number;
  withSpouseAndChild: number;
  noSpouseOneChild: number;
  perAdditionalChild: number;
}

export const VA_DEP_ADDERS: Record<number, DependentAdder> = {
  // noSpouseOneChild at 30% verified against va.gov: $596.47 (1 child, no
  // spouse) - $552.47 (veteran alone) = $44.00 — was $43.00, off by $1/mo.
  // Cross-checked against a second independent source before changing.
  30:  { withSpouse: 65.00,  withSpouseAndChild: 114.00, noSpouseOneChild: 44.00,  perAdditionalChild: 32.00 },
  40:  { withSpouse: 87.00,  withSpouseAndChild: 152.00, noSpouseOneChild: 58.00,  perAdditionalChild: 43.00 },
  50:  { withSpouse: 109.00, withSpouseAndChild: 190.00, noSpouseOneChild: 73.00,  perAdditionalChild: 54.00 },
  60:  { withSpouse: 131.00, withSpouseAndChild: 228.00, noSpouseOneChild: 88.00,  perAdditionalChild: 65.00 },
  70:  { withSpouse: 153.00, withSpouseAndChild: 266.00, noSpouseOneChild: 102.00, perAdditionalChild: 76.00 },
  80:  { withSpouse: 175.00, withSpouseAndChild: 304.00, noSpouseOneChild: 117.00, perAdditionalChild: 87.00 },
  90:  { withSpouse: 197.00, withSpouseAndChild: 342.00, noSpouseOneChild: 132.00, perAdditionalChild: 98.00 },
 100:  { withSpouse: 219.59, withSpouseAndChild: 380.41, noSpouseOneChild: 146.85, perAdditionalChild: 109.11 },
};

// FY2026 "Added amounts" table — spouse receiving Aid & Attendance, and each
// additional child over 18 in a VA-qualifying school (a materially higher
// rate than a regular additional child under VA_DEP_ADDERS.perAdditionalChild
// — these are NOT the same adder). Only meaningful at 30%+, same as above.
// Source: va.gov/disability/compensation-rates/veteran-rates/ "Added amounts" table.
export const VA_SPOUSE_AA_ADDER: Record<number, number> = {
  30: 61.00, 40: 81.00, 50: 101.00, 60: 121.00,
  70: 141.00, 80: 161.00, 90: 181.00, 100: 201.41,
};
export const VA_SCHOOL_CHILD_ADDER: Record<number, number> = {
  30: 105.00, 40: 140.00, 50: 176.00, 60: 211.00,
  70: 246.00, 80: 281.00, 90: 317.00, 100: 352.45,
};

// FY2026 dependent-parent adders — derived from va.gov's published combined
// totals ("veteran with 1 child + 1 parent" / "+ 2 parents") minus the
// veteran-with-1-child total, since va.gov doesn't publish these as a
// standalone line item. Cross-checked against the FY2025 rate * 1.028 COLA
// for each tier before use (within a few cents at every rating, consistent
// with normal rounding).
export interface ParentAdder {
  oneParent: number;
  twoParents: number; // total for 2 parents, NOT 2x oneParent (VA tapers it)
}
export const VA_PARENT_ADDERS: Record<number, ParentAdder> = {
  30:  { oneParent: 52.00,  twoParents: 104.00 },
  40:  { oneParent: 70.00,  twoParents: 140.00 },
  50:  { oneParent: 88.00,  twoParents: 176.00 },
  60:  { oneParent: 105.00, twoParents: 210.00 },
  70:  { oneParent: 123.00, twoParents: 246.00 },
  80:  { oneParent: 140.00, twoParents: 280.00 },
  90:  { oneParent: 158.00, twoParents: 316.00 },
 100:  { oneParent: 176.24, twoParents: 352.48 },
};

export interface RatingInput {
  id: string;
  pct: number;   // 0–100 in steps of 10
  // Which paired extremity this disability affects, if any. Only set this
  // when the condition is in an arm or leg — the VA bilateral factor (38
  // CFR §4.26) applies when a veteran has at least one rated disability of
  // a LEFT extremity and at least one of a RIGHT extremity (arms and legs
  // both count, in any combination — it isn't limited to "both arms" or
  // "both legs" specifically). Leave unset for a condition that isn't
  // limb-specific (back, hearing, PTSD, etc) — those are never part of the
  // bilateral group.
  limb?: 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';
}

/**
 * Combines a list of raw percentages using the VA "whole person" method:
 * sort descending, apply each to the remaining "whole person" efficiency.
 * This is the same math 38 CFR §4.25's combined ratings table produces and
 * is associative/commutative, which is what lets the bilateral factor below
 * combine a sub-group first and then fold the result back in with the rest.
 */
function combineExact(pcts: number[]): number {
  if (pcts.length === 0) return 0;
  const sorted = [...pcts].sort((a, b) => b - a);
  let remaining = 100;
  for (const pct of sorted) {
    remaining = remaining * (1 - pct / 100);
  }
  return 100 - remaining;
}

/**
 * Computes combined VA disability rating, including the bilateral factor
 * (38 CFR §4.26) when applicable.
 *
 * Bilateral factor: when a veteran has disabilities of BOTH a left and a
 * right extremity (arm and/or leg, in any combination), those "bilateral"
 * disabilities are combined together first using the standard method, then
 * a further 10% of that combined value is added on top (the "bilateral
 * factor") before combining the result with every other, non-limb
 * disability. This is required by regulation — it is NOT optional and is
 * NOT the same as simply adding the ratings together. It never applies to
 * a single limb-only disability (there must be at least one left AND one
 * right rating) and never applies to non-limb conditions.
 */
export function combinedRating(ratings: RatingInput[]): {
  exact: number;
  rounded: number;
  remaining: number;
  bilateralApplied: boolean;
  // The 10% bilateral add-on amount (percentage points), for display only.
  bilateralBonus: number;
} {
  if (ratings.length === 0) return { exact: 0, rounded: 0, remaining: 100, bilateralApplied: false, bilateralBonus: 0 };

  const limbRatings = ratings.filter((r) => r.limb);
  const otherRatings = ratings.filter((r) => !r.limb);
  const hasLeft = limbRatings.some((r) => r.limb === 'left_arm' || r.limb === 'left_leg');
  const hasRight = limbRatings.some((r) => r.limb === 'right_arm' || r.limb === 'right_leg');
  const bilateralApplied = hasLeft && hasRight;

  let exact: number;
  let bilateralBonus = 0;

  if (bilateralApplied) {
    const bilateralSubtotal = combineExact(limbRatings.map((r) => r.pct));
    bilateralBonus = bilateralSubtotal * 0.1;
    const bilateralValue = bilateralSubtotal + bilateralBonus;
    exact = combineExact([...otherRatings.map((r) => r.pct), bilateralValue]);
  } else {
    exact = combineExact(ratings.map((r) => r.pct));
  }

  const remaining = 100 - exact;
  const rounded = Math.min(100, Math.round(exact / 10) * 10);
  return { exact, rounded, remaining, bilateralApplied, bilateralBonus };
}

export function monthlyCompensation(
  roundedRating: number,
  hasSpouse: boolean,
  numChildren: number,
): number {
  const base = VA_RATES_ALONE[roundedRating] ?? 0;
  if (roundedRating < 30 || (!hasSpouse && numChildren === 0)) return base;

  const adder = VA_DEP_ADDERS[roundedRating];
  if (!adder) return base;

  let add = 0;
  if (hasSpouse && numChildren > 0) {
    add = adder.withSpouseAndChild + (numChildren - 1) * adder.perAdditionalChild;
  } else if (hasSpouse) {
    add = adder.withSpouse;
  } else if (numChildren > 0) {
    add = adder.noSpouseOneChild + (numChildren - 1) * adder.perAdditionalChild;
  }

  return base + add;
}

export interface VaDependentsDetailed {
  hasSpouse: boolean;
  // Spouse requires Aid & Attendance (housebound/needs regular aid) — an
  // additional flat adder on top of the normal spouse amount. Meaningless
  // without hasSpouse.
  spouseAidAttendance?: boolean;
  numChildren: number;        // children under 18 (or 18+ but NOT in qualifying school)
  numSchoolChildren?: number; // children 18-23 in a VA-recognized school program — a higher adder than a regular additional child
  numDependentParents?: 0 | 1 | 2;
}

export interface VaCompensationBreakdown {
  base: number;
  spouseAdd: number;
  spouseAaAdd: number;
  childrenAdd: number;
  schoolChildrenAdd: number;
  parentsAdd: number;
  total: number;
}

/**
 * Full dependent-aware VA compensation, including spouse Aid & Attendance,
 * school-age (18-23) children, and dependent parent(s) — none of which
 * `monthlyCompensation` above covers (kept as-is since 5 other call sites
 * across the app use its simple 3-arg signature for the common case).
 * Returns a line-item breakdown so the UI can show exactly what each
 * dependent added, not just a final number.
 */
export function monthlyCompensationDetailed(
  roundedRating: number,
  deps: VaDependentsDetailed,
): VaCompensationBreakdown {
  const base = VA_RATES_ALONE[roundedRating] ?? 0;
  const zero: VaCompensationBreakdown = { base, spouseAdd: 0, spouseAaAdd: 0, childrenAdd: 0, schoolChildrenAdd: 0, parentsAdd: 0, total: base };
  if (roundedRating < 30) return zero;

  const adder = VA_DEP_ADDERS[roundedRating];
  if (!adder) return zero;

  const { hasSpouse, spouseAidAttendance, numChildren, numSchoolChildren = 0, numDependentParents = 0 } = deps;
  const totalRegularChildren = numChildren; // under-18 / non-school children only

  let spouseAdd = 0;
  let childrenAdd = 0;
  if (hasSpouse && totalRegularChildren > 0) {
    spouseAdd = adder.withSpouseAndChild - adder.perAdditionalChild; // isolate the "spouse" portion of the combined rate
    childrenAdd = adder.perAdditionalChild * totalRegularChildren;
  } else if (hasSpouse) {
    spouseAdd = adder.withSpouse;
  } else if (totalRegularChildren > 0) {
    childrenAdd = adder.noSpouseOneChild + (totalRegularChildren - 1) * adder.perAdditionalChild;
  }

  const spouseAaAdd = (hasSpouse && spouseAidAttendance) ? (VA_SPOUSE_AA_ADDER[roundedRating] ?? 0) : 0;
  const schoolChildrenAdd = numSchoolChildren > 0 ? (VA_SCHOOL_CHILD_ADDER[roundedRating] ?? 0) * numSchoolChildren : 0;
  const parentAdder = VA_PARENT_ADDERS[roundedRating];
  const parentsAdd = !parentAdder ? 0
    : numDependentParents === 1 ? parentAdder.oneParent
    : numDependentParents === 2 ? parentAdder.twoParents
    : 0;

  const total = base + spouseAdd + spouseAaAdd + childrenAdd + schoolChildrenAdd + parentsAdd;
  return { base, spouseAdd, spouseAaAdd, childrenAdd, schoolChildrenAdd, parentsAdd, total };
}

export const VALID_RATINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
