import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { useAppContext } from '@app/AppContext';
import type { RootStackParamList } from '@app/navigation/types';
import { getAllCountries } from '@modules/regional-data';
import { countryScams } from '@products/bsafe/safety-data';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SearchResult {
  id: string;
  type: 'country' | 'scam' | 'alert';
  title: string;
  subtitle: string;
  onPress: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  country: 'flag',
  scam: 'warning',
  alert: 'alert-circle',
};

const TYPE_LABELS: Record<string, string> = {
  country: 'Countries',
  scam: 'Scam Patterns',
  alert: 'Live Alerts',
};

const TYPE_COLORS: Record<string, string> = {
  country: '#2196F3',
  scam: '#FF9800',
  alert: '#F44336',
};

export function GlobalSearchScreen() {
  const colors = useTheme();
  const navigation = useNavigation<Nav>();
  const { alerts } = useAppContext();
  const [query, setQuery] = useState('');

  // Flatten all static scam entries across countries
  const allScams = useMemo(() => {
    const entries: { countryName: string; title: string; description: string; severity: string }[] = [];
    Object.entries(countryScams).forEach(([country, list]) => {
      list.forEach((s) => entries.push({ countryName: country, ...s }));
    });
    return entries;
  }, []);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: SearchResult[] = [];

    // Countries
    const allCountries = getAllCountries();
    const countries = allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
    countries.slice(0, 5).forEach((c) => {
      out.push({
        id: `country-${c.id}`,
        type: 'country',
        title: c.name,
        subtitle: 'Country · Tap for safety info',
        onPress: () => navigation.navigate('CountrySafety', { countryName: c.name }),
      });
    });

    // Scam patterns (static data)
    const matchScams = allScams.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q)
    );
    matchScams.slice(0, 5).forEach((s, i) => {
      out.push({
        id: `scam-${i}-${s.title}`,
        type: 'scam',
        title: s.title,
        subtitle: `${s.countryName} · ${s.severity} severity`,
        onPress: () => navigation.navigate('ScamAlerts'),
      });
    });

    // Live alerts
    const matchAlerts = alerts.alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.countryId ?? '').toLowerCase().includes(q) ||
        (a.summary ?? '').toLowerCase().includes(q)
    );
    matchAlerts.slice(0, 5).forEach((a) => {
      out.push({
        id: `alert-${a.id}`,
        type: 'alert',
        title: a.title,
        subtitle: a.countryId ? `${a.countryId.toUpperCase()} · ${a.source ?? ''}` : (a.source ?? 'Live alert'),
        onPress: () => navigation.navigate('LiveAlerts'),
      });
    });

    return out;
  }, [query, allScams, alerts.alerts, navigation]);

  // Group by type for section rendering
  const sections = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return Object.entries(groups).map(([type, data]) => ({ type, title: TYPE_LABELS[type] ?? type, data }));
  }, [results]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.brandDark,
      gap: spacing.sm,
    },
    backBtn: { padding: 4 },
    searchRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: '#fff',
      paddingVertical: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: 4,
    },
    sectionTitle: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconBox: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    itemTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    itemSubtitle: { ...typography.caption, color: colors.textSecondary },
    empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyBody: { ...typography.body, color: colors.textTertiary, textAlign: 'center' },
    hint: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
    hintText: { ...typography.body, color: colors.textTertiary },
  }), [colors]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.searchRow}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries, scams, alerts..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.trim().length === 0 ? (
        <View style={s.hint}>
          <Ionicons name="search" size={48} color={colors.textTertiary} />
          <Text style={s.hintText}>Search across countries, scams, and alerts</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
          <Text style={s.emptyTitle}>No results</Text>
          <Text style={s.emptyBody}>Try a different search term</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Ionicons
                name={TYPE_ICONS[section.type] as any}
                size={14}
                color={TYPE_COLORS[section.type]}
              />
              <Text style={[s.sectionTitle, { color: TYPE_COLORS[section.type] }]}>
                {section.title.toUpperCase()}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.item} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[s.iconBox, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
                <Ionicons name={TYPE_ICONS[item.type] as any} size={18} color={TYPE_COLORS[item.type]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}
