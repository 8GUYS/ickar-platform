// ─── ICKAR Mobile — MediaDetailScreen ────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../types/theme';
import { checkEntitlement, getStreamingToken, initiateSubscription } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MediaDetail'>;
type Route = RouteProp<RootStackParamList, 'MediaDetail'>;

export function MediaDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { item } = route.params;
  const { isAuthenticated, user } = useAuth();
  const { play } = usePlayer();

  const [entitled, setEntitled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  const priceNaira = (item.priceKobo / 100).toLocaleString('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    checkEntitlement(item.id)
      .then(r => setEntitled(r.entitled))
      .catch(() => setEntitled(false))
      .finally(() => setLoading(false));
  }, [item.id, isAuthenticated]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { mode: 'register' });
      return;
    }
    try {
      const { authorizationUrl } = await initiateSubscription();
      await Linking.openURL(authorizationUrl);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not initiate payment');
    }
  };

  const handlePlay = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { mode: 'login' });
      return;
    }
    setPlaying(true);
    try {
      const { url } = await getStreamingToken(item.id);
      await play({
        id: item.id,
        title: item.title,
        artist: item.author,
        artwork: item.coverUrl,
        url,
        mediaItemId: item.id,
      });
      navigation.navigate('Player', { item, streamUrl: url });
    } catch (err: any) {
      Alert.alert('Playback Error', err.message ?? 'Could not load audio');
    } finally {
      setPlaying(false);
    }
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Hero cover */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: item.coverUrl }} style={styles.cover} />
        <View style={styles.heroOverlay} />
      </View>

      <View style={styles.body}>
        {/* Title / Author */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>by {item.author}</Text>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.type === 'audiobook' ? '🎧 Audiobook' : item.type === 'ebook' ? '📖 eBook' : '📄 PDF'}
            </Text>
          </View>
          {item.durationMin && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.durationMin} min</Text>
            </View>
          )}
          {item.pageCount && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.pageCount} pages</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* CTA section */}
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.lg }} />
        ) : entitled ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handlePlay}
            disabled={playing}
          >
            {playing
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>{item.type === 'audiobook' ? '▶  Play Now' : '📖  Read Now'}</Text>
            }
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Subscribe for access</Text>
              <Text style={styles.price}>₦2,500 / month</Text>
              <Text style={styles.priceNote}>Unlimited access to ALL titles</Text>
            </View>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSubscribe}>
              <Text style={styles.btnText}>Subscribe — ₦2,500/mo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={() => navigation.navigate('Auth', { mode: 'register' })}
            >
              <Text style={styles.btnOutlineText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Subscription note */}
        <Text style={styles.note}>
          🔒 Secure payment via Paystack · Cancel anytime
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.canvas },
  heroContainer: { position: 'relative', height: 300 },
  cover: { width: '100%', height: 300 },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11,15,23,0.4)',
  },
  body: { padding: Spacing.lg },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  author: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  priceBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
  },
  priceLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 4 },
  price: { color: Colors.accent, fontSize: FontSize.xl, fontWeight: '900' },
  priceNote: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  btn: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  btnPrimary: { backgroundColor: Colors.accent },
  btnOutline: { borderWidth: 1, borderColor: Colors.accent },
  btnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: '800' },
  btnOutlineText: { color: Colors.accent, fontSize: FontSize.base, fontWeight: '700' },
  note: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.sm },
});
