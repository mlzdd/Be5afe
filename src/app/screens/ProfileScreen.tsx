import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { useAuth } from '@modules/auth/AuthContext';

export function ProfileScreen() {
  const { auth } = useAppContext();
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {session.kind === 'authenticated' && auth.user ? (
          <>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={80} color={colors.brandDark} />
              <Text style={styles.name}>{auth.user.displayName ?? 'Traveller'}</Text>
              <Text style={styles.email}>{auth.user.email}</Text>
            </View>
            <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.guestContainer}>
            <Ionicons name="person-circle-outline" size={80} color={colors.textTertiary} />
            <Text style={styles.name}>Browsing as guest</Text>
            <Text style={styles.guestSub}>Sign in to sync trips, contacts and preferences across devices.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, backgroundColor: colors.brandDark },
  title: { ...typography.h2, color: colors.textInverse },
  scroll: { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.base },
  avatar: { alignItems: 'center', marginBottom: spacing.xl },
  name: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
  email: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.base, backgroundColor: '#FEE2E2', borderRadius: 12 },
  signOutText: { ...typography.body, color: colors.error },
  guestContainer: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  guestSub: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center', maxWidth: 280 },
});
