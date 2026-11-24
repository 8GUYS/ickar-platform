// ============================================================
// ICKAR API — Universal Media Downloader
// POST /api/downloader/extract  — get metadata / resolve URL
// POST /api/downloader/stream   — stream file to browser
// GET  /api/downloader/quota    — check daily quota
//
// Social media (YouTube, TikTok, Instagram, Twitter/X, etc.)
//   → resolved via a Cobalt instance (COBALT_API_URL, optional COBALT_API_KEY)
// Direct links (.mp3 .mp4 .pdf etc.)
//   → piped directly through Node https
//
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

// ---- URL classifiers ----
const DIRECT_EXT = /\.(mp3|mp4|wav|ogg|m4a|aac|flac|webm|pdf|epub|mkv|avi|mov|zip)(\?.*)?$/i;

const SOCIAL_PATTERNS = [
  { name: 'YouTube',    re: /(?:youtube\.com|youtu\.be)/i },
  { name: 'TikTok',    re: /tiktok\.com/i },
  { name: 'Instagram', re: /instagram\.com/i },
  { name: 'Twitter',   re: /(?:twitter\.com|x\.com)/i },
  { name: 'Reddit',    re: /reddit\.com/i },
  { name: 'SoundCloud',re: /soundcloud\.com/i },
  { name: 'Vimeo',     re: /vimeo\.com/i },
  { name: 'Twitch',    re: /twitch\.tv/i },
  { name: 'Pinterest', re: /pinterest\.com/i },
  { name: 'Dailymotion', re: /dailymotion\.com/i },
];

function detectSource(urlStr) {
  for (const p of SOCIAL_PATTERNS) {
    if (p.re.test(urlStr)) return { type: 'social', platform: p.name };
  }
  if (DIRECT_EXT.test(urlStr)) {
    const ext = urlStr.match(DIRECT_EXT)?.[1]?.toLowerCase();
    return { type: 'direct', mediaType: mediaTypeForExt(ext), ext };
  }
  return { type: 'unknown' };
}

// ---- Cobalt API call ----
// Docs: https://github.com/imputnet/cobalt/blob/current/docs/api.md
// Public api.cobalt.tools requires auth, so point COBALT_API_URL at an instance you can use.
function cobaltEndpoint() {
  const raw = (process.env.COBALT_API_URL || 'https://api.cobalt.tools/').trim();
  return raw.endsWith('/') ? raw : `${raw}/`;
}

async function resolveCobalt(url) {
  const endpoint = new URL(cobaltEndpoint());
  const lib = endpoint.protocol === 'http:' ? http : https;
  const body = JSON.stringify({
    url,
    downloadMode: 'auto',
    filenameStyle: 'pretty',
  });
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'ICKAR/1.0 (https://ickar.ng)',
  };
  if (process.env.COBALT_API_KEY) {
    headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(endpoint, {
      method: 'POST',
      headers,
      timeout: 20000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, json });
        } catch {
          reject(new Error('Invalid JSON from Cobalt API'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Cobalt API timed out')); });
    req.write(body);
    req.end();
  });
}

// ---- Generic pipe helper ----
function fetchStream(urlString, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function doFetch(urlStr, left) {
      let parsed;
      try { parsed = new URL(urlStr); } catch { return reject(new Error('Invalid URL')); }
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(urlStr, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ICKARBot/1.0)' },
        timeout: 15000,
      }, (res) => {
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
          if (left <= 0) return reject(new Error('Too many redirects'));
          return doFetch(res.headers.location, left - 1);
        }
        resolve(res);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    }
    doFetch(urlString, maxRedirects);
  });
}

function deriveFilename(urlStr, platform, fallbackExt = 'mp4') {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = decodeURIComponent(parts[parts.length - 1] || '');
    if (last && last.includes('.')) return last;
    if (platform) return `${platform.toLowerCase()}-download-${Date.now()}.${fallbackExt}`;
    return `ickar-download-${Date.now()}`;
  } catch {
    return `ickar-download-${Date.now()}.${fallbackExt}`;
  }
}

function extFromName(name) {
  return String(name || '').split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || '';
}

function mediaTypeForExt(ext) {
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mkv', 'avi', 'mov', 'gif'].includes(ext)) return 'video';
  if (['pdf', 'epub'].includes(ext)) return 'document';
  return 'file';
}

function mediaTypeForItem(name, pickerType) {
  if (pickerType === 'photo') return 'file';
  if (pickerType === 'video' || pickerType === 'gif') return 'video';
  const ext = extFromName(name);
  if (!ext) return 'video';
  return mediaTypeForExt(ext);
}

function cobaltErrorMessage(json, platform) {
  const code = json?.error?.code || '';
  if (String(code).includes('auth')) {
    return "Saving from social apps isn't available right now. Try a direct file link.";
  }
  return `We couldn't get that from ${platform}.`;
}

