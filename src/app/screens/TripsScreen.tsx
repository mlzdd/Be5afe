import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { getTripStatus, formatDateRange, getDaysUntil } from '@products/bsafe/trips/tripUtils';
import type { Trip } from '@products/bsafe/trips/types';
import { AddTripModal } from './trips/AddTripModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { trips } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  if (trips.isLoading) return <LoadingSpinner />;

  const sortedTrips = [...trips.trips].sort((a, b) => {
    const sa = getTripStatus(a), sb = getTripStatus(b);
    if (sa === 'active' && sb !== 'active') return -1;
    if (sa !== 'active' && sb === 'active') return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const renderTrip = ({ item }: { item: Trip }) => {
    const status = getTripStatus(item);
    const daysUntil = getDaysUntil(item.startDate);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardRow}>
          <Ionicons name="airplane" size={24} color={colors.brandDark} />
          <View style={styles.cardInfo}>
            <Text style={styles.dest}>{item.destination}</Text>
            <Text style={styles.dates}>{formatDateRange(item.startDate, item.endDate)}</Text>
            {status === 'upcoming' && daysUntil > 0 && (
              <Text style={styles.countdown}>{daysUntil}d away</Text>
            )}
            {status === 'active' && (
              <Text style={[styles.countdown, { color: colors.success }]}>Active now</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedTrips}
        keyExtractor={(t) => t.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="airplane-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No trips yet</Text>
            <TouchableOpacity style={styles.emptyAdd} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyAddText}>Add your first trip</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <AddTripModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(data) => trips.addTrip(data)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, backgroundColor: colors.brandDark },
  title: { ...typography.h2, color: colors.textInverse },
  addBtn: { padding: 4 },
  list: { padding: spacing.base },
  card: { backgroundColor: colors.card, borderRadius: 12, marginBottom: spacing.md, padding: spacing.base, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardInfo: { flex: 1 },
  dest: { ...typography.h4, color: colors.textPrimary },
  dates: { ...typography.bodySmall, color: colors.textSecondary },
  countdown: { ...typography.caption, color: colors.brandDark, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  emptyAdd: { marginTop: spacing.lg, backgroundColor: colors.brandDark, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyAddText: { ...typography.body, color: colors.textInverse },
});
