// ─── ICKAR Mobile — ProfileScreen ────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, Radius } from '../types/theme';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Home');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centred}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.heading}>Account</Text>
        <Text style={styles.sub}>Sign in to manage your account</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Auth', { mode: 'login' })}
        >
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const statusColor =
    user?.subscriptionStatus === 'active' ? Colors.success :
    user?.subscriptionStatus === 'trial' ? Colors.warning :
    Colors.error;

  return (
    <ScrollView style={styles.root}>
      {/* Avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {user?.subscriptionStatus === 'active' ? '✓ Active Subscriber' :
             user?.subscriptionStatus === 'trial' ? '⏱ Trial' : '✗ No Subscription'}
          </Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <MenuItem label="📚 My Library" onPress={() => navigation.navigate('Library')} />
        <MenuItem label="💳 Subscription" onPress={() => navigation.navigate('Auth', { mode: 'login' })} />
        <MenuItem label="🔔 Notifications" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <MenuItem label="⚙️ Settings" onPress={() => {}} />
        <MenuItem label="❓ Help & Support" onPress={() => {}} />
        <MenuItem label="📄 Terms & Privacy" onPress={() => {}} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ICKAR v1.0.0 • Made with ❤️ in Nigeria</Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.canvas },
  centred: { flex: 1, backgroundColor: Colors.canvas, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  header: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '900' },
  name: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.sm },
  statusBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderRadius: Radius.md, marginBottom: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuLabel: { color: Colors.textPrimary, fontSize: FontSize.base },
  menuChevron: { color: Colors.textMuted, fontSize: 20 },
  logoutBtn: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    backgroundColor: Colors.error + '22',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.error,
  },
  logoutText: { color: Colors.error, fontWeight: '800', fontSize: FontSize.base },
  footer: { alignItems: 'center', paddingBottom: Spacing.xl },
  footerText: { color: Colors.textMuted, fontSize: FontSize.xs },
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
});
