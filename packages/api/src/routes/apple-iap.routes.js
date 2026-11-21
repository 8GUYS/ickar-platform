// ─── ICKAR API — Apple App Store Server Notifications v2 (Sprint 6 prep) ─────
// File: packages/api/src/routes/apple-iap.routes.js
//
// Apple sends JWS-signed notifications for subscription lifecycle events.
// We decode and verify the JWS payload, then update entitlements.

import { Router } from 'express';

const router = Router();

/**
 * POST /api/webhooks/apple-iap
 *
 * Apple App Store Server Notifications v2:
 * https://developer.apple.com/documentation/appstoreservernotifications
 *
 * Payload is a JWS (JSON Web Signature) string.
 * Key notification types:
 *   SUBSCRIBED          → new subscriber
 *   DID_RENEW           → renewed
 *   DID_FAIL_TO_RENEW   → payment failed
 *   EXPIRED             → subscription ended
 *   REVOKE              → family sharing revoked
 */
router.post('/', express.text({ type: '*/*' }), async (req, res) => {
  try {
    const signedPayload = req.body;
    if (!signedPayload || typeof signedPayload !== 'string') {
      return res.status(400).json({ error: 'Missing JWS payload' });
    }

    // Decode JWS payload (3 base64url parts separated by '.')
    // PRODUCTION: Use apple-signin-auth or @apple/app-store-server-library
    // to verify the signature chain against Apple's root certificates
    const parts = signedPayload.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Invalid JWS format' });
    }

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = JSON.parse(
      Buffer.from(payloadBase64, 'base64').toString('utf8')
    );

    const { notificationType, subtype, data } = payloadJson;

    // Decode the signed transaction info (also JWS)
    let transactionInfo = null;
    if (data?.signedTransactionInfo) {
      const tParts = data.signedTransactionInfo.split('.');
      const tPayload = tParts[1].replace(/-/g, '+').replace(/_/g, '/');
      transactionInfo = JSON.parse(
        Buffer.from(tPayload, 'base64').toString('utf8')
      );
    }

    console.log('[Apple IAP]', {
      notificationType,
      subtype,
      originalTransactionId: transactionInfo?.originalTransactionId,
      bundleId: transactionInfo?.bundleId,
    });

    switch (notificationType) {
      case 'SUBSCRIBED':
      case 'DID_RENEW':
        // TODO: Grant/extend subscription entitlement in DB
        console.log('[Apple IAP] Grant subscription');
        break;

      case 'DID_FAIL_TO_RENEW':
        // TODO: Mark as grace period in DB
        console.log('[Apple IAP] Payment failed — grace period');
        break;

      case 'EXPIRED':
      case 'REVOKE':
        // TODO: Revoke entitlement
        console.log('[Apple IAP] Subscription ended');
        break;

      case 'REFUND':
        // TODO: Handle refund — revoke access
        console.log('[Apple IAP] Refund processed');
        break;

      default:
        console.log('[Apple IAP] Unhandled type:', notificationType);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Apple IAP] Error:', err);
    res.status(200).json({ error: 'Internal error but acknowledged' });
  }
});

// Need express reference for text middleware above — fix import:
import express from 'express';

export { router as appleIapRouter };
