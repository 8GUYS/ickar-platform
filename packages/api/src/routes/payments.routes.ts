import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../auth.js';
import { prisma } from '../db.js';

export const paymentsRouter = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';

// POST /api/payments/initialize
paymentsRouter.post('/initialize', requireAuth, async (req: any, res) => {
  const { type, mediaId, amount } = req.body;

  if (!['subscription', 'purchase'].includes(type)) {
    return res.status(400).json({ error: 'Invalid payment type' });
  }

  const user = req.user;
  const paystackAmount = type === 'subscription' ? 250000 : amount * 100; // kobo
  const reference = `ickar_${type}_${user.id}_${Date.now()}`;

  return res.json({
    reference,
    checkoutUrl: `https://checkout.paystack.com/simulated?ref=${reference}`,
    amount: paystackAmount,
    type,
    mediaId: mediaId || null,
  });
});

// POST /api/payments/verify-dev (Sprint Development Simulation)
paymentsRouter.post('/verify-dev', requireAuth, async (req: any, res) => {
  const { type, mediaId } = req.body;
  const userId = req.user.id;
  const fakeRef = `dev_pay_${Date.now()}`;

  try {
    if (type === 'subscription') {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Upsert subscription
      const sub = await prisma.subscription.upsert({
        where: { userId },
        update: {
          paystackRef: fakeRef,
          status: 'active',
          expiresAt,
        },
        create: {
          userId,
          paystackRef: fakeRef,
          status: 'active',
          expiresAt,
        },
      });

      // Grant entitlements to all subscription titles
      const subscriptionMedia = await prisma.mediaItem.findMany({
        where: { isSubscriptionIncluded: true },
        select: { id: true },
      });

      for (const media of subscriptionMedia) {
        await prisma.entitlement.upsert({
          where: {
            userId_mediaItemId: { userId, mediaItemId: media.id },
          },
          update: { expiresAt },
          create: {
            userId,
            mediaItemId: media.id,
            accessType: 'SUBSCRIPTION',
            expiresAt,
          },
        });
      }

      return res.json({ success: true, subscription: sub, message: 'Subscription successfully unlocked.' });
    }

    if (type === 'purchase' && mediaId) {
      const media = await prisma.mediaItem.findUnique({
        where: { id: mediaId },
      });

      if (!media) return res.status(404).json({ error: 'Media not found' });

      // Grant permanent entitlement
      await prisma.entitlement.upsert({
        where: {
          userId_mediaItemId: { userId, mediaItemId: media.id },
        },
        update: { accessType: 'PURCHASE', expiresAt: null },
        create: {
          userId,
          mediaItemId: media.id,
          accessType: 'PURCHASE',
          expiresAt: null,
        },
      });

      return res.json({ success: true, message: 'Permanent access entitlement granted.' });
    }

    return res.status(400).json({ error: 'Invalid parameters' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Failed to verify payment transaction' });
  }
});

// GET /api/payments/entitlement/:mediaId — check access
paymentsRouter.get('/entitlement/:mediaId', requireAuth, async (req: any, res) => {
  try {
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_mediaItemId: {
          userId: req.user.id,
          mediaItemId: req.params.mediaId,
        },
      },
    });

    if (!entitlement) return res.json({ mediaId: req.params.mediaId, hasAccess: false });

    if (entitlement.expiresAt && new Date(entitlement.expiresAt) < new Date()) {
      return res.json({ mediaId: req.params.mediaId, hasAccess: false, reason: 'expired' });
    }

    return res.json({ mediaId: req.params.mediaId, hasAccess: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to check entitlement status' });
  }
});
