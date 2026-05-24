import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import { countryScams } from '@products/bsafe/safety-data';
import type { ScamReport } from '@products/bsafe/scam-reports';
import { getCountryByName } from '@modules/regional-data/lookup';
import { ViewingLocationBanner } from '../components/ViewingLocationBanner';

const BOOKMARKS_KEY = '@be5afe_scam_bookmarks';

export function ScamAlertsScreen() {
  const navigation = useNavigation();
  const { location, scamReports } = useAppContext();
  const [search, setSearch] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const countryName = location.selectedCountryName;
  const scams = countryName ? countryScams[countryName] ?? [] : [];
  const country = countryName ? getCountryByName(countryName) : undefined;
  const visibleReports = scamReports.reports.filter((report) => report.countryId === country?.iso2);

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY).then((raw) => {
      setBookmarks(new Set(raw ? JSON.parse(raw) as string[] : []));
    }).catch(() => {});
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  };

  const filtered = useMemo(() =>
    scams.filter((s) =>
      (!bookmarkedOnly || bookmarks.has(bookmarkId(countryName, s.title))) &&
      (!search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())),
    ), [scams, search, bookmarkedOnly, bookmarks, countryName]);
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
          placeholder={countryName ? `Search scams in ${countryName}...` : 'Search scam alerts...'}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.placeholder}
        />
      </View>
      <ViewingLocationBanner />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('ReportIncident' as never)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brandDark} />
          <Text style={styles.reportButtonText}>Report a scam</Text>
        </TouchableOpacity>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !bookmarkedOnly && styles.filterChipActive]}
            onPress={() => setBookmarkedOnly(false)}
          >
            <Text style={[styles.filterText, !bookmarkedOnly && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, bookmarkedOnly && styles.filterChipActive]}
            onPress={() => setBookmarkedOnly(true)}
          >
            <Text style={[styles.filterText, bookmarkedOnly && styles.filterTextActive]}>Bookmarked</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>
          {countryName ? `${filtered.length + filteredReports.length} alerts for ${countryName}` : 'Select a country to show scam alerts'}
        </Text>
        {filtered.map((scam, i) => (
          <View key={`${countryName}-${scam.title}`} style={styles.card}>
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
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => toggleBookmark(bookmarkId(countryName, scam.title))} style={styles.cardAction}>
                <Ionicons
                  name={bookmarks.has(bookmarkId(countryName, scam.title)) ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.warning}
                />
                <Text style={styles.cardActionText}>Bookmark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Share.share({ message: `${scam.title}\n\n${scam.description}\n\nPrevention: ${scam.prevention}` })}
                style={styles.cardAction}
              >
                <Ionicons name="share-outline" size={16} color={colors.brandDark} />
                <Text style={styles.cardActionText}>Share</Text>
              </TouchableOpacity>
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

function bookmarkId(countryName: string | null, title: string): string {
  return `${countryName ?? 'unknown'}:${title}`;
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
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  filterChipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  filterText: { ...typography.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse, fontWeight: '700' },
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
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandDark + '10', borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  cardActionText: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl },
});