function describeCobalt(json, platform) {
  if (!json || json.status === 'error' || json.error) {
    return { ok: false, message: cobaltErrorMessage(json, platform) };
  }

  if (json.status === 'picker') {
    const picker = (json.picker || []).filter((item) => item?.url).map((item, index) => {
      const ext = item.type === 'photo' ? 'jpg' : item.type === 'gif' ? 'gif' : 'mp4';
      const filename = item.filename || `${platform.toLowerCase()}-${index + 1}-${Date.now()}.${ext}`;
      return {
        url: item.url,
        type: item.type,
        filename,
        mediaType: mediaTypeForItem(filename, item.type),
      };
    });
    if (!picker.length) {
      return { ok: false, message: "We couldn't find a file in that post." };
    }
    const first = picker[0];
    return {
      ok: true,
      resolvedUrl: first.url,
      title: first.filename,
      filename: first.filename,
      mediaType: first.mediaType,
      picker,
      pickerCount: picker.length,
      note: picker.length > 1 ? `This post has ${picker.length} files. The first one is selected.` : undefined,
    };
  }

  const resolvedUrl = json.url;
  if (!resolvedUrl) {
    return { ok: false, message: "We couldn't get a file from that link." };
  }
  const filename = json.filename || deriveFilename(resolvedUrl, platform);
  return {
    ok: true,
    resolvedUrl,
    title: filename,
    filename,
    mediaType: mediaTypeForItem(filename),
    contentType: json.contentType,
  };
}

// ============================================================
// POST /api/downloader/extract
// Body: { url: string }
// Returns metadata + resolved download URL (never streams here)
// ============================================================
downloaderRouter.post('/extract', requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Add a link first.' });
  }

  let parsedUrl;
  try { parsedUrl = new URL(url); } catch {
    return res.status(400).json({ error: "That doesn't look like a link." });
  }

  const quotaCheck = checkDownloadQuota(req.user.id);
  const source = detectSource(url);

  // ---- Unknown URL type ----
  if (source.type === 'unknown') {
    return res.json({
      url, downloadable: false, quotaCheck,
      message: "We couldn't find a video, song, or file at that link.",
    });
  }

  // ---- Social media — resolve via Cobalt ----
  if (source.type === 'social') {
    try {
      const { json } = await resolveCobalt(url);
      const described = describeCobalt(json, source.platform);

      if (!described.ok) {
        return res.json({
          url, downloadable: false, quotaCheck,
          platform: source.platform,
          message: described.message,
        });
      }

      return res.json({
        url,
        resolvedUrl: described.resolvedUrl,
        title: described.title,
        filename: described.filename,
        platform: source.platform,
        mediaType: described.mediaType,
        contentType: described.contentType,
        downloadable: true,
        quotaCheck,
        picker: described.picker,
        pickerCount: described.pickerCount,
        note: described.note,
      });

    } catch (err) {
      return res.status(502).json({ error: "We couldn't reach the download service. Try again in a moment." });
    }
  }

  // ---- Direct link — HEAD to get metadata ----
  try {
    const response = await fetchStream(url);
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    response.destroy();

    const pathParts = parsedUrl.pathname.split('/');
    const filename = decodeURIComponent(pathParts[pathParts.length - 1] || 'download');

    return res.json({
      url,
      resolvedUrl: url,
      title: filename,
      filename,
      mediaType: source.mediaType,
      contentType,
      contentLength: contentLength ? parseInt(contentLength, 10) : null,
      downloadable: true,
      quotaCheck,
    });
  } catch (err) {
    return res.status(502).json({ error: "We couldn't open that link." });
  }
});

// ============================================================
// POST /api/downloader/stream
// Body: { url: string, resolvedUrl?: string, filename?: string }
// Streams the file to browser as attachment — quota enforced here
// ============================================================
downloaderRouter.post('/stream', requireAuth, async (req, res) => {
  const { url, resolvedUrl, filename } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Add a link first.' });
  }

  // Enforce quota
  const quotaCheck = checkDownloadQuota(req.user.id);
  if (!quotaCheck.allowed) {
    return res.status(429).json({
      error: "You've reached today's save limit.",
      ...quotaCheck,
      upgradeTip: quotaCheck.tier === 'free'
        ? 'Pro includes 15 saves a day.'
        : 'Pro Max has no daily cap.',
    });
  }

  // Decide which URL to actually stream
  let streamUrl = resolvedUrl || url;
  let dlFilename = filename;

  // If no resolvedUrl was provided and it's a social URL, resolve now
  if (!resolvedUrl) {
    const source = detectSource(url);
    if (source.type === 'social') {
      try {
        const { json } = await resolveCobalt(url);
        const described = describeCobalt(json, source.platform);
        if (!described.ok) {
          return res.status(502).json({ error: described.message });
        }
        streamUrl = described.resolvedUrl;
        dlFilename = dlFilename || described.filename;
      } catch (err) {
        return res.status(502).json({ error: "We couldn't reach the download service. Try again in a moment." });
      }
    }
  }

  if (!dlFilename) {
    dlFilename = deriveFilename(streamUrl, null);
  }

  // Increment quota BEFORE streaming
  incrementDownloadCount(req.user.id);

  try {
    const response = await fetchStream(streamUrl);

    if (response.statusCode && response.statusCode >= 400) {
      return res.status(502).json({ error: "That file isn't available right now." });
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${dlFilename}"`);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('X-ICKAR-Quota-Used', String(quotaCheck.used + 1));
    res.setHeader('X-ICKAR-Quota-Limit', quotaCheck.quota === -1 ? 'unlimited' : String(quotaCheck.quota));

    response.pipe(res);
    response.on('error', (err) => {
      console.error('[DOWNLOADER] Stream error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: "The download didn't finish. Try again." });
    });

  } catch (err) {
    console.error('[DOWNLOADER] Fetch error:', err.message);
    return res.status(502).json({ error: "The download didn't finish. Try again." });
  }
});

// ============================================================
// GET /api/downloader/quota
// ============================================================
downloaderRouter.get('/quota', requireAuth, (req, res) => {
  const quotaCheck = checkDownloadQuota(req.user.id);
  const user = findUserById(req.user.id);
  return res.json({ tier: user?.tier || 'free', ...quotaCheck });
});
