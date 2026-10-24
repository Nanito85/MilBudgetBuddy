import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { PayGrade } from '@/data/bah-rates';
import { calcLES, type LESBreakdown, type LESInputs } from '@/features/home/utils/lesCalc';
import { useUserStore } from '@/store/user.store';

export type ProfileLESInputs = Omit<LESInputs, 'payGrade'> & { payGrade?: PayGrade };

// Every calcLES input that comes from the member's profile, built in ONE
// place. Home, Budget, Command Mode, Car Loan, Savings Rate and Edit Pay each
// used to assemble this ~25-field list by hand, and they drifted: SBP was
// only ever added to Home's copy, so a retiree with SBP saw a higher
// take-home on Budget (and every other screen) than on Home. A new calcLES
// input only needs adding here now.
//
// Also one shallow-compared store subscription instead of ~25 separate
// selectors per screen; the returned object keeps the same identity until
// one of these fields actually changes, so it's safe as a memo dependency.
export function useProfileLESInputs(): ProfileLESInputs {
  const p = useUserStore(useShallow((s) => ({
    payGrade: s.payGrade,
    yos: s.yos,
    mhaZip: s.mhaZip,
    dutyStationId: s.dutyStationId,
    hasSpouse: s.hasSpouse,
    numChildren: s.numChildren,
    housingStatus: s.housingStatus,
    specialPays: s.specialPays,
    tspContribPct: s.tspContribPct,
    rothTspPct: s.rothTspPct,
    hasDentalFamily: s.hasDentalFamily,
    sglOptOut: s.sglOptOut,
    stateResidence: s.stateResidence,
    lesOverrides: s.lesOverrides,
    serviceStatus: s.serviceStatus,
    familySeparated: s.familySeparated,
    dependentsMhaZip: s.dependentsMhaZip,
    alsoGsCivilian: s.alsoGsCivilian,
    gsGrade: s.gsGrade,
    gsStep: s.gsStep,
    gsLocalityKey: s.gsLocalityKey,
    isDeployed: s.isDeployed,
    deploymentLocationId: s.deploymentLocationId,
    sbpEnabled: s.sbpEnabled,
    sbpCoveragePct: s.sbpCoveragePct,
    drillsPerMonth: s.drillsPerMonth,
    // Not set yet → a Guard member who marked Title 10 status is on federal
    // orders; everyone else defaults to drill-only.
    reserveOnOrders: s.reserveOnOrders ?? s.guardDutyStatus === 'title10',
  })));

  return useMemo(() => {
    const { specialPays, lesOverrides, ...rest } = p;
    return {
      ...rest,
      specialPaysTotal: specialPays.reduce((sum, sp) => sum + sp.monthlyAmount, 0),
      hostileFireTotal: specialPays.filter((sp) => sp.type === 'hostile_fire').reduce((sum, sp) => sum + sp.monthlyAmount, 0),
      overrides: lesOverrides,
    };
  }, [p]);
}

/** The member's own pay breakdown, or null until a pay grade is set. */
export function useProfileLES(): LESBreakdown | null {
  const inputs = useProfileLESInputs();
  return useMemo(
    () => (inputs.payGrade ? calcLES({ ...inputs, payGrade: inputs.payGrade }) : null),
    [inputs],
  );
}
