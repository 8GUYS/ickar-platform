// ─── ICKAR Mobile — Player Context (audio engine wrapper) ─────────────────────
// Uses expo-av for audio playback (compatible with Expo Go for testing)
// Switch to react-native-track-player after EAS build for lock screen controls
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string;
  mediaItemId: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;    // seconds
  duration: number;    // seconds
  play: (track: Track) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition((status.positionMillis ?? 0) / 1000);
    setDuration((status.durationMillis ?? 0) / 1000);
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  }, []);

  const play = useCallback(async (track: Track) => {
    setIsLoading(true);
    try {
      // Unload previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
        onPlaybackStatusUpdate,
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
    } finally {
      setIsLoading(false);
    }
  }, [onPlaybackStatusUpdate]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [isPlaying]);

  const seek = useCallback(async (seconds: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(seconds * 1000);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        position,
        duration,
        play,
        togglePlayPause,
        seek,
        stop,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
