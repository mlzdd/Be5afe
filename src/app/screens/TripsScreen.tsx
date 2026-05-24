import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { getTripStatus, formatDateRange, getDaysUntil } from '@products/bsafe/trips/tripUtils';
import type { Trip } from '@products/bsafe/trips/types';
import { AddTripModal } from './trips/AddTripModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getCountryByName } from '@modules/regional-data';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TripTab = 'upcoming' | 'past' | 'all' | 'calendar';

export function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { trips } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<TripTab>('upcoming');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  if (trips.isLoading) return <LoadingSpinner />;

  const sortedTrips = [...trips.trips].sort((a, b) => {
    const sa = getTripStatus(a), sb = getTripStatus(b);
    if (sa === 'active' && sb !== 'active') return -1;
    if (sa !== 'active' && sb === 'active') return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const visibleTrips = sortedTrips.filter((trip) => {
    const status = getTripStatus(trip);
    if (tab === 'upcoming') return status === 'upcoming' || status === 'active';
    if (tab === 'past') return status === 'past';
    return true;
  });

  const renderTrip = ({ item }: { item: Trip }) => {
    const status = getTripStatus(item);
    const daysUntil = getDaysUntil(item.startDate);
    const flag = getCountryByName(item.country)?.flag;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardRow}>
          <Ionicons name="airplane" size={24} color={colors.brandDark} />
          <View style={styles.cardInfo}>
            <Text style={styles.dest}>{flag ? `${flag} ` : ''}{item.destination}</Text>
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
      <View style={styles.tabs}>
        {(['upcoming', 'past', 'all', 'calendar'] as TripTab[]).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item === 'all' ? 'All' : item === 'calendar' ? 'Calendar' : item[0].toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'calendar' ? (
        <CalendarView
          trips={sortedTrips}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenTrip={(tripId) => navigation.navigate('TripDetails', { tripId })}
        />
      ) : (
        <FlatList
          data={visibleTrips}
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
      )}
      <AddTripModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(data) => trips.addTrip(data)}
      />
    </SafeAreaView>
  );
}

function CalendarView({
  trips,
  selectedDate,
  onSelectDate,
  onOpenTrip,
}: {
  trips: Trip[];
  selectedDate: string | null;
  onSelectDate(date: string): void;
  onOpenTrip(tripId: string): void;
}) {
  const markedDates = trips.reduce<Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string; dotColor?: string }>>((acc, trip) => {
    for (const date of datesBetween(trip.startDate, trip.endDate)) {
      acc[date] = {
        marked: true,
        dotColor: colors.brandDark,
        selected: date === selectedDate,
        selectedColor: colors.brandDark,
      };
    }
    return acc;
  }, {});
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: colors.brandDark };
  }

  const tripsOnDay = selectedDate
    ? trips.filter((trip) => selectedDate >= trip.startDate && selectedDate <= trip.endDate)
    : [];

  return (
    <View style={styles.calendarBody}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => onSelectDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: colors.brandDark,
          todayTextColor: colors.brandDark,
          arrowColor: colors.brandDark,
        }}
      />
      <View style={styles.dayTrips}>
        <Text style={styles.dayTripsTitle}>{selectedDate ?? 'Select a trip day'}</Text>
        {tripsOnDay.length === 0 ? (
          <Text style={styles.emptyText}>No trips on this date</Text>
        ) : tripsOnDay.map((trip) => (
          <TouchableOpacity key={trip.id} style={styles.dayTripCard} onPress={() => onOpenTrip(trip.id)}>
            <Text style={styles.dest}>{trip.destination}</Text>
            <Text style={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, backgroundColor: colors.brandDark },
  title: { ...typography.h2, color: colors.textInverse },
  addBtn: { padding: 4 },
  tabs: { flexDirection: 'row', gap: spacing.xs, padding: spacing.base, paddingBottom: spacing.sm },
  tab: { flex: 1, alignItems: 'center', borderRadius: 999, paddingVertical: spacing.sm, backgroundColor: colors.inputBackground },
  tabActive: { backgroundColor: colors.brandDark },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse, fontWeight: '700' },
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
  calendarBody: { flex: 1, padding: spacing.base, gap: spacing.md },
  dayTrips: { gap: spacing.sm },
  dayTripsTitle: { ...typography.h4, color: colors.textPrimary },
  dayTripCard: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.base },
});
