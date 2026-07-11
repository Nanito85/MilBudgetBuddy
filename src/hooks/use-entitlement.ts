import { getFlags } from '@/constants/features';
import { useEntitlementStore } from '@/store/entitlement.store';

export function useEntitlement() {
  const status          = useEntitlementStore((s) => s.status);
  const subscriptionPlan = useEntitlementStore((s) => s.subscriptionPlan);
  const proGrantedUntil  = useEntitlementStore((s) => s.proGrantedUntil);
  const isPro    = status === 'pro';
  const flags    = getFlags();

  // Discount-code grant active?
  const isCodeGrant = isPro && proGrantedUntil != null && new Date(proGrantedUntil).getTime() > Date.now();

  return {
    isPro,
    status,
    subscriptionPlan,
    isCodeGrant,
    canUseTool: (id: string) => isPro || flags.freeToolIds.has(id),
    budgetCategoryLimit: isPro ? Infinity : flags.freeBudgetCategoryLimit,
    kidsLimit:           isPro ? Infinity : flags.freeKidsLimit,
  };
}
