// Type stubs for react-native-iap — installed at EAS build time.
// This file allows TypeScript to compile without the native package.
declare module 'react-native-iap' {
  export interface SubscriptionPurchase {
    transactionReceipt?: string;
    transactionId?: string;
  }
  export interface PurchaseError {
    code?: string;
    message?: string;
  }
  export interface Subscription {
    productId: string;
  }
  export interface EmitterSubscription {
    remove(): void;
  }
  export function initConnection(): Promise<boolean>;
  export function endConnection(): Promise<void>;
  export function getSubscriptions(opts: { skus: string[] }): Promise<Subscription[]>;
  export function requestSubscription(opts: { sku: string }): Promise<SubscriptionPurchase>;
  export function purchaseUpdatedListener(cb: (purchase: SubscriptionPurchase) => void): EmitterSubscription;
  export function purchaseErrorListener(cb: (err: PurchaseError) => void): EmitterSubscription;
}
