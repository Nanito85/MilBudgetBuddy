import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'expo-iap';
import { type PurchaseError } from 'expo-iap/build/utils/errorMapping';

import { IAP_PRODUCT_ID_MONTHLY, IAP_PRODUCT_ID_ANNUAL } from '@/constants/features';
import { useEntitlementStore } from '@/store/entitlement.store';
import { SubscriptionPlan } from '@/store/entitlement.store';

export const PRODUCT_IDS = [IAP_PRODUCT_ID_MONTHLY, IAP_PRODUCT_ID_ANNUAL];

let purchaseListener: ReturnType<typeof purchaseUpdatedListener> | null = null;
let errorListener:    ReturnType<typeof purchaseErrorListener>   | null = null;
let connected = false;

export async function initIAP(): Promise<void> {
  try {
    await initConnection();
    connected = true;

    purchaseListener = purchaseUpdatedListener(async (purchase: Purchase) => {
      if (purchase.transactionId || purchase.purchaseToken) {
        const plan: SubscriptionPlan =
          purchase.productId === IAP_PRODUCT_ID_ANNUAL ? 'annual' : 'monthly';
        useEntitlementStore.getState().completePurchase(plan);
        await finishTransaction({ purchase, isConsumable: false });
        useEntitlementStore.getState().checkServerEntitlement().catch(() => {});
      }
    });

    errorListener = purchaseErrorListener((error: PurchaseError) => {
      console.warn('[IAP] Purchase error:', error.code, error.message);
    });
  } catch (e) {
    console.warn('[IAP] initConnection failed:', e);
  }
}

export function destroyIAP(): void {
  purchaseListener?.remove();
  errorListener?.remove();
  purchaseListener = null;
  errorListener    = null;
  if (connected) { endConnection(); connected = false; }
}

export async function getIAPProducts() {
  if (!connected) return [];
  try {
    return await fetchProducts({ skus: PRODUCT_IDS, type: 'subs' });
  } catch {
    return [];
  }
}

export async function purchaseSubscription(plan: 'monthly' | 'annual'): Promise<boolean> {
  if (!connected) return false;
  const sku = plan === 'annual' ? IAP_PRODUCT_ID_ANNUAL : IAP_PRODUCT_ID_MONTHLY;
  try {
    await requestPurchase({
      request: { google: { skus: [sku] } },
      type: 'subs',
    });
    return true;
  } catch (e: any) {
    if (e?.code === ErrorCode.UserCancelled) return false;
    throw e;
  }
}

// Keep legacy export name so old call sites don't break
export async function purchasePro(): Promise<boolean> {
  return purchaseSubscription('monthly');
}

export async function restorePurchases(): Promise<boolean> {
  await useEntitlementStore.getState().checkServerEntitlement();
  return useEntitlementStore.getState().status === 'pro';
}
