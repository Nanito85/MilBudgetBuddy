// Free tier tool IDs — accessible without Pro
export const FREE_TOOL_IDS = new Set([
  'pay_chart',
  'bah_guide',
  'les',
  'pcs',
]);

// Budget: free users can set budgets for first N default categories
export const FREE_BUDGET_CATEGORY_LIMIT = 3;

// Kids: free users can add N child profiles
export const FREE_KIDS_LIMIT = 1;

// Early-adopter promo length (days from install)
export const PROMO_DAYS = 90;

// Google Play product ID (wire in iap.ts when Play Console is ready)
export const IAP_PRODUCT_ID = 'com.nanito85.milbudgetbuddy.pro_lifetime';

// Display price shown on upgrade screen
export const IAP_PRICE_DISPLAY = '$4.99';
