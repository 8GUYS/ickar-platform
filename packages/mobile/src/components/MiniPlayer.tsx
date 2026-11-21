// ─── ICKAR Mobile — MiniPlayer (persistent bottom bar) ────────────────────────
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../types/theme';
import { usePlayer } from '../context/PlayerContext';

export function MiniPlayer({ onExpand }: { onExpand: () => void }) {
  const { currentTrack, isPlaying, togglePlayPause, isLoading } = usePlayer();

  if (!currentTrack) return null;

  return (
    <TouchableOpacity
      style={[styles.container, Shadow.card]}
      onPress={onExpand}
      activeOpacity={0.95}
    >
      <Image source={{ uri: currentTrack.artwork as string }} style={styles.artwork} />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>

      <TouchableOpacity
        style={styles.playBtn}
        onPress={(e) => { e.stopPropagation(); togglePlayPause(); }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.accent} size="small" />
        ) : (
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,   // above tab bar
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: Colors.white,
    fontSize: 16,
  },
});
