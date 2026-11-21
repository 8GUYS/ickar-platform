// ─── ICKAR Mobile — Google Play Billing (react-native-iap) ───────────────────
// This module handles in-app subscriptions via Google Play Billing v5+
// and Apple StoreKit 2 (iOS).
// NOTE: react-native-iap requires a native build (EAS Build).
//       It will not work in Expo Go. Install before EAS build:
//       npm install react-native-iap
//
// Usage: import { useIAPSubscription } from '../services/billing'

import { useEffect, useCallback } from 'react';
// @ts-ignore — installed at EAS build time
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';
import type { SubscriptionPurchase, PurchaseError } from 'react-native-iap';
import { Platform } from 'react-native';
import { verifyPayment } from './api';

// ─── SKU IDs — must match exactly what you create in Play Console / App Store Connect
export const SUBSCRIPTION_SKUS = {
  android: 'ng.ickar.monthly_2500',
  ios:     'ng.ickar.monthly_2500',
};

export const MONTHLY_SKU =
  Platform.OS === 'android'
    ? SUBSCRIPTION_SKUS.android
    : SUBSCRIPTION_SKUS.ios;

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useIAPSubscription(
  onSuccess: () => void,
  onError: (msg: string) => void,
) {
  useEffect(() => {
    // Initialize billing connection
    initConnection().catch(() => onError('Could not connect to billing'));

    // Listen for successful purchases
    const purchaseUpdate = purchaseUpdatedListener(async (purchase: SubscriptionPurchase) => {
      const receipt = purchase.transactionReceipt;
      if (!receipt) return;

      try {
        // Verify on our backend (server-side receipt validation)
        await verifyPayment(purchase.transactionId ?? receipt);
        onSuccess();
      } catch {
        onError('Payment verification failed — contact support');
      }
    });

    // Listen for errors
    const purchaseError = purchaseErrorListener((err: PurchaseError) => {
      if (err.code !== 'E_USER_CANCELLED') {
        onError(err.message ?? 'Purchase failed');
      }
    });

    return () => {
      purchaseUpdate.remove();
      purchaseError.remove();
      endConnection();
    };
  }, [onSuccess, onError]);

  const subscribe = useCallback(async () => {
    try {
      const products = await getSubscriptions({ skus: [MONTHLY_SKU] });
      if (!products.length) {
        onError('Subscription product not found in store');
        return;
      }
      await requestSubscription({ sku: MONTHLY_SKU });
    } catch (err: any) {
      if (err.code !== 'E_USER_CANCELLED') {
        onError(err.message ?? 'Could not start purchase');
      }
    }
  }, [onError]);

  return { subscribe };
}
