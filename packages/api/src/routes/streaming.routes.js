import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../auth.js';
import { mediaCatalog, checkEntitlement } from '../store.js';

export const streamingRouter = Router();

const SIGNED_URL_SECRET = process.env.JWT_SECRET || 'ickar_dev_secret';
const TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes

// -------------------------------------------------------
// GET /api/stream/token/:mediaId
// Issues a short-lived signed streaming token (HMAC-SHA256)
// Only issued if the user has a valid entitlement
// -------------------------------------------------------
streamingRouter.get('/token/:mediaId', requireAuth, (req, res) => {
  const { mediaId } = req.params;
  const userId = req.user.id;

  const media = mediaCatalog.get(mediaId);
  if (!media) return res.status(404).json({ error: 'Media not found' });

  const hasAccess = checkEntitlement(userId, mediaId);
  if (!hasAccess) {
    return res.status(403).json({
      error: 'No active entitlement for this title',
      action: 'Subscribe at ₦2,500/month or purchase this title to access',
    });
  }

  if (!media.hlsManifestKey && !media.pdfKey) {
    return res.status(400).json({ error: 'No streamable media file for this title' });
  }

  // Build a signed payload
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  const payload = { userId, mediaId, expiresAt };
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', SIGNED_URL_SECRET)
    .update(payloadStr)
    .digest('hex');

  const token = Buffer.from(payloadStr).toString('base64url');

  // In production: generate a Cloudflare R2 pre-signed URL here using the actual storage key
  // For Sprint 1 MVP: return a simulated CDN URL structure
  const cdnBase = 'https://cdn.ickar.ng';
  const signedAudioUrl = media.hlsManifestKey
    ? `${cdnBase}/${media.hlsManifestKey}?token=${token}&sig=${signature}&exp=${expiresAt}`
    : null;
  const signedPdfUrl = media.pdfKey
    ? `${cdnBase}/${media.pdfKey}?token=${token}&sig=${signature}&exp=${expiresAt}`
    : null;

  return res.json({
    mediaId,
    expiresAt,
    expiresInSeconds: TOKEN_EXPIRY_SECONDS,
    audioStreamUrl: signedAudioUrl,
    pdfAccessUrl: signedPdfUrl,
    message: 'Token valid for 15 minutes. Re-request on expiry.',
  });
});
