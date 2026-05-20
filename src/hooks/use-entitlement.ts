import {
  FREE_BUDGET_CATEGORY_LIMIT,
  FREE_KIDS_LIMIT,
  FREE_TOOL_IDS,
} from '@/constants/features';
import { useEntitlementStore } from '@/store/entitlement.store';

export function useEntitlement() {
  const status = useEntitlementStore((s) => s.status);
  const daysLeftInPromo = useEntitlementStore((s) => s.daysLeftInPromo);
  const isPro = status === 'pro' || status === 'promo';

  return {
    isPro,
    isPromo: status === 'promo',
    status,
    daysLeft: daysLeftInPromo(),
    canUseTool: (id: string) => isPro || FREE_TOOL_IDS.has(id),
    budgetCategoryLimit: isPro ? Infinity : FREE_BUDGET_CATEGORY_LIMIT,
    kidsLimit: isPro ? Infinity : FREE_KIDS_LIMIT,
  };
}
