// ─── ICKAR API — Google Play Real-Time Developer Notifications (RTDN) webhook
// File: packages/api/src/routes/google-play.routes.js
//
// When a user subscribes via Google Play Billing, Google sends RTDN Pub/Sub
// messages to this endpoint. We verify the subscription and update entitlements.

import { Router } from 'express';

const router = Router();

/**
 * POST /api/webhooks/google-play
 *
 * Google Pub/Sub pushes a base64-encoded JSON message.
 * Message types we care about:
 *   SUBSCRIPTION_PURCHASED   → grant entitlement
 *   SUBSCRIPTION_RENEWED     → extend entitlement
 *   SUBSCRIPTION_CANCELED    → schedule expiry
 *   SUBSCRIPTION_EXPIRED     → revoke entitlement
 */
router.post('/', async (req, res) => {
  try {
    const pubsubMessage = req.body?.message;
    if (!pubsubMessage?.data) {
      return res.status(400).json({ error: 'Missing Pub/Sub message data' });
    }

    // Decode base64 Pub/Sub message
    const decoded = JSON.parse(
      Buffer.from(pubsubMessage.data, 'base64').toString('utf8')
    );

    const { subscriptionNotification, packageName } = decoded;

    if (!subscriptionNotification) {
      // Not a subscription event (could be test notification)
      return res.status(200).json({ received: true });
    }

    const {
      notificationType,
      purchaseToken,
      subscriptionId,
    } = subscriptionNotification;

    console.log('[GooglePlay RTDN]', {
      notificationType,
      subscriptionId,
      packageName,
      purchaseToken: purchaseToken?.slice(0, 20) + '…',
    });

    // Notification type constants
    // https://developer.android.com/google/play/billing/rtdn-reference
    const TYPES = {
      RECOVERED:         1,
      RENEWED:           2,
      CANCELED:          3,
      PURCHASED:         4,
      ON_HOLD:           5,
      IN_GRACE_PERIOD:   6,
      RESTARTED:         7,
      PRICE_CHANGE_CONF: 8,
      DEFERRED:          9,
      PAUSED:            10,
      PAUSE_SCHEDULE_CH: 11,
      REVOKED:           12,
      EXPIRED:           13,
    };

    switch (notificationType) {
      case TYPES.PURCHASED:
      case TYPES.RENEWED:
      case TYPES.RECOVERED:
      case TYPES.RESTARTED:
      case TYPES.IN_GRACE_PERIOD:
        // TODO: Call Google Play Developer API to verify token
        // then upsert Subscription record in DB → status: 'active'
        console.log('[GooglePlay] Grant/extend entitlement for token:', purchaseToken?.slice(0, 20));
        break;

      case TYPES.CANCELED:
      case TYPES.ON_HOLD:
      case TYPES.PAUSED:
        // TODO: Mark subscription as 'paused' or 'cancelling' in DB
        console.log('[GooglePlay] Subscription paused/cancelled');
        break;

      case TYPES.REVOKED:
      case TYPES.EXPIRED:
        // TODO: Revoke entitlement in DB
        console.log('[GooglePlay] Subscription expired/revoked');
        break;

      default:
        console.log('[GooglePlay] Unhandled notification type:', notificationType);
    }

    // Pub/Sub requires 2xx to acknowledge the message
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[GooglePlay RTDN] Error:', err);
    // Return 200 to prevent Pub/Sub from infinite retry on malformed message
    res.status(200).json({ error: 'Internal error but acknowledged' });
  }
});

export { router as googlePlayRouter };
