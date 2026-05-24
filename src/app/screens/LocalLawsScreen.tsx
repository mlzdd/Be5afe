import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import type { RootStackParamList } from '../navigation/types';
import { useAppContext } from '../AppContext';
import { ViewingLocationBanner } from '../components/ViewingLocationBanner';

type Route = RouteProp<RootStackParamList, 'LocalLaws'>;

interface LawCategory {
  title: string;
  icon: string;
  rules: string[];
}

interface CountryLaws {
  customs: string[];
  mustKnow: string[];
  categories: LawCategory[];
}

const LAWS: Record<string, CountryLaws> = {
  Thailand: {
    mustKnow: [
      'Lèse-majesté laws are strictly enforced — never criticise the monarchy',
      'Drugs carry severe penalties including life imprisonment',
      'Always carry a copy of your passport',
    ],
    customs: [
      'Remove shoes before entering temples and homes',
      'Dress modestly at temples (cover shoulders and knees)',
      'Never point feet towards Buddha images or people',
      "Don't touch someone's head — it is considered sacred",
    ],
    categories: [
      { title: 'Alcohol & Drugs', icon: 'wine-outline', rules: ['Legal drinking age is 20', 'No alcohol sold 2pm–5pm or midnight–11am', 'Zero tolerance for drugs — possession can mean life imprisonment'] },
      { title: 'Driving', icon: 'car-outline', rules: ['Drive on the left', 'International driving permit required', 'Road safety is poor — exercise extreme caution on motorbikes'] },
      { title: 'Photography', icon: 'camera-outline', rules: ['Do not photograph military installations', 'Ask permission before photographing monks', 'Photography inside some temples is prohibited'] },
    ],
  },
  Japan: {
    mustKnow: [
      'Jaywalking is technically illegal and frowned upon',
      'Carrying prescription drugs requires documentation',
      'Tattoos may restrict entry to onsen (hot springs)',
    ],
    customs: [
      'Queuing is taken seriously — always wait in line',
      'Do not eat or drink while walking in public',
      'Tipping is considered rude in most contexts',
      'Be quiet on public transport — phone calls are frowned upon',
    ],
    categories: [
      { title: 'Alcohol & Drugs', icon: 'wine-outline', rules: ['Legal drinking age is 20', 'Some cold medicine ingredients are illegal (pseudoephedrine)', 'Cannabis is strictly illegal with heavy penalties'] },
      { title: 'Driving', icon: 'car-outline', rules: ['Drive on the left', 'Strict drink-driving laws (0.03% BAC limit)', 'Speed cameras are widespread'] },
      { title: 'Photography', icon: 'camera-outline', rules: ['Photography in shrines may be restricted', 'Do not photograph people without consent', 'No photography on most military bases'] },
    ],
  },
  Singapore: {
    mustKnow: [
      'Chewing gum is banned — importing is illegal',
      'Littering carries heavy fines',
      'Jaywalking is illegal and enforced',
    ],
    customs: [
      'Tipping is not customary',
      'Remove shoes when entering homes',
      'Avoid public displays of affection',
    ],
    categories: [
      { title: 'Fines & Penalties', icon: 'cash-outline', rules: ['Littering: up to S$2,000 fine', 'Smoking in prohibited areas: S$1,000 fine', 'Jaywalking: up to S$1,000 fine'] },
      { title: 'Alcohol & Drugs', icon: 'wine-outline', rules: ['Legal drinking age is 18', 'No alcohol in public between 10:30pm–7am', 'Drug trafficking carries the death penalty'] },
      { title: 'Driving', icon: 'car-outline', rules: ['Drive on the left', 'Strict drink-driving laws', 'Electronic Road Pricing (congestion charges) apply'] },
    ],
  },
  UAE: {
    mustKnow: [
      'Public displays of affection can lead to arrest',
      'Dress modestly in public — especially outside of resorts',
      'Ramadan: eating/drinking/smoking in public during daylight is illegal',
    ],
    customs: [
      'Remove shoes when entering a mosque',
      'Dress conservatively at government buildings and malls',
      'Use your right hand for greetings and food',
      'Avoid criticism of the government or religion',
    ],
    categories: [
      { title: 'Alcohol', icon: 'wine-outline', rules: ['Only available in licensed venues', 'Drink-driving is zero tolerance', 'Being drunk in public is illegal'] },
      { title: 'Photography', icon: 'camera-outline', rules: ['Do not photograph government buildings or military', 'Ask permission before photographing Emiratis', 'Filming accidents or incidents can be illegal'] },
      { title: 'Online & Social Media', icon: 'globe-outline', rules: ['Criticism of UAE government online is illegal', 'VoIP calls may be restricted', 'Some websites are blocked'] },
    ],
  },
  India: {
    mustKnow: [
      'Beef is banned in many states — respect local laws',
      'Drugs carry heavy sentences',
      'Do not carry certain satellite phones without a licence',
    ],
    customs: [
      'Remove shoes before entering temples, mosques, and many homes',
      'Dress modestly at religious sites',
      'Head-wobble (side to side) means "yes" or understanding',
    ],
    categories: [
      { title: 'Photography', icon: 'camera-outline', rules: ['Do not photograph military installations', 'Some temples prohibit photography', 'Permission required for wildlife photography in national parks'] },
      { title: 'Driving', icon: 'car-outline', rules: ['Drive on the left', 'International driving permit required', 'Traffic is chaotic — consider using a driver'] },
      { title: 'Alcohol', icon: 'wine-outline', rules: ['Prohibited in Gujarat, Mizoram, and some areas', 'Drinking age varies by state (18–25)', 'Alcohol can only be purchased at licensed stores'] },
    ],
  },
};

