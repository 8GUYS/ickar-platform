// ─── ICKAR Mobile — HomeScreen ────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, Radius } from '../types/theme';
import { getCatalog } from '../services/api';
import type { MediaItem, RootStackParamList } from '../types';
import { MediaCard } from '../components/MediaCard';
import { useAuth } from '../context/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [filtered, setFiltered] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'audiobook' | 'ebook' | 'pdf'>('all');

  const loadCatalog = useCallback(async () => {
    try {
      const data = await getCatalog();
      setCatalog(data);
      setFiltered(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  useEffect(() => {
    let list = catalog;
    if (activeFilter !== 'all') list = list.filter(i => i.type === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.author.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [catalog, activeFilter, search]);

  const featured = catalog.filter(i => i.type === 'audiobook').slice(0, 6);
  const newArrivals = catalog.slice(-4).reverse();

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'audiobook', label: '🎧 Audio' },
    { key: 'ebook', label: '📖 eBook' },
    { key: 'pdf', label: '📄 PDF' },
  ] as const;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadCatalog(); }}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {isAuthenticated ? `Hello, ${user?.name?.split(' ')[0]} 👋` : 'Welcome to'}
            </Text>
            <Text style={styles.brand}>ICKAR</Text>
            <Text style={styles.subtitle}>Audiobooks · eBooks · Knowledge</Text>
          </View>
          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Auth', { mode: 'login' })}
            >
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search titles, authors…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, activeFilter === f.key && styles.chipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured audiobooks horizontal scroll */}
        {!search && activeFilter === 'all' && featured.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Audiobooks</Text>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <MediaCard
                  item={item}
                  onPress={() => navigation.navigate('MediaDetail', { item })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            />
          </View>
        )}

        {/* New Arrivals */}
        {!search && activeFilter === 'all' && newArrivals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
            {newArrivals.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                horizontal
                onPress={() => navigation.navigate('MediaDetail', { item })}
              />
            ))}
          </View>
        )}

        {/* Filtered results grid */}
        {(search || activeFilter !== 'all') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
            {filtered.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                horizontal
                onPress={() => navigation.navigate('MediaDetail', { item })}
              />
            ))}
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>No results found</Text>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.canvas },
  loadingContainer: { flex: 1, backgroundColor: Colors.canvas, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  brand: { fontSize: FontSize.hero, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 2 },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  loginBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  loginBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: { paddingLeft: Spacing.lg, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '800', marginBottom: Spacing.md },
  hList: { paddingRight: Spacing.lg },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.base, textAlign: 'center', marginTop: Spacing.xl },
});
