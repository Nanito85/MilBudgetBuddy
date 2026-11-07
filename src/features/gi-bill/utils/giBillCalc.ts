/**
 * Post-9/11 GI Bill (Chapter 33) calculator.
 * Rates: AY2026–2027 (effective August 1, 2026 – July 31, 2027). Source: va.gov/education/benefit-rates.
 * Tuition cap: $30,908.34/year (private/foreign schools, AY2026-27) — up 3.3% from AY2025-26's $29,920.95.
 * Online BAH rate: $1,198.00/mo (AY2026-27, all-online enrollment: half the $2,396 national
 * average MHA, per va.gov/education/benefit-rates/post-9-11-gi-bill-rates, checked 2026-11-07).
 * Book stipend: up to $1,000/year (pro-rated by enrollment) — stable, non-indexed.
 * BAH = E5-w/dependent rate for school's location (in-person/hybrid enrollment).
 */

export const GI_BILL_TUITION_CAP_PRIVATE = 30_908.34;    // per academic year
export const GI_BILL_BAH_ONLINE = 1_198;                 // per month, all online
export const GI_BILL_BOOK_ANNUAL = 1_000;                // max per academic year
export const GI_BILL_DATA_YEAR = '2026–2027';
export const GI_BILL_TOTAL_MONTHS = 36;

// Eligibility tier based on qualifying active duty service
export interface EligibilityTier {
  id: string;
  label: string;
  description: string;
  pct: number;   // 0–100
}

export const ELIGIBILITY_TIERS: EligibilityTier[] = [
  { id: 't50',  label: '50%',  description: '90–179 days (3–5 mo) active duty',   pct: 50  },
  { id: 't60',  label: '60%',  description: '180–544 days (6–17 mo) active duty', pct: 60  },
  { id: 't70',  label: '70%',  description: '545–729 days (18–23 mo) active duty', pct: 70  },
  { id: 't80',  label: '80%',  description: '730–909 days (24–29 mo) active duty', pct: 80  },
  { id: 't90',  label: '90%',  description: '910–1,094 days (30–35 mo) active duty', pct: 90  },
  { id: 't100', label: '100%', description: '36+ months OR 30+ days w/ SCD',   pct: 100 },
];

// School types
export type SchoolType = 'public_instate' | 'public_outofstate' | 'private' | 'online_only';

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  public_instate:    'Public — In-State',
  public_outofstate: 'Public — Out-of-State',
  private:           'Private / Foreign',
  online_only:       'Online Only',
};

// Enrollment status
export type EnrollmentStatus = 'full' | 'three_quarter' | 'half';

export const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  full:          'Full-Time',
  three_quarter: '¾ Time',
  half:          'Half-Time',
};

// Enrollment rate for BAH and book stipend
const ENROLLMENT_RATE: Record<EnrollmentStatus, number> = {
  full: 1.0,
  three_quarter: 0.75,
  half: 0.5,
};

export interface GiBillInputs {
  eligibilityPct: number;           // 50, 60, 70, 80, 90, or 100 — see ELIGIBILITY_TIERS
  schoolType: SchoolType;
  enrollment: EnrollmentStatus;
  monthlyBahAtSchool: number;       // E5-w/dep BAH for school's ZIP
  tuitionPerYear: number;           // actual tuition charged
  monthsUsed: number;               // 0–36
}

export interface GiBillResult {
  monthsRemaining: number;
  monthsUsed: number;
  pctUsed: number;

  // Monthly entitlements
  monthlyBah: number;
  monthlyBahDisplay: string;
  monthlyBookStipend: number;
  monthlyTuitionCoveredDisplay: string;

  // Annual amounts
  annualTuitionCoverage: number;    // capped at private cap if private
  annualTuitionOut: number;         // amount veteran owes
  annualBookStipend: number;

  // Combined monthly value for display
  monthlyTotalValue: number;

  tuitionNote: string;
  bahNote: string;
}

