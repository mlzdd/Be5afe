import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';

type RiskLevel = 'medium' | 'high';
type RiskFilter = 'all' | RiskLevel;

interface TouristSpot {
  name: string;
  description: string;
  riskLevel: RiskLevel;
  commonIssues: string[];
  safetyTips: string[];
  location: { city: string; country: string };
}

// Inline static data (ported from bsafe/src/data/touristSpotsData.ts, images omitted)
const RAW_DATA: Record<string, Record<string, Omit<TouristSpot, 'location'>[]>> = {
  France: {
    Paris: [
      {
        name: 'Eiffel Tower',
        description: 'The iconic iron lattice tower attracts millions of tourists annually.',
        riskLevel: 'medium',
        commonIssues: ['Pickpockets in crowds', 'Street vendor scams', 'Fake ticket sellers'],
        safetyTips: [
          'Keep valuables in front pockets or secure bags',
          'Buy tickets only from official counters or website',
          'Be wary of people asking you to sign petitions',
          'Watch for distraction techniques used by thieves',
        ],
      },
      {
        name: 'Louvre Museum',
        description: 'The world\'s largest art museum is extremely crowded, attracting pickpockets.',
        riskLevel: 'high',
        commonIssues: ['Extremely crowded', 'Pickpockets', 'Fake tour guides', 'Long queues'],
        safetyTips: [
          'Book tickets in advance online',
          'Keep bag in front of you at all times',
          'Use official guided tours only',
          'Go early morning or late afternoon to avoid peak crowds',
        ],
      },
    ],
  },
  Indonesia: {
    Bali: [
      {
        name: 'Tanah Lot Temple',
        description: 'A famous sea temple on a rocky islet, popular with tourists and scammers.',
        riskLevel: 'medium',
        commonIssues: ['Fake priests demanding donations', 'Overpriced sarong rentals', 'Aggressive vendors'],
        safetyTips: [
          'Sarong rental is included in the entrance fee',
          'Only donate to temple collection boxes, not individuals',
          'Ignore aggressive vendor approaches — walk on confidently',
        ],
      },
      {
        name: 'Monkey Forest Ubud',
        description: 'Sacred monkey forest sanctuary. Monkeys are cute but opportunistic thieves.',
        riskLevel: 'medium',
        commonIssues: ['Monkeys stealing belongings', 'Monkey bites', 'Overpriced food inside'],
        safetyTips: [
          'Remove glasses, hats, and loose jewellery before entering',
          'Don\'t show food — monkeys will grab it',
          'Don\'t make direct eye contact with monkeys',
          'Seek medical attention immediately if bitten',
        ],
      },
    ],
  },
  Thailand: {
    Bangkok: [
      {
        name: 'Grand Palace',
        description: 'Thailand\'s most visited site. Notorious for tuk-tuk scams outside.',
        riskLevel: 'high',
        commonIssues: ['Tuk-tuk gem scam', 'Fake "closed for ceremony" signs', 'Overpriced entry'],
        safetyTips: [
          'The palace is almost never "closed" — ignore strangers claiming it is',
          'Buy entrance tickets at the official gate only',
          'Don\'t accept tuk-tuk rides from strangers near the palace',
          'Dress code strictly enforced: cover shoulders and knees',
        ],
      },
    ],
    'Chiang Mai': [
      {
        name: 'Night Bazaar',
        description: 'Popular night market with shopping and food. Counterfeit goods common.',
        riskLevel: 'medium',
        commonIssues: ['Counterfeit goods', 'Overcharging tourists', 'Pickpockets in crowds'],
        safetyTips: [
          'Negotiate prices — most vendors expect it',
          'Check goods carefully before buying',
          'Keep wallet in a front pocket',
        ],
      },
    ],
  },
  'United Kingdom': {
    Edinburgh: [
      {
        name: 'Edinburgh Castle',
        description: 'Historic fortress dominating the city skyline. Pickpocketing on Royal Mile.',
        riskLevel: 'medium',
        commonIssues: ['Pickpockets on the Royal Mile approach', 'Long queues', 'Scalpers'],
        safetyTips: [
          'Book tickets in advance on the official website',
          'Watch your belongings on the Royal Mile',
          'Don\'t buy from ticket touts',
        ],
      },
    ],
  },
  Turkey: {
    Istanbul: [
      {
        name: 'Grand Bazaar',
        description: 'One of the largest covered markets in the world. Scam central for tourists.',
        riskLevel: 'high',
        commonIssues: ['Carpet shop scam', 'Fake Turkish delight samples', 'Money switching', 'Aggressive touts'],
        safetyTips: [
          'Don\'t follow strangers offering to show you their "cousin\'s shop"',
          'Agree on price before any service or product',
          'Keep your wallet secure — crowds are dense',
          'Know the exchange rate before handling cash',
        ],
      },
    ],
  },
};