const DEFAULT_LAWS: CountryLaws = {
  mustKnow: [
    'Always carry valid ID (or a certified copy of your passport)',
    'Know your country\'s embassy contact in case of emergency',
    'Check travel advisories from your home government before visiting',
  ],
  customs: [
    'Research local customs before visiting religious sites',
    'Dress modestly when in doubt',
    'Learn a few words of the local language — it goes a long way',
  ],
  categories: [
    { title: 'General Tips', icon: 'information-circle-outline', rules: ['Respect local traditions and customs', 'Follow local dress codes, especially at religious sites', 'Keep noise levels reasonable in residential areas'] },
  ],
};

export function LocalLawsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { location } = useAppContext();
  const countryName = route.params?.countryName ?? location.selectedCountryName ?? '';
  const [query, setQuery] = useState(countryName);

  const laws = useMemo(() => {
    const key = Object.keys(LAWS).find((k) => k.toLowerCase() === query.toLowerCase().trim());
    return key ? LAWS[key] : null;
  }, [query]);

  const displayed = laws ?? DEFAULT_LAWS;
  const displayName = laws ? (Object.keys(LAWS).find((k) => k.toLowerCase() === query.toLowerCase().trim()) ?? query) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Local Laws & Customs</Text>
      </View>
      <ViewingLocationBanner />

      <View style={styles.searchRow}>
        <Ionicons name="globe-outline" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Enter country name..."
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {displayName ? (
        <Text style={styles.countryHeading}>{displayName}</Text>
      ) : query.trim() ? (
        <Text style={styles.notFoundNote}>No specific data for "{query.trim()}" — showing general guidance</Text>
      ) : (
        <Text style={styles.notFoundNote}>Enter a country for specific laws and customs</Text>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.sectionTitle}>Must Know</Text>
          </View>
          {displayed.mustKnow.map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={styles.dot} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={colors.info} />
            <Text style={styles.sectionTitle}>Local Customs</Text>
          </View>
          {displayed.customs.map((custom, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={[styles.dot, { backgroundColor: colors.info }]} />
              <Text style={styles.ruleText}>{custom}</Text>
            </View>
          ))}
        </View>

        {displayed.categories.map((cat, ci) => (
          <View key={ci} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={cat.icon as never} size={20} color={colors.brandDark} />
              <Text style={styles.sectionTitle}>{cat.title}</Text>
            </View>
            {cat.rules.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <View style={[styles.dot, { backgroundColor: colors.brandDark }]} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.disclaimer}>
          Laws change. Always verify with official sources and your home country's travel advisory before travelling.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: spacing.base, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: spacing.md, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.md },
  countryHeading: { ...typography.h3, color: colors.textPrimary, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  notFoundNote: { ...typography.bodySmall, color: colors.textTertiary, paddingHorizontal: spacing.base, marginBottom: spacing.sm, fontStyle: 'italic' },
  body: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.md },
  section: { backgroundColor: colors.card, borderRadius: 14, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.h4, color: colors.textPrimary },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, marginTop: 7 },
  ruleText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  disclaimer: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: spacing.md },
});
