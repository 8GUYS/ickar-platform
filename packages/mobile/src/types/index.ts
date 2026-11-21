// ─── ICKAR Mobile — Shared Types ─────────────────────────────────────────────

export type MediaType = 'audiobook' | 'ebook' | 'pdf';

export interface MediaItem {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  type: MediaType;
  priceKobo: number;      // e.g. 250000 = ₦2,500
  durationMin?: number;   // audiobooks only
  pageCount?: number;     // ebooks/PDFs only
  tenantId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'trial';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface Entitlement {
  mediaItemId: string;
  source: 'subscription' | 'purchase';
  expiresAt?: string;
}

export interface StreamToken {
  token: string;
  url: string;
  expiresAt: number;
}

// ─── Navigation types ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  Home: undefined;
  MediaDetail: { item: MediaItem };
  Player: { item: MediaItem; streamUrl: string };
  Library: undefined;
  Profile: undefined;
  Auth: { mode?: 'login' | 'register' };
};
