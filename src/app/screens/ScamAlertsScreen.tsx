import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { countryScams } from '@products/bsafe/safety-data';
import type { ScamReport } from '@products/bsafe/scam-reports';
import { getCountryByName } from '@modules/regional-data/lookup';

export function ScamAlertsScreen() {
  const navigation = useNavigation();
  const { location, scamReports } = useAppContext();
  const [search, setSearch] = useState('');

  const countryName = location.selectedCountryName ?? 'Thailand';
  const scams = countryScams[countryName] ?? [];
  const country = getCountryByName(countryName);
  const visibleReports = scamReports.reports.filter((report) => report.countryId === country?.iso2);

  const filtered = useMemo(() =>
    scams.filter((s) =>
      !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
    ), [scams, search]);
  const filteredReports = useMemo(
    () =>
      visibleReports.filter(
        (report) =>
          !search ||
          report.title.toLowerCase().includes(search.toLowerCase()) ||
          report.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, visibleReports],
  );

  const severityColor = (s: 'high' | 'medium' | 'low') =>
    s === 'high' ? colors.error : s === 'medium' ? colors.warning : colors.success;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Scam Alerts</Text>
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search scams in ${countryName}...`}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.placeholder}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('ReportIncident' as never)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brandDark} />
          <Text style={styles.reportButtonText}>Report a scam</Text>
        </TouchableOpacity>
        <Text style={styles.sub}>{filtered.length + filteredReports.length} alerts for {countryName}</Text>
        {filtered.map((scam, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.scamTitle}>{scam.title}</Text>
              <View style={[styles.badge, { backgroundColor: severityColor(scam.severity) + '20' }]}>
                <Text style={[styles.badgeText, { color: severityColor(scam.severity) }]}>{scam.severity}</Text>
              </View>
            </View>
            <Text style={styles.desc}>{scam.description}</Text>
            <View style={styles.tip}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={styles.tipText}>{scam.prevention}</Text>
            </View>
          </View>
        ))}
        {filteredReports.map((report) => (
          <ReportedCard key={report.id} report={report} />
        ))}
        {filtered.length + filteredReports.length === 0 && (
          <Text style={styles.empty}>No scam alerts found for {countryName}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportedCard({ report }: { report: ScamReport }) {
  const unreviewed = report.status === 'auto_published';
  return (
    <View style={styles.reportedCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.scamTitle}>{report.title}</Text>
        <View style={styles.reportedBadge}>
          <Text style={styles.reportedBadgeText}>Reported</Text>
        </View>
      </View>
      <Text style={styles.desc}>{report.description}</Text>
      <Text style={styles.reportedMeta}>
        {unreviewed ? 'Not yet reviewed by BSafe' : 'Reviewed by BSafe moderation'} · {report.category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: spacing.base, backgroundColor: colors.inputBackground, borderRadius: 10, paddingHorizontal: spacing.md },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.md },
  scroll: { padding: spacing.base, paddingBottom: spacing.xl },
  sub: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reportButtonText: { ...typography.bodySmall, color: colors.brandDark, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  reportedCard: {
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  scamTitle: { ...typography.h4, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  badgeText: { ...typography.caption, fontWeight: '600', textTransform: 'capitalize' },
  reportedBadge: { backgroundColor: colors.warning + '20', borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  reportedBadgeText: { ...typography.caption, color: colors.warning, fontWeight: '700' },
  desc: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  reportedMeta: { ...typography.caption, color: colors.warning, fontWeight: '700' },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  tipText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl },
});
