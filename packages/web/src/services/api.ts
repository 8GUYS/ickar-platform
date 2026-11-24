const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

export type UserTier = 'free' | 'pro' | 'promax';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: UserTier;
}

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  author: string;
  narrator?: string;
  coverUrl: string;
  type: 'audiobook' | 'ebook' | 'bundle' | 'video' | 'podcast';
  duration?: string;
  pages?: number;
  rating: number;
  price: number;
  isSubscriptionIncluded: boolean;
  category: string;
  description: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSubscribers: number;
  totalOrders: number;
  proSubs: number;
  promaxSubs: number;
  monthlyGross: number;
  cloudBill: number;
  creatorRoyalties: number;
  operatorFee: number;
  netDistributable: number;
  catalogCount: number;
}

export interface QuotaInfo {
  allowed: boolean;
  used: number;
  quota: number; // -1 means unlimited
  tier: UserTier;
  reason?: string;
}

export interface MediaExtractResult {
  url: string;
  title: string;
  mediaType: 'audio' | 'video' | 'document' | 'youtube' | 'unknown';
  contentType: string;
  contentLength: number | null;
  filename: string;
  downloadable: boolean;
  quotaCheck: QuotaInfo;
  message?: string;
}

// Fetch Catalog
export async function getCatalog(query = '', category = '', type = ''): Promise<{ items: CatalogItem[]; total: number }> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);
  if (type) params.append('type', type);

  const res = await fetch(`${API_BASE}/catalog?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch catalog');
  return res.json();
}

// Check Entitlement
export async function checkEntitlement(mediaId: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/payments/entitlement/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.hasAccess;
}

// Get Signed Streaming Token
export async function getStreamingToken(mediaId: string, token: string): Promise<{ audioStreamUrl?: string; pdfAccessUrl?: string; expiresAt?: number; expiresInSeconds?: number; error?: string }> {
  const res = await fetch(`${API_BASE}/stream/token/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to acquire streaming token');
  }
  return res.json();
}

// Activate subscription tier (dev simulate)
export async function verifyPaymentDev(type: 'pro' | 'promax' | 'purchase', mediaId?: string, token?: string) {
  const res = await fetch(`${API_BASE}/payments/verify-dev`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type, mediaId })
  });
  if (!res.ok) throw new Error('Payment processing failed');
  return res.json();
}

// Admin Stats
export async function getAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Admin stats restricted');
  return res.json();
}

// --- DOWNLOADER ---

export async function extractMediaInfo(url: string, token: string): Promise<MediaExtractResult> {
  const res = await fetch(`${API_BASE}/downloader/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ url })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to extract media info');
  }
  return res.json();
}

export async function getDownloadQuota(token: string): Promise<QuotaInfo & { tier: UserTier }> {
  const res = await fetch(`${API_BASE}/downloader/quota`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch quota');
  return res.json();
}

// Returns the URL to use for direct download via the API proxy
export function getDownloadStreamUrl(_url: string, _filename: string): string {
  return `${API_BASE}/downloader/stream`;
}

export async function downloadMedia(url: string, filename: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/downloader/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ url, filename })
  });

  if (res.status === 429) {
    const data = await res.json();
    throw new Error(data.error + (data.upgradeTip ? `\n${data.upgradeTip}` : ''));
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Download failed');
  }

  // Stream blob to browser download
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename || 'ickar-download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

