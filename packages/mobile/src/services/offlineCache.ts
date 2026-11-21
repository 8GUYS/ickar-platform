// ─── ICKAR Mobile — Offline Audio Cache (Sprint 5) ───────────────────────────
// Downloads audio to local storage for offline playback.
// Uses expo-file-system v2 class-based API + expo-secure-store.

import { File, Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { getStreamingToken } from './api';

// Cache directory inside the document store (safe from OS cleanup)
const cacheDir = new Directory(Paths.document, 'ickar_cache');

export interface CachedTrack {
  mediaItemId: string;
  localUri: string;    // file:// URI
  cachedAt: number;
  expiresAt: number;
  sizeBytes: number;
}

// ─── Ensure cache directory exists ──────────────────────────────────────────
function ensureCacheDir() {
  if (!cacheDir.exists) cacheDir.create();
}

// ─── Cache index (stored in SecureStore as JSON) ─────────────────────────────
const CACHE_INDEX_KEY = 'ickar_cache_index_v2';

async function getCacheIndex(): Promise<Record<string, CachedTrack>> {
  const raw = await SecureStore.getItemAsync(CACHE_INDEX_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveCacheIndex(index: Record<string, CachedTrack>) {
  await SecureStore.setItemAsync(CACHE_INDEX_KEY, JSON.stringify(index));
}

// ─── Download a track for offline listening ──────────────────────────────────
export async function downloadTrack(
  mediaItemId: string,
  onProgress?: (progress: number) => void,
): Promise<CachedTrack> {
  ensureCacheDir();

  const { url, expiresAt } = await getStreamingToken(mediaItemId);
  const dest = new File(cacheDir, `${mediaItemId}.m4a`);

  // Use File.downloadFileAsync — built-in progress callback
  const task = File.downloadFileAsync(url, dest, {});

  // Monitor progress if callback provided
  if (onProgress) {
    const interval = setInterval(async () => {
      try {
        const progress = await (task as unknown as { getProgress(): Promise<number> }).getProgress?.();
        if (typeof progress === 'number') onProgress(progress);
      } catch { /* ignore */ }
    }, 500);
    task.finally(() => clearInterval(interval));
  }

  await task;

  const info = dest.info();
  const sizeBytes = (info as { size?: number }).size ?? 0;

  const track: CachedTrack = {
    mediaItemId,
    localUri: dest.uri,
    cachedAt: Date.now(),
    expiresAt: expiresAt ? expiresAt * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000,
    sizeBytes,
  };

  const index = await getCacheIndex();
  index[mediaItemId] = track;
  await saveCacheIndex(index);
  return track;
}

// ─── Get cached track (returns null if expired or not cached) ────────────────
export async function getCachedTrack(mediaItemId: string): Promise<CachedTrack | null> {
  const index = await getCacheIndex();
  const track = index[mediaItemId];
  if (!track) return null;

  if (Date.now() > track.expiresAt) {
    await deleteTrack(mediaItemId);
    return null;
  }

  const file = new File(cacheDir, `${mediaItemId}.m4a`);
  if (!file.exists) {
    delete index[mediaItemId];
    await saveCacheIndex(index);
    return null;
  }

  return track;
}

// ─── Delete a cached track ───────────────────────────────────────────────────
export async function deleteTrack(mediaItemId: string) {
  const index = await getCacheIndex();
  if (index[mediaItemId]) {
    const file = new File(cacheDir, `${mediaItemId}.m4a`);
    if (file.exists) file.delete();
    delete index[mediaItemId];
    await saveCacheIndex(index);
  }
}

// ─── List all cached tracks ──────────────────────────────────────────────────
export async function listCachedTracks(): Promise<CachedTrack[]> {
  const index = await getCacheIndex();
  return Object.values(index);
}

// ─── Clear all cached audio ──────────────────────────────────────────────────
export async function clearAllCache() {
  if (cacheDir.exists) cacheDir.delete();
  await SecureStore.deleteItemAsync(CACHE_INDEX_KEY);
}

// ─── Cache size in MB ────────────────────────────────────────────────────────
export async function getCacheSizeMB(): Promise<number> {
  const index = await getCacheIndex();
  const totalBytes = Object.values(index).reduce((acc, t) => acc + (t.sizeBytes ?? 0), 0);
  return totalBytes / (1024 * 1024);
}
