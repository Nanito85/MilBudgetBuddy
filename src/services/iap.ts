import { Platform } from 'react-native';

import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// Must match the subscription product IDs configured in Google Play Console
// and App Store Connect exactly — these are store-side identifiers, not
// something this app can rename on its own.
export const PRO_MONTHLY_SKU = 'milbudgetbuddy_pro_monthly';
export const PRO_ANNUAL_SKU  = 'milbudgetbuddy_pro_annual';
export const PRO_SKUS = [PRO_MONTHLY_SKU, PRO_ANNUAL_SKU];

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
