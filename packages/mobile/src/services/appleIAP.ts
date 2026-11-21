// Apple StoreKit 2 via expo-in-app-purchases (EAS build only)
// Stubs gracefully in Expo Go
import { Platform } from 'react-native';
import { verifyPayment } from './api';

const APPLE_PRODUCT_ID = 'ng.ickar.monthly_2500';

let IAP: any = null;
try {
  if (Platform.OS === 'ios') IAP = require('expo-in-app-purchases');
} catch {}

export async function initAppleIAP() {
  if (!IAP) return;
  await IAP.connectAsync();
}

export async function purchaseAppleSubscription(
  onSuccess: () => void,
  onError: (msg: string) => void,
) {
  if (!IAP) { onError('In-app purchases not available'); return; }
  try {
    await IAP.getProductsAsync([APPLE_PRODUCT_ID]);
    const { responseCode, results } = await IAP.purchaseItemAsync(APPLE_PRODUCT_ID);
    if (responseCode === IAP.IAPResponseCode.OK && results?.length) {
      const receipt = results[0].transactionReceipt;
      await verifyPayment(receipt);
      await IAP.finishTransactionAsync(results[0], true);
      onSuccess();
    }
  } catch (err: any) {
    onError(err.message ?? 'Purchase failed');
  }
}

export async function restoreApplePurchases(onSuccess: () => void) {
  if (!IAP) return;
  try {
    await IAP.getPurchaseHistoryAsync();
    onSuccess();
  } catch {}
}
