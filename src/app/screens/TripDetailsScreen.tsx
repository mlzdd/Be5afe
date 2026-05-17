import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { formatDateRange, calculateDuration, getCategoryIcon } from '@products/bsafe/trips/tripUtils';
import { AddActivityModal } from './trips/AddActivityModal';
import { AddBookingModal } from './trips/AddBookingModal';
import type { Activity, Booking } from '@products/bsafe/trips/types';

type Route = RouteProp<RootStackParamList, 'TripDetails'>;
type Tab = 'itinerary' | 'bookings';

const BOOKING_ICON: Record<Booking['type'], string> = {
  flight: 'airplane',
  hotel:  'bed',
  car:    'car',
  tour:   'compass',
  other:  'receipt-outline',
};

export function TripDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { trips } = useAppContext();
  const trip = trips.getTripById(route.params.tripId);

  const [tab, setTab] = useState<Tab>('itinerary');
  const [activityDay, setActivityDay] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Trip Details</Text>
        </View>
        <View style={s.centered}>
          <Text style={s.sub}>Trip not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteTrip = () => {
    Alert.alert('Delete trip', `Delete "${trip.destination}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await trips.deleteTrip(trip.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDeleteActivity = (dayDate: string, activity: Activity) => {
    Alert.alert('Remove activity', `Remove "${activity.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => trips.deleteActivity(trip.id, dayDate, activity.id),
      },
    ]);
  };

  const handleDeleteBooking = (booking: Booking) => {
    Alert.alert('Remove booking', `Remove "${booking.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => trips.deleteBooking(trip.id, booking.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <View style={s.headerMeta}>
          <Text style={s.headerTitle} numberOfLines={1}>{trip.destination}</Text>
          <Text style={s.headerSub}>{trip.country}</Text>
        </View>
        <TouchableOpacity onPress={handleDeleteTrip} style={s.back}>
          <Ionicons name="trash-outline" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Trip summary strip */}
      <View style={s.summary}>
        <Text style={s.summaryDates}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
        <Text style={s.summaryDuration}>{calculateDuration(trip.startDate, trip.endDate)} days</Text>
        {trip.notes ? <Text style={s.summaryNotes} numberOfLines={2}>{trip.notes}</Text> : null}
      </View>

      {/* Tab bar */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'itinerary' && s.tabActive]}
          onPress={() => setTab('itinerary')}
        >
          <Text style={[s.tabText, tab === 'itinerary' && s.tabTextActive]}>Itinerary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'bookings' && s.tabActive]}
          onPress={() => setTab('bookings')}
        >
          <Text style={[s.tabText, tab === 'bookings' && s.tabTextActive]}>
            Bookings {trip.bookings.length > 0 ? `(${trip.bookings.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'itinerary' ? (
        <ScrollView contentContainerStyle={s.scroll}>
          {trip.itinerary.map((day) => (
            <View key={day.date} style={s.day}>
              <View style={s.dayHeaderRow}>
                <Text style={s.dayHeader}>Day {day.dayNumber} — {day.date}</Text>
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => setActivityDay(day.date)}
                >
                  <Ionicons name="add" size={18} color={colors.brandDark} />
                </TouchableOpacity>
              </View>

              {day.activities.length === 0 ? (
                <Text style={s.empty}>No activities — tap + to add</Text>
              ) : (
                day.activities.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={s.activity}
                    onLongPress={() => handleDeleteActivity(day.date, a)}
                    delayLongPress={400}
                  >
                    <View style={s.activityIcon}>
                      <Ionicons name={getCategoryIcon(a.category) as never} size={16} color={colors.brandDark} />
                    </View>
                    <View style={s.activityInfo}>
                      <Text style={s.activityTitle}>{a.title}</Text>
                      {a.location ? <Text style={s.activitySub}>{a.location}</Text> : null}
                      {a.price != null ? <Text style={s.activitySub}>${a.price.toFixed(2)}</Text> : null}
                    </View>
                    <Text style={s.activityTime}>{a.time}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <TouchableOpacity style={s.addBookingBtn} onPress={() => setShowBookingModal(true)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.brandDark} />
            <Text style={s.addBookingText}>Add booking</Text>
          </TouchableOpacity>

          {trip.bookings.length === 0 ? (
            <Text style={s.empty}>No bookings yet.</Text>
          ) : (
            trip.bookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={s.booking}
                onLongPress={() => handleDeleteBooking(b)}
                delayLongPress={400}
              >
                <View style={s.bookingIcon}>
                  <Ionicons name={BOOKING_ICON[b.type] as never} size={20} color={colors.brandDark} />
                </View>
                <View style={s.bookingInfo}>
                  <Text style={s.bookingTitle}>{b.title}</Text>
                  {b.confirmationNumber ? (
                    <Text style={s.bookingSub}>Ref: {b.confirmationNumber}</Text>
                  ) : null}
                  {b.date ? <Text style={s.bookingSub}>{b.date}</Text> : null}
                  {b.price != null ? <Text style={s.bookingSub}>${b.price.toFixed(2)}</Text> : null}
                </View>
                {b.status === 'confirmed' ? (
                  <View style={s.confirmedBadge}>
                    <Text style={s.confirmedText}>Confirmed</Text>
                  </View>
                ) : (
                  <View style={s.planningBadge}>
                    <Text style={s.planningText}>Planning</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Activity modal (per-day) */}
      <AddActivityModal
        visible={activityDay !== null}
        dayDate={activityDay ?? ''}
        onClose={() => setActivityDay(null)}
        onAdd={(activity) => trips.addActivity(trip.id, activityDay!, activity)}
      />

      {/* Add Booking modal */}
      <AddBookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onAdd={(booking) => trips.addBooking(trip.id, booking)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.sm },
  back: { padding: 4 },
  headerMeta: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSub: { ...typography.caption, color: colors.brandLight },
  summary: { padding: spacing.base, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryDates: { ...typography.h4, color: colors.textPrimary },
  summaryDuration: { ...typography.caption, color: colors.textSecondary },
  summaryNotes: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.brandDark },
  tabText: { ...typography.body, color: colors.textTertiary },
  tabTextActive: { color: colors.brandDark, fontWeight: '600' },
  scroll: { padding: spacing.base, paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sub: { ...typography.body, color: colors.textSecondary },
  day: { marginBottom: spacing.lg },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayHeader: { ...typography.h4, color: colors.brandDark, flex: 1 },
  addBtn: { padding: 4 },
  empty: { ...typography.bodySmall, color: colors.textTertiary, fontStyle: 'italic', paddingLeft: spacing.md, paddingVertical: spacing.xs },
  activity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: 8, marginBottom: 2 },
  activityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandDark + '15', alignItems: 'center', justifyContent: 'center' },
  activityInfo: { flex: 1 },
  activityTitle: { ...typography.body, color: colors.textPrimary },
  activitySub: { ...typography.caption, color: colors.textSecondary },
  activityTime: { ...typography.caption, color: colors.textTertiary },
  addBookingBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.brandDark, marginBottom: spacing.md },
  addBookingText: { ...typography.body, color: colors.brandDark },
  booking: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.card, borderRadius: 12, marginBottom: spacing.sm, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bookingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandDark + '15', alignItems: 'center', justifyContent: 'center' },
  bookingInfo: { flex: 1 },
  bookingTitle: { ...typography.body, color: colors.textPrimary },
  bookingSub: { ...typography.caption, color: colors.textSecondary },
  confirmedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  confirmedText: { ...typography.caption, color: '#166534' },
  planningBadge: { backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  planningText: { ...typography.caption, color: '#854D0E' },
});
