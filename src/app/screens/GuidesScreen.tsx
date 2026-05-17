import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '@shared/theme';
import { countrySafetyRatings } from '@products/bsafe/safety-data/countrySafetyRatings';
import { countryScams } from '@products/bsafe/safety-data/countryScams';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GuideTab = 'destinations' | 'scams' | 'tips';

function safetyColor(score: number): string {
  if (score >= 4.5) return colors.safetyHigh;
  if (score >= 3.5) return colors.safetyMedium;
  return colors.safetyLow;
}

const SAFETY_TIPS = [
  { icon: 'shield-checkmark', color: colors.success, title: 'Register with your embassy', body: 'Register your trip with your home country\'s embassy or consulate. This allows them to contact you in an emergency or evacuation.' },
  { icon: 'document-text', color: colors.info, title: 'Carry document copies', body: 'Keep certified copies of your passport, visa, and insurance. Store digital copies in a secure cloud service as backup.' },
  { icon: 'wifi', color: colors.highlight, title: 'Use a VPN on public Wi-Fi', body: 'Public Wi-Fi in hotels and cafés is a prime target for hackers. Use a reputable VPN when accessing sensitive accounts.' },
  { icon: 'card', color: colors.warning, title: 'Use a travel card', body: 'Keep a separate travel card with limited funds. Never carry all your money or cards in one place. Use a money belt for cash.' },
  { icon: 'call', color: colors.error, title: 'Save local emergency numbers', body: 'Before arriving, save the local police, ambulance, and your country\'s embassy number. Don\'t rely on looking it up in an emergency.' },
  { icon: 'map', color: colors.brandDark, title: 'Download offline maps', body: 'Download Google Maps or Maps.me for your destination area. Mobile data can be unreliable, and you don\'t want to be lost without a map.' },
  { icon: 'medical', color: colors.error, title: 'Pack a basic first aid kit', body: 'Include antiseptic wipes, bandages, painkillers, diarrhoea treatment, and any prescription medications with enough supply for your trip.' },
  { icon: 'people', color: colors.info, title: 'Share your itinerary', body: 'Leave a copy of your travel plans with someone at home. Check in regularly, and let them know when to raise the alarm if they don\'t hear from you.' },
  { icon: 'eye-off', color: colors.textSecondary, title: 'Keep a low profile', body: 'Don\'t flash expensive jewellery, cameras, or phones. In unfamiliar areas, be aware of your surroundings and trust your instincts.' },
  { icon: 'cash', color: colors.success, title: 'Use ATMs inside banks', body: 'Standalone ATMs in tourist areas are more likely to have card skimmers. Use ATMs in bank lobbies or shopping centres where possible.' },
];

const ALL_COUNTRIES = Object.entries(countrySafetyRatings)
  .map(([name, data]) => ({ name, ...data }))
  .sort((a, b) => b.overallSafety - a.overallSafety);

const ALL_SCAM_ENTRIES = Object.entries(countryScams)
  .flatMap(([country, scams]) => scams.map((s) => ({ country, ...s })))
  .sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

export function GuidesScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<GuideTab>('destinations');
  const [query, setQuery] = useState('');

  const filteredCountries = useMemo(
    () => query ? ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())) : ALL_COUNTRIES,
    [query],
  );

  const filteredScams = useMemo(
    () => query ? ALL_SCAM_ENTRIES.filter((s) => s.country.toLowerCase().includes(query.toLowerCase()) || s.title.toLowerCase().includes(query.toLowerCase())) : ALL_SCAM_ENTRIES,
    [query],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Travel Guides</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {([
          { key: 'destinations', label: 'Safety', icon: 'globe' },
          { key: 'scams', label: 'Scams', icon: 'warning' },
          { key: 'tips', label: 'Tips', icon: 'bulb' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon as never} size={16} color={tab === t.key ? colors.brandDark : colors.textTertiary} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab !== 'tips' && (
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={tab === 'destinations' ? 'Search countries...' : 'Search by country or scam...'}
            placeholderTextColor={colors.placeholder}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {tab === 'destinations' && (
        <FlatList
          data={filteredCountries}
          keyExtractor={(c) => c.name}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const color = safetyColor(item.overallSafety);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CountryDetails', { countryId: item.name })}
                activeOpacity={0.75}
              >
                <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.score, { color }]}>{item.overallSafety.toFixed(1)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.cardBest}>{item.bestTimeToVisit}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {tab === 'scams' && (
        <FlatList
          data={filteredScams}
          keyExtractor={(s, i) => `${s.country}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const sColor = item.severity === 'high' ? colors.alertHigh : item.severity === 'medium' ? colors.alertMedium : colors.alertLow;
            return (
              <View style={styles.scamCard}>
                <View style={styles.scamTop}>
                  <Text style={styles.scamCountry}>{item.country}</Text>
                  <View style={[styles.sevBadge, { backgroundColor: sColor + '22' }]}>
                    <Text style={[styles.sevText, { color: sColor }]}>{item.severity.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.scamTitle}>{item.title}</Text>
                <Text style={styles.scamDesc}>{item.description}</Text>
                <View style={styles.preventRow}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={colors.safetyHigh} />
                  <Text style={styles.preventText}>{item.prevention}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No scams found</Text></View>}
        />
      )}

      {tab === 'tips' && (
        <ScrollView contentContainerStyle={styles.tipsBody}>
          <Text style={styles.tipsHeading}>Essential Travel Safety Tips</Text>
          {SAFETY_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: tip.color + '18' }]}>
                <Ionicons name={tip.icon as never} size={22} color={tip.color} />
              </View>
              <View style={styles.tipInfo}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, backgroundColor: colors.brandDark },
  title: { ...typography.h2, color: colors.textInverse },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.brandDark },
  tabText: { ...typography.bodySmall, color: colors.textTertiary },
  tabTextActive: { color: colors.brandDark, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: spacing.base, marginBottom: 0, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: spacing.md, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.md },
  list: { padding: spacing.base, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  scoreBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  score: { ...typography.h4, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  cardSub: { ...typography.caption, color: colors.textSecondary },
  cardBest: { ...typography.caption, color: colors.textTertiary },
  scamCard: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, gap: spacing.sm, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  scamTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scamCountry: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  sevBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sevText: { ...typography.caption, fontWeight: '700' },
  scamTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  scamDesc: { ...typography.bodySmall, color: colors.textSecondary },
  preventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  preventText: { ...typography.caption, color: colors.textTertiary, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  tipsBody: { padding: spacing.base, gap: spacing.md },
  tipsHeading: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  tipCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  tipIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tipInfo: { flex: 1, gap: spacing.xs },
  tipTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  tipBody: { ...typography.bodySmall, color: colors.textSecondary },
});
