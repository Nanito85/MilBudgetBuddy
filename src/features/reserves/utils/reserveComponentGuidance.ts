/**
 * Branch/component-aware guidance for the Reserve Hub (app/reserves.tsx).
 *
 * Only the Army and Air Force have a federal National Guard (Army National
 * Guard, Air National Guard) — Navy, Marine Corps, and Coast Guard have
 * Reserve components only, with no Guard equivalent. reserveComponent/
 * guardDutyStatus (see types/user.types.ts) are therefore only ever set
 * (and only ever meaningful) for those two branches.
 *
 * Pulled out of app/reserves.tsx into its own utils module (matching this
 * codebase's convention — lesCalc.ts, tricareCalc.ts, deploymentCalc.ts,
 * etc. — of keeping pure calculation/guidance logic separate from screen
 * components) so scripts/verify-calculations.ts can import it directly
 * without pulling in expo-router's screen module.
 */
import { GUARD_DUTY_STATUS_LABELS, GuardDutyStatus, MilitaryBranch, ReserveComponent } from '@/types/user.types';

const GUARD_ELIGIBLE_BRANCHES: MilitaryBranch[] = ['army', 'air_force'];

export type GuardStatusKnowledge =
  | { kind: 'not_guard_branch' }   // branch known and has no Guard option (or branch not yet set)
  | { kind: 'reserve_component' }  // Army/Air Force, but member picked Reserve (not Guard)
  | { kind: 'guard_unknown' }      // Guard, but current duty status not set yet
  | { kind: 'guard_known'; status: GuardDutyStatus };

export function classifyGuardStatus(
  branch: MilitaryBranch | undefined,
  component: ReserveComponent | undefined,
  dutyStatus: GuardDutyStatus | undefined,
): GuardStatusKnowledge {
  if (!branch || !GUARD_ELIGIBLE_BRANCHES.includes(branch)) return { kind: 'not_guard_branch' };
  if (component !== 'guard') return { kind: 'reserve_component' };
  if (!dutyStatus) return { kind: 'guard_unknown' };
  return { kind: 'guard_known', status: dutyStatus };
}

// Terminology for a drill period genuinely varies by branch/component (not
// just by unit) — Army Reserve calls it a "Battle Assembly," Army/Air
// National Guard and the rest of Air Force say "UTA," and Navy/Marine
// Corps/Coast Guard more commonly just say "drill weekend."
export function drillTermFor(branch: MilitaryBranch | undefined): string {
  if (branch === 'army') return 'known in the Army Reserve as a "Battle Assembly" (BA), or a "UTA" in the Army National Guard';
  if (branch === 'air_force') return 'called a "UTA" (Unit Training Assembly) in both the Air Force Reserve and Air National Guard';
  if (branch === 'navy' || branch === 'marines' || branch === 'coast_guard') return 'usually just called a "drill weekend" rather than a UTA';
  return 'called a "UTA," "Battle Assembly," or simply a "drill weekend" depending on your branch';
}

// IDT Travel Reimbursement Program (IDT-TRP) eligibility genuinely differs
// by branch and, for the National Guard, by state — not just fuzzy sourcing.
export function idtTravelGuidanceFor(branch: MilitaryBranch | undefined, component: ReserveComponent | undefined): string {
  if (component === 'guard') return 'Army/Air National Guard components set their own IDT travel policy at the state level, separate from the federal Reserve programs below — check with your state J1/G1 for your state\'s current threshold and funding.';
  if (branch === 'army') return 'Army Reserve runs an IDT Travel Reimbursement Program (IDT-TRP) for members living 150+ miles from their unit, subject to prior authorization and an annual funding cap.';
  if (branch === 'air_force') return 'Air Force Reserve runs its own IDT Travel Reimbursement Program for members living 150+ miles from their unit, subject to prior authorization and an annual funding cap.';
  if (branch === 'navy') return 'Navy Reserve does not fund an equivalent program for routine IDT travel — sailors generally do not get mileage reimbursement for regular drill.';
  if (branch === 'marines' || branch === 'coast_guard') return 'Marine Corps Reserve and Coast Guard Reserve each set their own separate IDT travel policy — check your unit admin for current guidance rather than assuming the Army/AFR 150-mile figure applies.';
  return 'This genuinely varies by branch — confirmed: Army Reserve and Air Force Reserve both use a 150-mile threshold; Navy Reserve funds no equivalent program; Marine Corps Reserve, Coast Guard Reserve, and the National Guard components each set their own policy. Set your branch in your profile for guidance specific to you.';
}

// Selected Reserve Incentive Pay (SRIP) / affiliation & reenlistment bonuses
// are set independently per branch (and by MOS/rating/AFSC, and by fiscal
// year) — no single number applies everywhere, but where a current program
// is confirmed it's worth naming rather than only saying "it varies."
export function sripGuidanceFor(branch: MilitaryBranch | undefined): string {
  if (branch === 'army') return 'Army Reserve\'s SRIP program has offered up to ~$20,000 for a 6-year enlistment in a critical MOS — restricted to specific critical skills/unit vacancies the Army updates every fiscal year.';
  if (branch === 'navy') return 'Navy Reserve\'s Selective Reenlistment Bonus (SRB) caps career-total payments at $80,000, restricted to ratings the Navy currently considers critical.';
  if (branch === 'air_force') return 'Air Force Reserve runs its own annual Officer/Enlisted Incentive Bonus Program for critical AFSCs, with amounts reset each fiscal year.';
  return 'Bonus/incentive-pay programs (SRIP, affiliation and reenlistment bonuses) are set independently by each branch — and, for the National Guard, sometimes by state — restricted to specific critical skills and fiscal-year funding. Check your own service\'s current SRIP/incentives policy rather than assuming a single number.';
}

