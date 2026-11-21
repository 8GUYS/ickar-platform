// Apple Sign-In button — renders on iOS only, no-ops on Android
import React from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Radius, FontSize, Spacing } from '../types/theme';

interface Props { onPress: () => void; }

export function AppleSignInButton({ onPress }: Props) {
  if (Platform.OS !== 'ios') return null;
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.icon}>  </Text>
      <Text style={styles.text}>Continue with Apple</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000', borderRadius: Radius.md,
    paddingVertical: Spacing.md, marginBottom: Spacing.sm,
  },
  icon: { color: '#fff', fontSize: 18, marginRight: Spacing.sm },
  text: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});
