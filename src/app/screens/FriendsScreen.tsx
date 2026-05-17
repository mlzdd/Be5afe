import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function FriendsScreen() {
  const navigation = useNavigation();
  const { friends } = useAppContext();
  if (friends.isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.badges}>
          {friends.incomingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friends.incomingRequests.length}</Text>
            </View>
          )}
        </View>
      </View>
      <FlatList
        data={friends.friends}
        keyExtractor={(f) => f.userId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <Ionicons name="person-circle" size={40} color={colors.textSecondary} />
            <View style={styles.friendInfo}>
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No friends yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse, flex: 1 },
  badges: { flexDirection: 'row' },
  badge: { backgroundColor: colors.error, borderRadius: 10, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  list: { padding: spacing.base },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md },
  friendInfo: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  email: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
