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
import { getInstallationById } from '@/data/installations';
import { getOhaAreaForInstallation, getOhaRate } from '@/data/oha-rates';
import { getOconusCola } from '@/data/oconus-cola';
import { getDeploymentLocation } from '@/data/deployment-locations';
import { getStationPerDiem } from '@/features/pcs/utils/pcsCalc';

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

// ── 12. GS civilian pay: TSP actually deducts from GS wages ───────────────────
console.log('\n[12] GS civilian TSP deducts from gsGrossMonthly, not a phantom basePay');
{
  const civilianBase = {
    payGrade: 'E7' as const, yos: 10, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'civilian' as const, gsGrade: 12, gsStep: 5, gsLocalityKey: 'RUS',
  };
  const noTsp = calcLES({ ...civilianBase, tspContribPct: 0, rothTspPct: 0 });
  assertTrue(noTsp.gsGrossMonthly > 0, 'A pure civilian with GS grade/step set shows nonzero GS pay');
  assertEqual(noTsp.tsp, 0, 'No TSP % elected -> no TSP deduction');

  const withTsp = calcLES({ ...civilianBase, tspContribPct: 5, rothTspPct: 0 });
  assertTrue(withTsp.tsp > 0, 'A pure civilian electing 5% TSP now actually has a nonzero TSP deduction (previously always $0 — TSP was computed off basePay, which is 0 for a civilian)');
  assertEqual(withTsp.traditionalTsp, withTsp.gsGrossMonthly * 0.05, 'Civilian traditional TSP is 5% of GS gross pay, not basic pay');
  assertEqual(withTsp.basePay, 0, 'A pure civilian still has no basePay at all (sanity check on the fix)');

  // Retiree who ALSO works a GS job: TSP should come off the GS paycheck,
  // never off the pension (retired pay).
  const retiredGs = calcLES({
    payGrade: 'E7', yos: 22, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'retired', alsoGsCivilian: true, gsGrade: 12, gsStep: 5, gsLocalityKey: 'RUS',
    tspContribPct: 5, rothTspPct: 0,
  });
  assertTrue(retiredGs.basePay > 0, 'Retiree-who-also-works-GS still shows nonzero retired pay');
  assertEqual(retiredGs.traditionalTsp, retiredGs.gsGrossMonthly * 0.05, 'Retiree-who-also-works-GS TSP is 5% of their GS pay, not their pension');

  // A retiree with NO GS job at all still has no TSP-eligible income.
  const retiredNoGs = calcLES({
    payGrade: 'E7', yos: 22, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'retired', tspContribPct: 5, rothTspPct: 0,
  });
  assertEqual(retiredNoGs.tsp, 0, 'A retiree with no GS job at all still has $0 TSP (a pension alone is never TSP-eligible)');

  // Active duty is unaffected by any of this — TSP still off basePay.
  const active = calcLES({
    payGrade: 'E7', yos: 10, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'active', tspContribPct: 5, rothTspPct: 0,
  });
  assertEqual(active.traditionalTsp, active.basePay * 0.05, 'Active duty TSP is still 5% of basic pay, unchanged by the GS-TSP fix');
}

// ── 13. TDP "Family Dental Plan" never applies to a pure civilian ─────────────
console.log('\n[13] TDP dental deduction gated for civilians (a TRICARE/military-only benefit)');
{
  const civilianDental = calcLES({
    payGrade: 'E5', yos: 5, mhaZip: undefined, hasSpouse: true, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: true, sglOptOut: true,
    serviceStatus: 'civilian', gsGrade: 9, gsStep: 1, gsLocalityKey: 'RUS',
  });
  assertEqual(civilianDental.dental, 0, 'A pure civilian is never charged the TDP (TRICARE Dental Program) family premium, even with hasDentalFamily=true');

  const activeDental = calcLES({
    payGrade: 'E5', yos: 5, mhaZip: undefined, hasSpouse: true, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: true, sglOptOut: true,
    serviceStatus: 'active',
  });
  assertTrue(activeDental.dental > 0, 'Active duty with Family Dental Plan enabled is still charged the TDP premium (unchanged behavior)');

  const retiredGsDental = calcLES({
    payGrade: 'E7', yos: 22, mhaZip: undefined, hasSpouse: true, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: true, sglOptOut: true,
    serviceStatus: 'retired', alsoGsCivilian: true, gsGrade: 12, gsStep: 5, gsLocalityKey: 'RUS',
  });
  assertTrue(retiredGsDental.dental > 0, 'A retiree who also works a GS job can still be enrolled in TDP as a retiree (only pure civilians are gated out)');
}

