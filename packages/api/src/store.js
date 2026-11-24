// ============================================================
// ICKAR API — In-Memory Data Store
// ============================================================

import { v4 as uuidv4 } from 'uuid';

// ---- TIER CONFIG ----
// Tiers: 'free' | 'pro' | 'promax'
// Pro:    ₦2,000/mo — stream all content, no downloads
// ProMax: ₦3,000/mo — stream all + unlimited downloads
export const TIER_PRICES = { pro: 200000, promax: 300000 }; // kobo
export const DOWNLOAD_QUOTAS = { free: 3, pro: 15, promax: Infinity };

// ---- USERS ----
export const users = new Map(); // id -> user

export function createUser({ email, passwordHash, name, role = 'subscriber' }) {
  const id = uuidv4();
  const user = {
    id, email, passwordHash, name, role,
    tier: 'free',           // 'free' | 'pro' | 'promax'
    createdAt: new Date().toISOString()
  };
  users.set(id, user);
  return user;
}

export function findUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

export function findUserById(id) {
  return users.get(id) || null;
}

export function setUserTier(userId, tier) {
  const user = users.get(userId);
  if (!user) return null;
  user.tier = tier;
  return user;
}

// ---- MEDIA CATALOG ----
export const mediaCatalog = new Map([
  ['1', {
    id: '1',
    slug: 'wealth-of-the-digital-african',
    title: 'The Wealth of the Digital African',
    author: 'Dr. Emmanuel Adeyemi',
    narrator: 'Femi Williams',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    type: 'bundle',
    duration: '5h 24m',
    pages: 240,
    rating: 4.9,
    price: 3500,
    isSubscriptionIncluded: true,
    category: 'Business & Wealth',
    description: 'An eye-opening masterclass on digital sovereignty, creator monetization, and building lasting value across African markets.',
    hlsManifestKey: 'media/1/audio/index.m3u8',
    pdfKey: 'media/1/book/digital-african.pdf',
    createdAt: new Date().toISOString(),
  }],
  ['2', {
    id: '2',
    slug: 'kingdom-mind',
    title: 'Kingdom Mind: The Power of Purpose',
    author: 'Pastor Paul Johnson',
    narrator: 'Paul Johnson',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    type: 'audiobook',
    duration: '4h 12m',
    rating: 4.8,
    price: 2500,
    isSubscriptionIncluded: true,
    category: 'Faith & Leadership',
    description: 'Discover how to align personal ambition with divine purpose, building an unshakeable mindset for modern leadership.',
    hlsManifestKey: 'media/2/audio/index.m3u8',
    createdAt: new Date().toISOString(),
  }],
  ['3', {
    id: '3',
    slug: 'tech-dynasty-lagos',
    title: 'The Tech Dynasty of Lagos',
    author: 'Kemi Bello',
    coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=800',
    type: 'ebook',
    pages: 310,
    rating: 4.7,
    price: 2000,
    isSubscriptionIncluded: true,
    category: 'Technology',
    description: 'The untold narrative of startup founders navigating currency shifts, venture capital, and engineering triumphs in Yaba.',
    pdfKey: 'media/3/book/tech-dynasty.pdf',
    createdAt: new Date().toISOString(),
  }],
  ['4', {
    id: '4',
    slug: 'african-voices',
    title: 'African Voices: Poems of Resilience',
    author: 'Musa Danladi',
    narrator: 'Amina Sadiq',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800',
    type: 'audiobook',
    duration: '2h 45m',
    rating: 4.9,
    price: 1800,
    isSubscriptionIncluded: true,
    category: 'Culture & Arts',
    description: 'A rich compilation of spoken word and poetry celebrating heritage, strength, and the spirit of contemporary Africa.',
    hlsManifestKey: 'media/4/audio/index.m3u8',
    createdAt: new Date().toISOString(),
  }],
]);

// ---- ENTITLEMENTS ----
// Map: `${userId}:${mediaId}` -> entitlement object
export const entitlements = new Map();