// Deterministic, member-specific guidance for the one area where Guard
// duty status genuinely changes the answer: TRICARE eligibility, SCRA
// coverage, and federal retirement-point crediting. Reserve components
// (Army Reserve, Navy Reserve, AFRC, SMCR, Coast Guard Reserve) have no
// Title 32/SAD equivalent — their activations are always federal Title 10
// duty, so all three questions below have one settled answer for them.
export function tricareGuardMessage(k: GuardStatusKnowledge): string {
  switch (k.kind) {
    case 'not_guard_branch':
    case 'reserve_component':
      return 'Your component has no Title 32/State Active Duty distinction — activation for you is federal Title 10 duty, so the TRICARE rules above apply the same as any activated reservist.';
    case 'guard_unknown':
      return 'As a Guard member, your TRICARE eligibility during activation depends on your orders: Title 10 and qualifying Title 32 (30+ days) carry TRICARE; pure State Active Duty (SAD) does not. Set your current duty status in your profile for a specific answer.';
    case 'guard_known':
      return k.status === 'sad'
        ? 'Your current status is State Active Duty (SAD) — this does NOT come with TRICARE. You\'d be covered under your state\'s own workers\' comp/benefits program instead, which varies by state.'
        : `Your current status (${GUARD_DUTY_STATUS_LABELS[k.status]}) carries the same TRICARE eligibility as any other activated reservist.`;
  }
}

export function scraGuardMessage(k: GuardStatusKnowledge): string {
  switch (k.kind) {
    case 'not_guard_branch':
    case 'reserve_component':
      return 'Your component has no Title 32/SAD distinction — your activations are federal Title 10 duty, so SCRA protections apply normally once you\'re on orders.';
    case 'guard_unknown':
      return 'As a Guard member, SCRA coverage depends on your orders: it applies on Title 10 duty and Title 32 §502(f) call-ups of 30+ consecutive days, but NOT on State Active Duty (SAD) or routine drill. Set your current duty status in your profile for a specific answer.';
    case 'guard_known':
      return k.status === 'sad'
        ? 'Your current status is State Active Duty (SAD) — SCRA protections do NOT apply. Check whether your state has its own service-member protection statute instead; terms vary by state.'
        : `Your current status (${GUARD_DUTY_STATUS_LABELS[k.status]}) is covered by SCRA.`;
  }
}

export function retirementPointsGuardMessage(k: GuardStatusKnowledge): string {
  switch (k.kind) {
    case 'not_guard_branch':
    case 'reserve_component':
      return 'Your component has no Title 32/SAD distinction — all your qualifying duty is federally creditable toward this retirement.';
    case 'guard_unknown':
      return 'As a Guard member: federal Title 32 duty (annual training, or a federally funded §502(f) call-up) and Title 10 duty both count toward this retirement; pure State Active Duty (SAD) does not. Set your current duty status in your profile for a specific answer.';
    case 'guard_known':
      return k.status === 'sad'
        ? 'Your current status is State Active Duty (SAD) — points earned under SAD orders do NOT count toward this federal retirement. Confirm with your state J1/G1 whether any of your current duty is separately, federally creditable.'
        : `Your current status (${GUARD_DUTY_STATUS_LABELS[k.status]}) is federally creditable toward this retirement, same as any other qualifying reserve duty.`;
  }
}

export function mobilizationGuardMessage(k: GuardStatusKnowledge): string {
  switch (k.kind) {
    case 'not_guard_branch':
      return 'Your branch has no Title 32/State Active Duty option — mobilization for you is always federal Title 10 active duty, so everything below (BAH, TRICARE, SCRA, TSP matching) applies in full once you\'re on orders.';
    case 'reserve_component':
      return 'You\'re Reserve, not Guard — mobilization for you is always federal Title 10 active duty, so everything below applies in full once you\'re on orders.';
    case 'guard_unknown':
      return 'As a Guard member, what you actually get depends on your orders. Title 10 federal active duty and qualifying Title 32 orders (30+ days) carry everything below. Pure State Active Duty (SAD) — governor-activated, state-funded — carries NONE of it: no federal TRICARE, no SCRA, no federal retirement-point credit; pay and benefits are set by your state instead. Set your current duty status in your profile so this tab can speak to your actual situation.';
    case 'guard_known':
      return k.status === 'sad'
        ? 'Your current status is State Active Duty (SAD). The pay estimate below is a rough federal-equivalent reference only — in reality, SAD does not carry TRICARE, SCRA, or federal retirement-point credit, and your actual pay/benefits are set by your state.'
        : `Your current status (${GUARD_DUTY_STATUS_LABELS[k.status]}) carries the same federal pay and benefits as any other mobilized reservist — everything below applies to you.`;
  }
}
