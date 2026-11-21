import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../auth.js';
import {
  checkEntitlement,
  mediaCatalog,
  activateSubscription,
  createOrder,
  grantEntitlement,
} from '../store.js';

export const paymentsRouter = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';

// -------------------------------------------------------
// POST /api/payments/initialize
// Called by frontend to get a Paystack checkout URL
// -------------------------------------------------------
paymentsRouter.post('/initialize', requireAuth, async (req, res) => {
  const { type, mediaId, amount } = req.body; // type: 'subscription' | 'purchase'

  if (!['subscription', 'purchase'].includes(type)) {
    return res.status(400).json({ error: 'Invalid payment type. Must be subscription or purchase.' });
  }

  if (type === 'purchase' && !mediaId) {
    return res.status(400).json({ error: 'mediaId required for one-off purchase' });
  }

  const user = req.user;
  const paystackAmount = type === 'subscription' ? 250000 : (amount * 100); // Paystack uses kobo

  // In production: call Paystack API to initialize transaction
  // For Sprint 1 MVP, return a simulation token
  const simulatedRef = `ickar_${type}_${user.id}_${Date.now()}`;

  return res.json({
    reference: simulatedRef,
    checkoutUrl: `https://checkout.paystack.com/simulated?ref=${simulatedRef}`,
    amount: paystackAmount,
    type,
    mediaId: mediaId || null,
    message: 'Transaction initialized. Redirect user to checkoutUrl.',
  });
});

// -------------------------------------------------------
// POST /api/payments/webhook
// Paystack sends POST to this endpoint after payment
// In production: validate X-Paystack-Signature header
// -------------------------------------------------------
paymentsRouter.post('/webhook', (req, res) => {
  // Signature verification (production guard)
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (req.headers['x-paystack-signature'] !== hash) {
    // In dev/test mode: skip signature check but log the warning
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    console.warn('[WEBHOOK] ⚠️ Signature mismatch (bypassed in dev mode)');
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { reference, metadata, customer, amount } = event.data;
    const { userId, type, mediaId } = metadata || {};

    if (!userId || !type) {
      console.error('[WEBHOOK] Missing metadata in webhook payload');
      return res.sendStatus(200); // Always return 200 to Paystack
    }

    if (type === 'subscription') {
      activateSubscription(userId, reference);
      console.log(`[WEBHOOK] ✅ Subscription activated for user ${userId}`);
    }

    if (type === 'purchase' && mediaId) {
      createOrder({ userId, mediaId, amount: amount / 100, paystackRef: reference });
      grantEntitlement({ userId, mediaId, type: 'purchase' });
      console.log(`[WEBHOOK] ✅ Purchase order created for user ${userId}, media ${mediaId}`);
    }
  }

  return res.sendStatus(200); // Always return 200 to Paystack
});

// -------------------------------------------------------
// POST /api/payments/verify-dev (DEV ONLY — simulate payment)
// Allows manual testing without real Paystack webhook
// -------------------------------------------------------
paymentsRouter.post('/verify-dev', requireAuth, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { type, mediaId } = req.body;
  const userId = req.user.id;
  const fakeRef = `dev_${Date.now()}`;

  if (type === 'subscription') {
    const sub = activateSubscription(userId, fakeRef);
    return res.json({ success: true, subscription: sub, message: 'Dev subscription activated' });
  }

  if (type === 'purchase' && mediaId) {
    const media = mediaCatalog.get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    const order = createOrder({ userId, mediaId, amount: media.price, paystackRef: fakeRef });
    grantEntitlement({ userId, mediaId, type: 'purchase' });
    return res.json({ success: true, order, message: 'Dev purchase completed and entitlement granted' });
  }

  return res.status(400).json({ error: 'Invalid request body' });
});

// GET /api/payments/entitlement/:mediaId — check if current user can access a title
paymentsRouter.get('/entitlement/:mediaId', requireAuth, (req, res) => {
  const hasAccess = checkEntitlement(req.user.id, req.params.mediaId);
  return res.json({ mediaId: req.params.mediaId, hasAccess });
});
