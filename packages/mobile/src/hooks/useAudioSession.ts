// Configures iOS audio session for background playback + Control Center
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export function useAudioSession() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: 1, // DO_NOT_MIX
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false,
    }).catch(console.error);
  }, []);
}
