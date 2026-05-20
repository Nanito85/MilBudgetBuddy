import { Alert } from 'react-native';

import { IAP_PRICE_DISPLAY, IAP_PRODUCT_ID } from '@/constants/features';
import { useEntitlementStore } from '@/store/entitlement.store';

// Stub IAP service.
// When ready to submit to Play Store:
//   1. Run: npx expo install expo-iap
//   2. Wire purchasePro/restorePurchases to expo-iap calls using IAP_PRODUCT_ID
//   3. Remove the simulation Alert
//
// Product ID: IAP_PRODUCT_ID (com.nanito85.milbudgetbuddy.pro_lifetime)

export async function purchasePro(): Promise<boolean> {
  // TODO: Replace with real IAP:
  // import { getProducts, requestPurchase } from 'expo-iap';
  // await requestPurchase({ sku: IAP_PRODUCT_ID });
  return new Promise((resolve) => {
    Alert.alert(
      `Upgrade to Pro — ${IAP_PRICE_DISPLAY}`,
      'Google Play billing will be connected before the app ships to the Play Store. Tap "Simulate" to test the Pro experience now.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Simulate Purchase',
          onPress: () => {
            useEntitlementStore.getState().completePurchase();
            resolve(true);
          },
        },
      ],
    );
  });
}

export async function restorePurchases(): Promise<boolean> {
  // TODO: Replace with real IAP restore call
  return new Promise((resolve) => {
    Alert.alert(
      'Restore Purchases',
      'No previous purchase found. (Play billing will be connected at launch.)',
      [{ text: 'OK', onPress: () => resolve(false) }],
    );
  });
}

// Suppress unused warning during development
void IAP_PRODUCT_ID;