function flattenSpots(): TouristSpot[] {
  const spots: TouristSpot[] = [];
  Object.entries(RAW_DATA).forEach(([country, cities]) => {
    Object.entries(cities).forEach(([city, citySpots]) => {
      citySpots.forEach((spot) => spots.push({ ...spot, location: { city, country } }));
    });
  });
  return spots;
}

const ALL_SPOTS = flattenSpots();

const RISK_COLORS: Record<RiskLevel, string> = {
  medium: '#FF9800',
  high: '#F44336',
};

export function TouristSpotsScreen() {
  const colors = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const filtered = useMemo(() => {
    let spots = ALL_SPOTS;
    if (riskFilter !== 'all') spots = spots.filter((s) => s.riskLevel === riskFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      spots = spots.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.location.city.toLowerCase().includes(q) ||
          s.location.country.toLowerCase().includes(q)
      );
    }
    return spots;
  }, [search, riskFilter]);

  function handlePress(spot: TouristSpot) {
    Alert.alert(spot.name, spot.description, [
      {
        text: 'Safety Tips',
        onPress: () =>
          Alert.alert(
            'Safety Tips',
            `• ${spot.safetyTips.join('\n\n• ')}`
          ),
      },
      {
        text: 'Common Issues',
        onPress: () =>
          Alert.alert('Common Issues', `• ${spot.commonIssues.join('\n• ')}`),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
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
        headerTitle: { ...typography.h2, color: '#fff', flex: 1 },
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          margin: spacing.md,
          backgroundColor: colors.inputBackground,
          borderRadius: 10,
          paddingHorizontal: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
        searchInput: {
          flex: 1,
          ...typography.body,
          color: colors.textPrimary,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.xs,
        },
        filterRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
        chipRow: { flexDirection: 'row', gap: spacing.sm },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: colors.inputBackground,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
        chipText: { ...typography.caption, fontWeight: '600', color: colors.textPrimary },
        chipTextActive: { color: '#fff' },
        count: { ...typography.caption, color: colors.textSecondary, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
        card: {
          marginHorizontal: spacing.md,
          marginBottom: spacing.sm,
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
        cardName: { ...typography.body, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
        riskBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
        riskText: { ...typography.caption, fontWeight: '700', color: '#fff' },
        cardLocation: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
        cardDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
        issueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
        issuePill: {
          backgroundColor: colors.inputBackground,
          borderRadius: 8,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        issueText: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
        empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
        emptyText: { ...typography.body, color: colors.textSecondary },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tourist Spots</Text>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search spots, cities, countries..."
          placeholderTextColor={colors.textTertiary}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {(['all', 'medium', 'high'] as RiskFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.chip, riskFilter === f && s.chipActive]}
              onPress={() => setRiskFilter(f)}
            >
              <Text style={[s.chipText, riskFilter === f && s.chipTextActive]}>
                {f === 'all' ? 'All' : f === 'medium' ? 'Medium Risk' : 'High Risk'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={s.count}>{filtered.length} {filtered.length === 1 ? 'spot' : 'spots'}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.location.country}-${item.location.city}-${item.name}`}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => handlePress(item)} activeOpacity={0.7}>
            <View style={s.cardHeader}>
              <Text style={s.cardName}>{item.name}</Text>
              <View style={[s.riskBadge, { backgroundColor: RISK_COLORS[item.riskLevel] }]}>
                <Text style={s.riskText}>{item.riskLevel.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.cardLocation}>{item.location.city}, {item.location.country}</Text>
            <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
            <View style={s.issueRow}>
              {item.commonIssues.slice(0, 3).map((issue) => (
                <View key={issue} style={s.issuePill}>
                  <Text style={s.issueText}>{issue}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
            <Text style={s.emptyText}>No spots found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}
