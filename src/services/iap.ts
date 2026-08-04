import { Platform } from 'react-native';

import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// ── Store-side product identifiers ──────────────────────────────────────────
// Android (Google Play): pricing lives one level below the product, as "base
// plans" — a single product can offer multiple billing periods. This app's
// Play Console listing has ONE subscription product ("mbb_pro_monthly") with
// two base plans under it, not two separate products.
export const ANDROID_PRODUCT_ID = 'mbb_pro_monthly';
export const ANDROID_BASE_PLAN_MONTHLY = 'mbb-pro-monthly-base';
export const ANDROID_BASE_PLAN_ANNUAL  = 'mbb-pro-annual-base';

// iOS (App Store Connect): no base-plan concept — each billing period is its
// own product, confirmed matching the IDs actually configured in App Store
// Connect (same names as the Android product, just no base-plan nesting).
export const IOS_MONTHLY_SKU = 'mbb_pro_monthly';
export const IOS_ANNUAL_SKU  = 'mbb_pro_annual';

// The full set of store product IDs to fetch, per platform.
export const PRO_SKUS =
  Platform.OS === 'ios' ? [IOS_MONTHLY_SKU, IOS_ANNUAL_SKU] : [ANDROID_PRODUCT_ID];

export interface VerifyPurchaseResponse {
  proExpiresAt: string; // ISO 8601
}

/**
 * Sends a completed purchase to the backend for server-side verification
 * against Google Play / the App Store — the client's own claim of "I bought
 * this" is never trusted directly. On success, the backend has already
 * written proExpiresAt to this user's Firestore profile; the returned value
 * lets the UI update immediately without waiting on the next sync tick.
 */
export async function verifyPurchaseWithServer(purchaseToken: string, productId: string): Promise<VerifyPurchaseResponse> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to verify a purchase.');

  const res = await fetch(`${API_BASE}/api/iap/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      productId,
      purchaseToken,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Verification failed (${res.status})`);
  }

  return res.json();
}

export interface RedeemCodeResponse {
  proExpiresAt: string; // ISO 8601
}

/**
 * Redeems an admin-issued promo/discount code for Pro access. Grants access
 * for the code's configured duration — see admin/codes.tsx for how codes are
 * created. Server-side only; the client never grants access on its own.
 */
export async function redeemPromoCode(code: string): Promise<RedeemCodeResponse> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to redeem a code.');

  const res = await fetch(`${API_BASE}/api/codes/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ code: code.toUpperCase().trim() }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Could not redeem code (${res.status})`);
  }

  return res.json();
}
