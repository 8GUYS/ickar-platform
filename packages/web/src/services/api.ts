const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  author: string;
  narrator?: string;
  coverUrl: string;
  type: 'audiobook' | 'ebook' | 'bundle';
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
  monthlyGross: number;
  cloudBill: number;
  creatorRoyalties: number;
  operatorFee: number;
  netDistributable: number;
  catalogCount: number;
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

// Simulate Payment / Webhook in Dev
export async function verifyPaymentDev(type: 'subscription' | 'purchase', mediaId?: string, token?: string) {
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
