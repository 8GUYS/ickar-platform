// ============================================================
// ICKAR API — Universal Media Downloader
// POST /api/downloader/extract  — get metadata for a URL
// GET  /api/downloader/stream   — stream file to browser
// Quota: free=3/day, pro=15/day, promax=unlimited
// ============================================================

import { Router } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { requireAuth } from '../auth.js';
import {
  checkDownloadQuota,
  incrementDownloadCount,
  findUserById,
} from '../store.js';

export const downloaderRouter = Router();

// Supported platforms for metadata extraction
const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const DIRECT_REGEX = /\.(mp3|mp4|wav|ogg|m4a|aac|flac|webm|pdf|epub|mkv)(\?.*)?$/i;

function detectMediaType(url) {
  const ext = url.match(/\.([a-z0-9]+)(\?.*)?$/i)?.[1]?.toLowerCase();
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) return 'video';
  if (['pdf', 'epub'].includes(ext)) return 'document';
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  return 'unknown';
}

function fetchWithRedirects(urlString, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function doFetch(urlStr, redirectsLeft) {
      const parsedUrl = new URL(urlStr);
      const lib = parsedUrl.protocol === 'https:' ? https : http;
      const req = lib.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ICKARBot/1.0)',
        },
        timeout: 15000,
      }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
          doFetch(res.headers.location, redirectsLeft - 1);
        } else {
          resolve(res);
        }
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    }
    doFetch(urlString, maxRedirects);
  });
}

// -------------------------------------------------------
// POST /api/downloader/extract
// Body: { url: string }
// Returns: { title, mediaType, contentType, contentLength, downloadable, quota }
// -------------------------------------------------------
downloaderRouter.post('/extract', requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Check quota before doing any work
  const quotaCheck = checkDownloadQuota(req.user.id);

  const mediaType = detectMediaType(url);

  if (mediaType === 'youtube') {
    return res.json({
      title: 'YouTube video',
      mediaType: 'youtube',
      downloadable: false,
      quotaCheck,
      message: 'YouTube direct download is not supported. Please use a direct media URL (mp3, mp4, etc).',
    });
  }

  if (mediaType === 'unknown' && !DIRECT_REGEX.test(url)) {
    return res.json({
      title: parsedUrl.hostname,
      mediaType: 'unknown',
      downloadable: false,
      quotaCheck,
      message: 'Could not detect a downloadable media file at this URL. Try pasting a direct .mp3, .mp4, or .pdf link.',
    });
  }

  try {
    // HEAD request to get metadata
    const response = await fetchWithRedirects(url);
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    // Abort HEAD-equivalent (we just needed headers)
    response.destroy();

    // Derive a filename from URL
    const pathParts = parsedUrl.pathname.split('/');
    const filename = decodeURIComponent(pathParts[pathParts.length - 1] || 'download');

    return res.json({
      url,
      title: filename,
      mediaType,
      contentType,
      contentLength: contentLength ? parseInt(contentLength, 10) : null,
      filename,
      downloadable: true,
      quotaCheck,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach that URL', detail: err.message });
  }
});

// -------------------------------------------------------
// POST /api/downloader/stream
// Body: { url: string, filename?: string }
// Streams the file directly to the client as an attachment
// -------------------------------------------------------
downloaderRouter.post('/stream', requireAuth, async (req, res) => {
  const { url, filename } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Check and enforce quota
  const quotaCheck = checkDownloadQuota(req.user.id);
  if (!quotaCheck.allowed) {
    return res.status(429).json({
      error: 'Download quota exceeded',
      ...quotaCheck,
      upgradeTip: quotaCheck.tier === 'free'
        ? 'Upgrade to Pro (₦2,000/mo) for 15 downloads/day'
        : 'Upgrade to Pro Max (₦3,000/mo) for unlimited downloads',
    });
  }

  // Increment BEFORE streaming (prevents abuse on slow connections)
  incrementDownloadCount(req.user.id);

  try {
    const response = await fetchWithRedirects(url);

    if (response.statusCode && response.statusCode >= 400) {
      return res.status(502).json({ error: `Remote server returned ${response.statusCode}` });
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];

    // Derive filename
    let dlFilename = filename;
    if (!dlFilename) {
      const pathParts = parsedUrl.pathname.split('/');
      dlFilename = decodeURIComponent(pathParts[pathParts.length - 1] || 'ickar-download');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${dlFilename}"`);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('X-ICKAR-Quota-Used', quotaCheck.used + 1);
    res.setHeader('X-ICKAR-Quota-Limit', quotaCheck.quota === -1 ? 'unlimited' : quotaCheck.quota);

    // Pipe directly to response — zero disk usage
    response.pipe(res);

    response.on('error', (err) => {
      console.error('[DOWNLOADER] Stream error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Stream failed' });
    });

  } catch (err) {
    console.error('[DOWNLOADER] Fetch error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch media', detail: err.message });
  }
});

// GET /api/downloader/quota — check current user's download quota
downloaderRouter.get('/quota', requireAuth, (req, res) => {
  const quotaCheck = checkDownloadQuota(req.user.id);
  const user = findUserById(req.user.id);
  return res.json({
    tier: user?.tier || 'free',
    ...quotaCheck,
  });
});