export function grantEntitlement({ userId, mediaId, type = 'subscription', expiresAt = null }) {
  const key = `${userId}:${mediaId}`;
  const entitlement = { userId, mediaId, type, grantedAt: new Date().toISOString(), expiresAt };
  entitlements.set(key, entitlement);
  return entitlement;
}

export function checkEntitlement(userId, mediaId) {
  const key = `${userId}:${mediaId}`;
  const ent = entitlements.get(key);
  if (!ent) return false;
  if (ent.expiresAt && new Date(ent.expiresAt) < new Date()) return false;
  return true;
}

// ---- SUBSCRIPTIONS ----
export const subscriptions = new Map(); // userId -> subscription

// tier: 'pro' | 'promax'
export function activateSubscription(userId, paystackRef, tier = 'pro') {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const sub = { userId, paystackRef, tier, activatedAt: new Date().toISOString(), expiresAt, status: 'active' };
  subscriptions.set(userId, sub);
  setUserTier(userId, tier);
  // Grant entitlement on all subscription-included media
  for (const media of mediaCatalog.values()) {
    if (media.isSubscriptionIncluded) {
      grantEntitlement({ userId, mediaId: media.id, type: 'subscription', expiresAt });
    }
  }
  return sub;
}

export function getSubscription(userId) {
  return subscriptions.get(userId) || null;
}

// ---- ORDERS ----
export const orders = new Map();

export function createOrder({ userId, mediaId, amount, paystackRef }) {
  const id = uuidv4();
  const order = { id, userId, mediaId, amount, paystackRef, status: 'completed', createdAt: new Date().toISOString() };
  orders.set(id, order);
  return order;
}

// ---- DOWNLOAD QUOTA ----
// Key: `${userId}:${YYYY-MM-DD}` -> count
export const downloadCounts = new Map();

export function getTodayKey(userId) {
  const today = new Date().toISOString().slice(0, 10);
  return `${userId}:${today}`;
}

export function getDownloadCount(userId) {
  return downloadCounts.get(getTodayKey(userId)) || 0;
}

export function incrementDownloadCount(userId) {
  const key = getTodayKey(userId);
  const current = downloadCounts.get(key) || 0;
  downloadCounts.set(key, current + 1);
  return current + 1;
}

export function checkDownloadQuota(userId) {
  const user = findUserById(userId);
  if (!user) return { allowed: false, reason: "We couldn't find your account." };
  const tier = user.tier || 'free';
  const quota = DOWNLOAD_QUOTAS[tier];
  const used = getDownloadCount(userId);
  if (quota !== Infinity && used >= quota) {
    return { allowed: false, used, quota, tier, reason: "You've reached today's save limit." };
  }
  return { allowed: true, used, quota: quota === Infinity ? -1 : quota, tier };
}

// ---- ADMIN ANALYTICS ----
export function getAdminStats() {
  const totalOrders = orders.size;
  const totalUsers = users.size;
  const proSubs = [...subscriptions.values()].filter(s => s.status === 'active' && s.tier === 'pro').length;
  const promaxSubs = [...subscriptions.values()].filter(s => s.status === 'active' && s.tier === 'promax').length;
  const totalSubscribers = proSubs + promaxSubs;
  const monthlyGross = (proSubs * 2000) + (promaxSubs * 3000);
  const cloudBill = 68200; // simulated
  const creatorRoyalties = Math.round(monthlyGross * 0.20);
  const operatorFee = 400000;
  const netDistributable = monthlyGross - cloudBill - creatorRoyalties - operatorFee;

  return {
    totalUsers,
    totalSubscribers,
    totalOrders,
    proSubs,
    promaxSubs,
    monthlyGross,
    cloudBill,
    creatorRoyalties,
    operatorFee,
    netDistributable: Math.max(0, netDistributable),
    catalogCount: mediaCatalog.size,
  };
}
