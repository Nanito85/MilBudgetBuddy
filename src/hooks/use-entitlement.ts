import { getFlags } from '@/constants/features';
import { useEntitlementStore } from '@/store/entitlement.store';

export function useEntitlement() {
  const status          = useEntitlementStore((s) => s.status);
  const daysLeftInTrial = useEntitlementStore((s) => s.daysLeftInTrial);
  const subscriptionPlan = useEntitlementStore((s) => s.subscriptionPlan);
  const proGrantedUntil  = useEntitlementStore((s) => s.proGrantedUntil);
  const isPro    = status === 'pro';
  const isTrial  = status === 'trial';
  const flags    = getFlags();

  // Discount-code grant active?
  const isCodeGrant = isPro && proGrantedUntil != null && new Date(proGrantedUntil).getTime() > Date.now();

  return {
    isPro,
    isTrial,
    isPromo: isTrial,           // legacy alias used in older screens
    status,
    subscriptionPlan,
    isCodeGrant,
    daysLeft: daysLeftInTrial(),
    canUseTool: (id: string) => isPro || isTrial || flags.freeToolIds.has(id),
    budgetCategoryLimit: (isPro || isTrial) ? Infinity : flags.freeBudgetCategoryLimit,
    kidsLimit:           (isPro || isTrial) ? Infinity : flags.freeKidsLimit,
  };
}
