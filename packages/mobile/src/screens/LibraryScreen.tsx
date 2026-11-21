// ─── ICKAR Mobile — LibraryScreen ────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize } from '../types/theme';
import { getCatalog, checkEntitlement } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MediaCard } from '../components/MediaCard';
import type { MediaItem, RootStackParamList } from '../types';
import {
  downloadTrack,
  getCachedTrack,
  deleteTrack,
  listCachedTracks,
  type CachedTrack,
} from '../services/offlineCache';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Library'>;

// ─── Per-item download state ─────────────────────────────────────────────────
type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; progress: number }
  | { status: 'cached'; track: CachedTrack };

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Map of mediaItemId → download state
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});

  // ─── Helper to merge a single item's download state ─────────────────────
  const setItemDownloadState = useCallback(
    (id: string, state: DownloadState) =>
      setDownloadStates(prev => ({ ...prev, [id]: state })),
    [],
  );

  // ─── Load library + cache status ─────────────────────────────────────────
  const loadLibrary = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const catalog = await getCatalog();
      const checks = await Promise.all(
        catalog.map(item => checkEntitlement(item.id).then(r => ({ item, entitled: r.entitled })))
      );
      const entitled = checks.filter(c => c.entitled).map(c => c.item);
      setItems(entitled);

      // Seed download states from the cache index
      const cached = await listCachedTracks();
      const cachedMap: Record<string, CachedTrack> = {};
      cached.forEach(t => { cachedMap[t.mediaItemId] = t; });

      const initial: Record<string, DownloadState> = {};
      for (const item of entitled) {
        initial[item.id] = cachedMap[item.id]
          ? { status: 'cached', track: cachedMap[item.id] }
          : { status: 'idle' };
      }
      setDownloadStates(initial);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  // ─── Start download ───────────────────────────────────────────────────────
  const handleDownload = useCallback(async (item: MediaItem) => {
    setItemDownloadState(item.id, { status: 'downloading', progress: 0 });
    try {
      const track = await downloadTrack(item.id, (progress) => {
        setItemDownloadState(item.id, { status: 'downloading', progress });
      });
      setItemDownloadState(item.id, { status: 'cached', track });
    } catch {
      setItemDownloadState(item.id, { status: 'idle' });
    }
  }, [setItemDownloadState]);

  // ─── Delete cached track ──────────────────────────────────────────────────
  const handleDelete = useCallback(async (item: MediaItem) => {
    await deleteTrack(item.id);
    setItemDownloadState(item.id, { status: 'idle' });
  }, [setItemDownloadState]);

  // ─── Download action widget ───────────────────────────────────────────────
  const renderDownloadWidget = useCallback(
    (item: MediaItem) => {
      const state: DownloadState = downloadStates[item.id] ?? { status: 'idle' };

      if (state.status === 'cached') {
        return (
          <View style={styles.downloadRow}>
            <Text style={styles.cachedLabel}>🔽 Downloaded</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (state.status === 'downloading') {
        return (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.round(state.progress * 100)}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round(state.progress * 100)}%
            </Text>
          </View>
        );
      }

      // idle
      return (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => handleDownload(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.downloadBtnText}>⬇ Download</Text>
        </TouchableOpacity>
      );
    },
    [downloadStates, handleDelete, handleDownload],
  );

  // ─── Unauthenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.centred}>
        <Text style={styles.icon}>📚</Text>
        <Text style={styles.heading}>Your Library</Text>
        <Text style={styles.sub}>Sign in to see your unlocked content</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Auth', { mode: 'login' })}
        >
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.screenTitle}>My Library</Text>
      {items.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.heading}>Nothing here yet</Text>
          <Text style={styles.sub}>Subscribe to unlock unlimited access</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.btnText}>Browse Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View>
              <MediaCard
                item={item}
                horizontal
                onPress={() => navigation.navigate('MediaDetail', { item })}
              />
              <View style={styles.downloadWidgetWrap}>
                {renderDownloadWidget(item)}
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: Spacing.lg }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadLibrary(); }}
              tintColor={Colors.accent}
            />
          }
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.canvas },
  screenTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  centred: { flex: 1, backgroundColor: Colors.canvas, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  heading: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  btn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.base },

  // Download widget styles
  downloadWidgetWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cachedLabel: {
    color: Colors.accent,
    fontSize: FontSize.sm ?? 12,
    fontWeight: '700',
    flex: 1,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44',
  },
  deleteBtnText: {
    color: '#f44',
    fontSize: FontSize.sm ?? 12,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary + '33',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm ?? 12,
    minWidth: 36,
    textAlign: 'right',
  },
  downloadBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent + '22',
  },
  downloadBtnText: {
    color: Colors.accent,
    fontSize: FontSize.sm ?? 12,
    fontWeight: '700',
  },
});
