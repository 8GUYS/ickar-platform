// ─── ICKAR Mobile — PlayerScreen (Full-screen audio player) ──────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../types/theme';
import { usePlayer } from '../context/PlayerContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Player'>;

const { width: SCREEN_W } = Dimensions.get('window');

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { item } = route.params;
  const { currentTrack, isPlaying, position, duration, togglePlayPause, seek, stop } = usePlayer();
  const [sliding, setSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(0);

  const displayPosition = sliding ? slideValue : position;
  const progress = duration > 0 ? displayPosition / duration : 0;

  const handleSeek = (val: number) => {
    setSliding(false);
    seek(val);
  };

  const skip = (seconds: number) => {
    seek(Math.max(0, Math.min(duration, position + seconds)));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>
        <Text style={styles.nowPlaying}>NOW PLAYING</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <Image
          source={{ uri: currentTrack?.artwork ?? item.coverUrl }}
          style={[styles.artwork, Shadow.card]}
        />
      </View>

      {/* Track info */}
      <View style={styles.infoRow}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack?.title ?? item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack?.artist ?? item.author}
          </Text>
        </View>
      </View>

      {/* Progress slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={displayPosition}
          minimumTrackTintColor={Colors.accent}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.accent}
          onSlidingStart={val => { setSliding(true); setSlideValue(val); }}
          onValueChange={val => { if (sliding) setSlideValue(val); }}
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => skip(-15)} style={styles.ctrlBtn}>
          <Text style={styles.ctrlIcon}>⟨15</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          style={[styles.playBtn, Shadow.card]}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => skip(30)} style={styles.ctrlBtn}>
          <Text style={styles.ctrlIcon}>30⟩</Text>
        </TouchableOpacity>
      </View>

      {/* Stop / Close */}
      <TouchableOpacity
        style={styles.stopBtn}
        onPress={async () => { await stop(); navigation.goBack(); }}
      >
        <Text style={styles.stopText}>■  Stop & Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.canvas, paddingHorizontal: Spacing.lg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  chevron: { fontSize: 28, color: Colors.textPrimary, fontWeight: '900', transform: [{ rotate: '90deg' }] },
  nowPlaying: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 2 },
  artworkContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  artwork: {
    width: SCREEN_W - Spacing.lg * 4,
    height: SCREEN_W - Spacing.lg * 4,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  trackInfo: { flex: 1, marginRight: Spacing.sm },
  trackTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  trackArtist: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 2 },
  sliderContainer: { marginBottom: Spacing.xl },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: Colors.textMuted, fontSize: FontSize.xs },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  ctrlBtn: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  ctrlIcon: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '800' },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: Colors.white, fontSize: 28 },
  stopBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  stopText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
