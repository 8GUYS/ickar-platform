// ─── ICKAR Mobile — API Service ───────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MediaItem, User, Entitlement, StreamToken } from '../types';

// In dev: use local API. In prod: replace with your Render/Railway URL
const BASE_URL = __DEV__
  ? 'http://10.0.2.2:3001'   // Android emulator → host machine localhost
  : 'https://api.ickar.ng';

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('ickar_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(opts.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await AsyncStorage.setItem('ickar_access_token', data.token);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const data = await request<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  await AsyncStorage.setItem('ickar_access_token', data.token);
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem('ickar_access_token');
}

export async function getMe(): Promise<User> {
  return request<User>('/api/auth/me');
}

// ─── Catalog ───────────────────────────────────────────────────────────────────
export async function getCatalog(): Promise<MediaItem[]> {
  return request<MediaItem[]>('/api/catalog');
}

export async function getMediaItem(id: string): Promise<MediaItem> {
  return request<MediaItem>(`/api/catalog/${id}`);
}

// ─── Entitlements & Streaming ──────────────────────────────────────────────────
export async function checkEntitlement(mediaItemId: string): Promise<{ entitled: boolean; entitlement?: Entitlement }> {
  return request(`/api/payments/entitlement/${mediaItemId}`);
}

export async function getStreamingToken(mediaItemId: string): Promise<StreamToken> {
  return request(`/api/catalog/${mediaItemId}/stream`);
}

// ─── Paystack subscription ─────────────────────────────────────────────────────
export async function initiateSubscription(): Promise<{ authorizationUrl: string; reference: string }> {
  return request('/api/payments/subscribe', { method: 'POST' });
}

export async function verifyPayment(reference: string): Promise<{ success: boolean }> {
  return request('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });
}
