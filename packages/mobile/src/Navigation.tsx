// ─── ICKAR Mobile — Navigation ────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from './types/theme';
import type { RootStackParamList } from './types';

import { HomeScreen } from './screens/HomeScreen';
import { MediaDetailScreen } from './screens/MediaDetailScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AuthScreen } from './screens/AuthScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { usePlayer } from './context/PlayerContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ── Tab icon helper ──────────────────────────────────────────────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Library: '📚', Profile: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

// ── Tab navigator with MiniPlayer overlay ───────────────────────────────────
function MainTabs() {
  const { currentTrack } = usePlayer();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      {currentTrack && (
        <MiniPlayer
          onExpand={() => {
            // Navigate to player with current track info
            navigation.navigate('Player', {
              item: {
                id: currentTrack.mediaItemId,
                title: currentTrack.title,
                author: currentTrack.artist,
                description: '',
                coverUrl: currentTrack.artwork as string,
                type: 'audiobook',
                priceKobo: 250000,
                tenantId: 'default',
              },
              streamUrl: currentTrack.url,
            });
          }}
        />
      )}
    </View>
  );
}

// ── Root navigator ──────────────────────────────────────────────────────────
export function Navigation() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.accent,
          background: Colors.canvas,
          card: Colors.surface,
          text: Colors.textPrimary,
          border: Colors.border,
          notification: Colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: 'normal' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen
          name="MediaDetail"
          component={MediaDetailScreen}
          options={{ headerShown: true, title: '', headerStyle: { backgroundColor: Colors.canvas }, headerTintColor: Colors.textPrimary }}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
