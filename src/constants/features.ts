// Google Play subscription product IDs (must match Play Console exactly)
export const IAP_PRODUCT_ID_MONTHLY = 'mbb_pro_monthly';
export const IAP_PRODUCT_ID_ANNUAL  = 'mbb_pro_annual';

// Pricing displayed on the upgrade screen
export const IAP_PRICE_MONTHLY = '$4.99';
export const IAP_PRICE_ANNUAL  = '$49.99';
export const IAP_PRICE_ANNUAL_MONTHLY = '$4.17'; // $49.99 / 12 rounded

// Legacy single-ID export kept for any leftover references
export const IAP_PRODUCT_ID    = IAP_PRODUCT_ID_MONTHLY;
export const IAP_PRICE_DISPLAY = IAP_PRICE_MONTHLY;

// ─── Local fallback defaults ──────────────────────────────────────────────────
// These are overridden at runtime by remote config from /api/config.
const DEFAULTS = {
  freeToolIds: ['pay_chart', 'bah_guide', 'les', 'pcs'],
  freeBudgetCategoryLimit: 3,
  freeKidsLimit: 1,
  promoDays: 30,   // 30-day free trial
};

export function getFlags() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getRemoteConfig } = require('@/services/remote-config') as typeof import('@/services/remote-config');
  const rc = getRemoteConfig().featureFlags;
  return {
    freeToolIds: new Set<string>(rc.freeToolIds ?? DEFAULTS.freeToolIds),
    freeBudgetCategoryLimit: rc.freeBudgetCategoryLimit ?? DEFAULTS.freeBudgetCategoryLimit,
    freeKidsLimit: rc.freeKidsLimit ?? DEFAULTS.freeKidsLimit,
    promoDays: rc.promoDays ?? DEFAULTS.promoDays,
  };
}

export const FREE_TOOL_IDS             = new Set(DEFAULTS.freeToolIds);
export const FREE_BUDGET_CATEGORY_LIMIT = DEFAULTS.freeBudgetCategoryLimit;
export const FREE_KIDS_LIMIT           = DEFAULTS.freeKidsLimit;
export const PROMO_DAYS                = DEFAULTS.promoDays;