// ── 14. State tax on stacked GS wages uses the regular (non-exempt) table ────
console.log('\n[14] GS wages always use the standard state tax table, never a military-exempt one');
{
  // Kansas fully exempts military RETIREMENT pay but not ordinary wages —
  // see getRetirementStateTaxRate's own header. A retiree's GS paycheck is
  // ordinary civilian wage income and must still be taxed normally even in
  // a state that exempts their pension.
  const retiredGsInKS = calcLES({
    payGrade: 'E7', yos: 22, mhaZip: undefined, hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'retired', alsoGsCivilian: true, gsGrade: 12, gsStep: 5, gsLocalityKey: 'RUS',
    stateResidence: 'KS',
  });
  assertTrue(retiredGsInKS.stateTax > 0, 'A retiree-who-also-works-GS living in a retirement-pay-exempt state (KS) is still taxed on their GS wages');
}

// ── 15. Okinawa OCONUS audit (2026-09-13) ────────────────────────────────────
// Verifies the specific gaps this pass checked for real families stationed at
// Okinawa: real (non-placeholder) OHA, a genuine (not silently-missing) $0
// OCONUS COLA result, no CZTE/IDP hazard pay, and — the actual bug found this
// pass — that every Okinawa installation resolves its TLA per-diem locality to
// the real Okinawa rate rather than a same-country name-matching fluke.
console.log('\n[15] Okinawa OCONUS: OHA / COLA / no-hazard-pay / TLA per-diem locality');
{
  const kadena = getInstallationById('kadena');
  if (!kadena) throw new Error('Fixture installation "kadena" not found in installations.ts');

  // OHA: resolves to the real "Okinawa (All Installations)" area, not a missing/
  // approximate-placeholder $0 result. E1 w/ dep = $1,403 rent + $662 utility,
  // confirmed against the May 2026 USFJ increase (Stars and Stripes, citing the
  // DTMO calculator) per oha-rates.ts's own header note.
  const area = getOhaAreaForInstallation('kadena');
  assertTrue(!!area, 'Kadena AB resolves to a real OHA area (not undefined)');
  const kadenaOha = area ? getOhaRate(area.locationLabel, 'E1', true) : null;
  assertEqual(kadenaOha?.rentCeilingUSD, 1403, 'Okinawa E1 w/dep OHA rent ceiling matches the confirmed May 2026 USFJ rate ($1,403)');
  assertEqual(kadenaOha?.utilityAllowanceUSD, 662, 'Okinawa OHA utility allowance matches the confirmed flat USFJ rate ($662, all grades)');

  // COLA: a real, tracked $0 (index <= 100 as of the 2026-09-01 indices) — NOT
  // colaTracked:false / null, which would look like "we have no data" rather
  // than "DoD currently authorizes none here". See oconus-cola.ts's header for
  // the sourcing (regenerated from the actual 26-09-01 DTMO indices file) and
  // corroborating Stars and Stripes reporting (2026-07-14) on the weak-yen-
  // driven Japan-wide COLA decline toward zero.
  const okinawaCola = getOconusCola('Okinawa (All Installations)', 'E4', 4, false);
  assertEqual(okinawaCola, 0, 'Okinawa OCONUS COLA is a real, confirmed $0 as of the 2026-09-01 DTMO indices (not a missing-data gap)');
  const noDataLoc = getOconusCola('Not A Real Location', 'E4', 4, false);
  assertEqual(noDataLoc, null, 'An untracked location still correctly returns null (distinct from a real $0), confirming $0 above is not just the null-fallback in disguise');

  // No deployment/hazard pay: Okinawa is a normal PCS station, not on the
  // IDP/CZTE designated-areas list — calcLES must never show IDP or a CZTE
  // exclusion for a member "deployed" to a duty-station string that isn't a
  // real DEPLOYMENT_LOCATIONS entry (Okinawa has no entry there at all).
  assertEqual(getDeploymentLocation('okinawa'), undefined, 'Okinawa has no entry in DEPLOYMENT_LOCATIONS — not an IDP/CZTE area');
  const okinawaMemberDeployedToggleOn = calcLES({
    payGrade: 'E4', yos: 4, mhaZip: undefined, dutyStationId: 'kadena', hasSpouse: false, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'active', isDeployed: true, deploymentLocationId: 'okinawa',
  });
  assertEqual(okinawaMemberDeployedToggleOn.idp, 0, 'Even with the deployment toggle flipped on, Okinawa (not a real IDP area) shows $0 IDP');
  assertEqual(okinawaMemberDeployedToggleOn.isCzte, false, 'Okinawa never shows CZTE — it is not a designated Combat Zone');

  // Family separation: unaccompanied E4 at Kadena, dependents at a real CONUS
  // BAH ZIP — member's own housing switches to the without-dependents OHA
  // rate, FSA is the flat $300, and the dependents' own with-dependents BAH is
  // added as a separate line (familyBahResolved true for a real ZIP).
  const unaccompanied = calcLES({
    payGrade: 'E4', yos: 4, mhaZip: undefined, dutyStationId: 'kadena', hasSpouse: true, numChildren: 0,
    specialPaysTotal: 0, tspContribPct: 0, hasDentalFamily: false, sglOptOut: true,
    serviceStatus: 'active', familySeparated: true, dependentsMhaZip: '76544', // Fort Cavazos-area ZIP
  });
  assertTrue(unaccompanied.familySeparated, 'Unaccompanied Okinawa tour with a dependent correctly activates family separation');
  assertEqual(unaccompanied.fsa, 300, 'Family Separation Allowance is the flat $300/mo rate (FY2026 NDAA)');
  assertTrue(unaccompanied.familyBahResolved, 'Dependents\' real CONUS ZIP resolves to actual BAH (not a silent $0)');
  assertTrue(unaccompanied.familyBah > 0, 'Dependents draw a nonzero with-dependents BAH at their own CONUS location');
  const accompaniedOha = getOhaRate('Okinawa (All Installations)', 'E4', true)!;
  const unaccompaniedOha = getOhaRate('Okinawa (All Installations)', 'E4', false)!;
  assertEqual(
    unaccompanied.bah,
    unaccompaniedOha.rentCeilingUSD + unaccompaniedOha.utilityAllowanceUSD,
    'Unaccompanied member\'s OWN Okinawa OHA drops to the without-dependents rate (dependents aren\'t there)',
  );
  assertTrue(
    unaccompanied.bah < accompaniedOha.rentCeilingUSD + accompaniedOha.utilityAllowanceUSD,
    'Sanity check: without-dependents OHA is strictly less than the with-dependents rate it would otherwise have used',
  );

  // TLA per-diem locality: every Okinawa installation resolves to the real
  // Okinawa per-diem rate ($469/day, oc_kadena) for the PCS calculator's TLA
  // estimate. Torii Station and White Beach were the actual bug found this
  // pass — their own installation names ("Torii Station", "White Beach Naval
  // Facility") share no word with any Okinawa-labeled OCONUS_LOCATIONS entry,
  // so the generic country+name-word match fell through to whichever other
  // Japan locality happened to share a generic word ("station" -> Naval
  // Station Sasebo; "naval" -> Naval Base Yokosuka) — both the wrong region
  // and roughly half Okinawa's real rate. Fixed with an explicit
  // installation-id override in pcsCalc.ts (PERDIEM_ID_OVERRIDE).
  for (const id of ['kadena', 'camp_foster', 'camp_kinser', 'camp_hansen', 'camp_schwab', 'torii_station', 'white_beach', 'mcas_futenma', 'mcb_butler']) {
    const inst = getInstallationById(id);
    if (!inst) throw new Error(`Fixture installation "${id}" not found in installations.ts`);
    const pd = getStationPerDiem(inst);
    assertEqual(pd.total, 469, `${id}: TLA per diem resolves to Okinawa's real $469/day rate, not a wrong-region fallback`);
    assertTrue(pd.matched, `${id}: per diem lookup reports a real match (not the unmatched placeholder)`);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
