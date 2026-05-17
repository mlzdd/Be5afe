import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '@shared/theme';
import { countrySafetyRatings } from '@products/bsafe/safety-data/countrySafetyRatings';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function safetyColor(score: number): string {
  if (score >= 4.5) return colors.safetyHigh;
  if (score >= 3.5) return colors.safetyMedium;
  return colors.safetyLow;
}

function safetyLabel(score: number): string {
  if (score >= 4.5) return 'Very Safe';
  if (score >= 3.5) return 'Generally Safe';
  if (score >= 2.5) return 'Exercise Caution';
  return 'High Risk';
}

const COUNTRIES = Object.entries(countrySafetyRatings)
  .map(([name, data]) => ({ name, ...data }))
  .sort((a, b) => b.overallSafety - a.overallSafety);

export function CountrySafetyScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => query.trim() ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())) : COUNTRIES,
    [query],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Country Safety</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search countries..."
          placeholderTextColor={colors.placeholder}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
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
              <View style={styles.info}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
                <View style={[styles.labelBadge, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.labelText, { color }]}>{safetyLabel(item.overallSafety)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No countries found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: colors.textInverse },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: spacing.base, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  scoreBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  score: { ...typography.h4, fontWeight: '800' },
  info: { flex: 1, gap: 4 },
  countryName: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  desc: { ...typography.caption, color: colors.textSecondary },
  labelBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  labelText: { ...typography.caption, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
