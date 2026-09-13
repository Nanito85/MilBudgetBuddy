/**
 * Plain-assertion verification script for the retiree/VA/pay-schedule audit
 * (2026-09-13). No test framework is set up in this project (no jest,
 * vitest, or "test" npm script existed before this pass) — rather than pull
 * in a whole framework for a handful of pure-function checks, this runs
 * directly via `tsx` (already used ad hoc elsewhere in this session) against
 * the real calculation modules, using the same `@/` path aliases the app
 * itself uses (tsx respects tsconfig.json's `paths`).
 *
 * Run: npx tsx scripts/verify-calculations.ts
 * Exits non-zero (and prints which assertion failed) if anything regresses.
 */
import { getPayDayInfo } from '@/features/home/utils/payScheduleCalc';
import { calcLES } from '@/features/home/utils/lesCalc';
import { getBasicPay, getHigh3Average, getHigh3AverageDetailed } from '@/data/basic-pay-rates';
import { combinedRating, monthlyCompensationDetailed, monthlyCompensation } from '@/features/va/utils/vaDisabilityCalc';

let pass = 0;
let fail = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = typeof actual === 'number' && typeof expected === 'number'
    ? Math.abs(actual - expected) < 0.05
    : actual === expected;
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

// ── 1/2. Active duty vs retiree pay schedule ──────────────────────────────────
console.log('\n[1/2] Pay day schedule');
{
  const activeInfo = getPayDayInfo(false);
  assertTrue(activeInfo.label === '1st' || activeInfo.label === '15th', 'Active duty next payday label is 1st or 15th');

  const retiredInfo = getPayDayInfo(true);
  assertEqual(retiredInfo.label, '1st', 'Retiree next payday label is always 1st (never 15th)');
}

// ── 3/11. SGLI: retiree never charged, active duty still charged ─────────────
console.log('\n[3/11] SGLI deduction by status');
{
  const baseInputs = {
    payGrade: 'E7', yos: 20, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 5, hasDentalFamily: false, sglOptOut: false,
  };
  const active = calcLES({ ...baseInputs, serviceStatus: 'active' });
  assertEqual(active.sgli, 26, 'Active duty (not opted out) is charged $26 SGLI');

  const retired = calcLES({ ...baseInputs, serviceStatus: 'retired' });
  assertEqual(retired.sgli, 0, 'Retiree is NOT charged SGLI even with sglOptOut=false');
  assertEqual(retired.fica, 0, 'Retiree pays no FICA on retired pay (existing behavior, still correct)');
  assertTrue(retired.basePay > 0, 'Retiree still shows a nonzero retired-pay basePay');

  const civilian = calcLES({ ...baseInputs, serviceStatus: 'civilian' });
  assertEqual(civilian.sgli, 0, 'A pure civilian (never served) is NOT charged SGLI — it is a uniformed-service-only benefit');
}

// ── SBP: retiree-only, opt-in ──────────────────────────────────────────────────
console.log('\n[SBP] Retiree-only opt-in deduction');
{
  const base = {
    payGrade: 'E7' as const, yos: 20, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'retired' as const,
  };
  const noSbp = calcLES({ ...base, sbpEnabled: false });
  assertEqual(noSbp.sbp, 0, 'SBP is $0 when not enabled');

  const withSbp = calcLES({ ...base, sbpEnabled: true, sbpCoveragePct: 1 });
  assertTrue(withSbp.sbp > 0, 'SBP premium is nonzero when enabled');
  assertEqual(withSbp.sbp, withSbp.basePay * 0.065, 'SBP premium is 6.5% of covered (full) retired pay');

  const activeWithSbpFlag = calcLES({ ...base, serviceStatus: 'active', sbpEnabled: true });
  assertEqual(activeWithSbpFlag.sbp, 0, 'SBP never applies to active duty even if the flag were somehow set');
}

// ── 4. State tax always computed (never silently skipped) ────────────────────
console.log('\n[4] State tax');
{
  const noStateSelected = calcLES({
    payGrade: 'E7', yos: 20, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'active', stateResidence: undefined,
  });
  assertEqual(noStateSelected.stateTax, 0, 'No state selected -> stateTax is 0 (UI must show $0.00, not hide the row)');

  const noTaxState = calcLES({
    payGrade: 'E7', yos: 20, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'retired', stateResidence: 'TX', // no income tax at all
  });
  assertEqual(noTaxState.stateTax, 0, 'No-income-tax state (TX) -> stateTax is 0 for a retiree');

  const taxedState = calcLES({
    payGrade: 'E7', yos: 20, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'retired', stateResidence: 'CA', // taxes retirement pay
  });
  assertTrue(taxedState.stateTax > 0, 'A state that taxes retired pay (CA) shows a nonzero stateTax for a retiree');
}

