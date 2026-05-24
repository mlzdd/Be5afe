import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import type { TravelAlert } from '@products/bsafe/alerts/types';
import { ViewingLocationBanner } from '../components/ViewingLocationBanner';

export function LiveAlertsScreen() {
  const navigation = useNavigation();
  const { alerts, location } = useAppContext();
  const visibleAlerts = location.selectedCountryName
    ? alerts.alerts.filter((alert) =>
      alert.countryName === location.selectedCountryName ||
      alert.countryId.toLowerCase() === location.selectedCountryId?.toLowerCase())
    : alerts.alerts;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Live Alerts</Text>
      </View>
      <ViewingLocationBanner />
      <ScrollView contentContainerStyle={styles.body}>
        {alerts.isLoading && <Text style={styles.sub}>Loading live alerts…</Text>}
        {!alerts.isLoading && visibleAlerts.length === 0 && (
          <>
            <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.sub}>No live alerts available right now.</Text>
          </>
        )}
        {visibleAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertCard({ alert }: { alert: TravelAlert }) {
  const color =
    alert.severity === 'do_not_travel'
      ? colors.error
      : alert.severity === 'warning'
        ? '#FF9800'
        : '#2196F3';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.country}>{alert.countryName}</Text>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>{labelFor(alert.severity)}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{alert.title}</Text>
      <Text style={styles.summary}>{alert.summary}</Text>
      <Text style={styles.meta}>Source: {sourceLabel(alert.source)} · Updated {formatDate(alert.publishedAt)}</Text>
    </View>
  );
}

function labelFor(severity: TravelAlert['severity']) {
  if (severity === 'do_not_travel') return 'Do not travel';
  if (severity === 'warning') return 'Warning';
  return 'Advisory';
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function sourceLabel(source: TravelAlert['source']): string {
  if (source === 'state_dept') return 'US State Department';
  if (source === 'dfat') return 'DFAT';
  if (source === 'bsafe_editorial') return 'BSafe editorial alert';
  return 'UK FCDO';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  body: { padding: spacing.base, gap: spacing.md },
  sub: { ...typography.body, color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  country: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '700' },
  badge: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeText: { ...typography.caption, fontWeight: '700' },
  cardTitle: { ...typography.h4, color: colors.textPrimary },
  summary: { ...typography.bodySmall, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textTertiary },
});