export function calcGiBill(inputs: GiBillInputs): GiBillResult {
  const { eligibilityPct, schoolType, enrollment, monthlyBahAtSchool, tuitionPerYear, monthsUsed } = inputs;
  const tierRate = eligibilityPct / 100;
  const enrollRate = ENROLLMENT_RATE[enrollment];

  const monthsRemaining = Math.max(0, GI_BILL_TOTAL_MONTHS - monthsUsed);
  const pctUsed = monthsUsed / GI_BILL_TOTAL_MONTHS;

  // BAH — every Post-9/11 GI Bill amount (tuition, book stipend, and this)
  // scales by the member's eligibility tier %, same as annualTuitionCoverage
  // and annualBookStipend below. The online flat rate is no exception: a
  // member at 50% eligibility gets 50% of $1,198, not the full flat rate.
  let rawBah: number;
  if (schoolType === 'online_only') {
    rawBah = GI_BILL_BAH_ONLINE * tierRate;
  } else {
    rawBah = monthlyBahAtSchool * tierRate;
  }
  // MHA (housing) has a stricter enrollment threshold than tuition or the
  // book stipend: 38 CFR 21.9700 requires MORE than half-time — "half-time"
  // itself pays $0 MHA, not a prorated half rate. Book stipend only needs
  // AT LEAST half-time and genuinely does prorate to 50% there, which is
  // why enrollRate is still the right multiplier for annualBookStipend
  // below — this used to also apply that same 50% rate to BAH, overstating
  // a half-time student's housing benefit by the full BAH amount.
  // Source: va.gov/education/benefit-rates/post-9-11-gi-bill-rates (MHA
  // eligibility: "rate of pursuit must be more than 50%").
  const monthlyBah = enrollment === 'half' ? 0 : Math.round(rawBah * enrollRate);

  // Tuition coverage
  let tuitionCap: number;
  let tuitionNote: string;
  if (schoolType === 'public_instate') {
    tuitionCap = tuitionPerYear;   // VA pays 100% of in-state tuition
    tuitionNote = 'VA pays 100% of in-state tuition for public schools.';
  } else if (schoolType === 'public_outofstate') {
    // Out-of-state students at public schools are covered at the in-state rate, and the VA does NOT
    // know that rate from this screen's single tuition field, so the full entered tuition is
    // treated as the in-state figure. The note now says so instead of promising "up to in-state"
    // while counting everything.
    tuitionCap = tuitionPerYear;
    tuitionNote = 'Enter the IN-STATE tuition for this school: the VA pays up to the in-state rate (out-of-state students are not covered above it). Yellow Ribbon may cover part of the difference.';
  } else if (schoolType === 'online_only') {
    // Online students still get tuition paid: public up to in-state rate, private up to the cap.
    tuitionCap = GI_BILL_TUITION_CAP_PRIVATE;
    tuitionNote = `VA pays tuition for online programs too (public: in-state rate; private: up to $${GI_BILL_TUITION_CAP_PRIVATE.toLocaleString()}/yr). Enter your annual tuition.`;
  } else {
    tuitionCap = GI_BILL_TUITION_CAP_PRIVATE;
    tuitionNote = `VA pays up to $${GI_BILL_TUITION_CAP_PRIVATE.toLocaleString()}/yr for private schools (AY${GI_BILL_DATA_YEAR}).`;
  }

  const annualTuitionCoverage = Math.min(tuitionPerYear, tuitionCap) * tierRate;
  const annualTuitionOut = Math.max(0, tuitionPerYear - annualTuitionCoverage);

  // Book stipend
  const annualBookStipend = Math.round(GI_BILL_BOOK_ANNUAL * tierRate * enrollRate);
  const monthlyBookStipend = Math.round(annualBookStipend / 12);

  const monthlyTuitionValue = Math.round(annualTuitionCoverage / 9);   // ~9-month academic year
  const monthlyTotalValue = monthlyBah + monthlyBookStipend + monthlyTuitionValue;

  const monthlyTuitionDisplay = `~$${monthlyTuitionValue.toLocaleString()}/mo`;

  const bahNote = enrollment === 'half'
    ? 'No housing allowance is payable at exactly half-time — MHA requires enrollment MORE than half-time (38 CFR 21.9700). Tuition and the book stipend still apply.'
    : '';

  return {
    monthsRemaining,
    monthsUsed,
    pctUsed,
    monthlyBah,
    // Was displaying the raw, unscaled GI_BILL_BAH_ONLINE constant here even
    // though monthlyBah (used in monthlyTotalValue below) is correctly
    // scaled by tier % and enrollment rate — a half-time student at 50%
    // eligibility saw "$1,198/mo" on screen while only ~$315 was actually
    // counted in their total. Show the real computed number instead.
    monthlyBahDisplay: schoolType === 'online_only' ? `$${monthlyBah.toLocaleString()}/mo (online rate)` : `$${monthlyBah.toLocaleString()}/mo`,
    monthlyBookStipend,
    monthlyTuitionCoveredDisplay: monthlyTuitionDisplay,
    annualTuitionCoverage,
    annualTuitionOut,
    annualBookStipend,
    monthlyTotalValue,
    tuitionNote,
    bahNote,
  };
}