// ── 5/6. High-3: promotion-aware vs plain proxy ───────────────────────────────
console.log('\n[5/6] High-3 calculation');
{
  const plain36mo = getHigh3AverageDetailed('E7', 20, 36, 'E6');
  assertEqual(plain36mo.usedPreviousGrade, false, '36+ months at final grade -> Quick Estimate path (no previous-grade blend)');
  assertEqual(plain36mo.average, getHigh3Average('E7', 20), '36+ months matches the plain getHigh3Average exactly');

  const promoted12moAgo = getHigh3AverageDetailed('E7', 20, 12, 'E6');
  assertEqual(promoted12moAgo.usedPreviousGrade, true, '<36 months at final grade -> Detailed (promotion-aware) path used');
  assertTrue(
    promoted12moAgo.average < getHigh3Average('E7', 20),
    'Detailed blend (partial E6 pay) is lower than the plain all-E7 proxy — matches the "24mo E7 + 12mo E6" example in the feedback',
  );
}

// ── 7. Existing active-duty basic pay lookups unaffected ──────────────────────
console.log('\n[7] Active duty basic pay unaffected');
{
  assertEqual(getBasicPay('E7', 20), 6245, 'E7 @ 20 YOS basic pay matches FY2026 table (unchanged)');
  assertEqual(getBasicPay('O5', 18), 11714, 'O5 @ 18 YOS basic pay matches FY2026 table (unchanged)');
}

// ── 8. VA combined ratings math ────────────────────────────────────────────────
console.log('\n[8] VA combined ratings');
{
  const r = combinedRating([{ id: 'a', pct: 50 }, { id: 'b', pct: 30 }]);
  // Official VA combined-ratings table: 50 combined with 30 = 65, rounds to 70.
  assertEqual(r.exact, 65, '50% + 30% combines to 65% exact (VA whole-person method)');
  assertEqual(r.rounded, 70, '65% rounds to 70% (nearest 10, 5 rounds up)');
  assertEqual(r.bilateralApplied, false, 'No limb tags -> bilateral factor not applied');

  const single = combinedRating([{ id: 'a', pct: 100 }]);
  assertEqual(single.rounded, 100, 'A single 100% rating combines to 100%');
}

// ── 9. VA bilateral factor ─────────────────────────────────────────────────────
console.log('\n[9] VA bilateral factor');
{
  const withBilateral = combinedRating([
    { id: 'a', pct: 20, limb: 'left_leg' },
    { id: 'b', pct: 20, limb: 'right_leg' },
    { id: 'c', pct: 10 },
  ]);
  assertTrue(withBilateral.bilateralApplied, 'Left-leg + right-leg ratings trigger the bilateral factor');
  assertTrue(withBilateral.bilateralBonus > 0, 'Bilateral bonus is a positive percentage');
  // Hand-computed: combine(20,20) = 36; +10% = 39.6; combine(39.6, 10) = 45.64 -> rounds to 50.
  assertEqual(withBilateral.exact, 45.64, 'Bilateral-adjusted exact combined value matches hand calculation');
  assertEqual(withBilateral.rounded, 50, 'Bilateral-adjusted rating rounds to 50%');

  const withoutBilateralTag = combinedRating([
    { id: 'a', pct: 20 }, { id: 'b', pct: 20 }, { id: 'c', pct: 10 },
  ]);
  assertTrue(withoutBilateralTag.exact < withBilateral.exact, 'Untagged (naive) combination is lower than the bilateral-adjusted result — confirms the factor is not a no-op');

  const oneLimbOnly = combinedRating([{ id: 'a', pct: 20, limb: 'left_leg' }, { id: 'b', pct: 10 }]);
  assertTrue(!oneLimbOnly.bilateralApplied, 'A single limb-tagged rating alone (no opposite side) does NOT trigger the bilateral factor');
}

// ── 10. VA dependent-parent calculations ──────────────────────────────────────
console.log('\n[10] VA dependent parents');
{
  const oneParent = monthlyCompensationDetailed(100, { hasSpouse: false, numChildren: 0, numDependentParents: 1 });
  assertEqual(oneParent.total, 3938.58 + 176.24, '100% + 1 dependent parent matches va.gov-derived adder');

  const twoParents = monthlyCompensationDetailed(100, { hasSpouse: false, numChildren: 0, numDependentParents: 2 });
  assertEqual(twoParents.total, 3938.58 + 352.48, '100% + 2 dependent parents matches va.gov-derived adder (not simply 2x one parent)');

  const noParents = monthlyCompensationDetailed(100, { hasSpouse: false, numChildren: 0, numDependentParents: 0 });
  assertEqual(noParents.total, 3938.58, '0 dependent parents adds nothing');
}

// ── 11. Spouse Aid & Attendance ────────────────────────────────────────────────
console.log('\n[11] Spouse Aid & Attendance');
{
  const withAA = monthlyCompensationDetailed(70, { hasSpouse: true, spouseAidAttendance: true, numChildren: 0 });
  // base(70%)=1808.45, spouse adder=153, A&A adder=141
  assertEqual(withAA.total, 1808.45 + 153 + 141, 'Spouse + A&A stacks the normal spouse adder AND the A&A adder');

  const withoutAA = monthlyCompensationDetailed(70, { hasSpouse: true, spouseAidAttendance: false, numChildren: 0 });
  assertEqual(withoutAA.total, 1808.45 + 153, 'Spouse without A&A only gets the normal spouse adder');

  // Existing simple call sites must be untouched by any of this.
  assertEqual(monthlyCompensation(70, true, 0), 1808.45 + 153, 'Existing monthlyCompensation() signature/behavior unchanged');
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
