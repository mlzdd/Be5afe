import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { countrySafetyRatings } from '@products/bsafe/safety-data/countrySafetyRatings';
import { countryScams } from '@products/bsafe/safety-data/countryScams';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'CountryDetails'>;

function safetyColor(score: number): string {
  if (score >= 4.5) return colors.safetyHigh;
  if (score >= 3.5) return colors.safetyMedium;
  return colors.safetyLow;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = safetyColor(score);
  const pct = (score / 5) * 100;
  return (
    <View style={bar.row}>
      <Text style={bar.label}>{label}</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[bar.val, { color }]}>{score.toFixed(1)}</Text>
    </View>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  high: colors.alertHigh,
  medium: colors.alertMedium,
  low: colors.alertLow,
};

export function CountryDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const countryName = route.params.countryId; // we use countryId as country name

  const safety = countrySafetyRatings[countryName];
  const scams = countryScams[countryName] ?? [];

  if (!safety) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{countryName}</Text>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="globe-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.notFoundText}>No safety data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overallColor = safetyColor(safety.overallSafety);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{countryName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Overall score */}
        <View style={[styles.scoreCard, { borderColor: overallColor + '40' }]}>
          <View style={[styles.bigScore, { backgroundColor: overallColor + '18' }]}>
            <Text style={[styles.bigScoreNum, { color: overallColor }]}>{safety.overallSafety.toFixed(1)}</Text>
            <Text style={[styles.bigScoreLabel, { color: overallColor }]}>/ 5.0</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.desc}>{safety.description}</Text>
            <Text style={styles.bestTime}>
              <Text style={styles.bestTimeLabel}>Best time: </Text>
              {safety.bestTimeToVisit}
            </Text>
          </View>
        </View>

        {/* Category scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Breakdown</Text>
          <ScoreBar label="Crime" score={safety.categories.crime} />
          <ScoreBar label="Health" score={safety.categories.health} />
          <ScoreBar label="Transport" score={safety.categories.transport} />
          <ScoreBar label="Natural Disasters" score={safety.categories.natural} />
          <ScoreBar label="Political" score={safety.categories.political} />
          <ScoreBar label="Terrorism" score={safety.categories.terrorism} />
        </View>

        {/* Common risks */}
        {safety.commonRisks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Risks</Text>
            {safety.commonRisks.map((r, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.bulletText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safe areas */}
        {safety.safestAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safer Areas</Text>
            {safety.safestAreas.map((a, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.safetyHigh} />
                <Text style={styles.bulletText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Areas to avoid */}
        {safety.areasToAvoid.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas to Avoid</Text>
            {safety.areasToAvoid.map((a, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="close-circle-outline" size={16} color={colors.safetyLow} />
                <Text style={styles.bulletText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Scams */}
        {scams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Known Scams ({scams.length})</Text>
            {scams.map((s, i) => (
              <View key={i} style={styles.scamCard}>
                <View style={styles.scamHeader}>
                  <Text style={styles.scamTitle}>{s.title}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[s.severity] + '22' }]}>
                    <Text style={[styles.severityText, { color: SEVERITY_COLORS[s.severity] }]}>
                      {s.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.scamDesc}>{s.description}</Text>
                <View style={styles.preventionRow}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={colors.safetyHigh} />
                  <Text style={styles.preventionText}>{s.prevention}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  body: { padding: spacing.base, gap: spacing.base },
  scoreCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: spacing.base, gap: spacing.md, backgroundColor: colors.card, alignItems: 'center' },
  bigScore: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  bigScoreNum: { ...typography.h2, lineHeight: 32 },
  bigScoreLabel: { ...typography.caption },
  scoreInfo: { flex: 1, gap: spacing.xs },
  desc: { ...typography.bodySmall, color: colors.textSecondary },
  bestTime: { ...typography.caption, color: colors.textTertiary },
  bestTimeLabel: { fontWeight: '600', color: colors.textSecondary },
  section: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.base, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  sectionTitle: { ...typography.h4, color: colors.textPrimary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bulletText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  scamCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, gap: spacing.sm },
  scamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scamTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  severityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  severityText: { ...typography.caption, fontWeight: '700' },
  scamDesc: { ...typography.bodySmall, color: colors.textSecondary },
  preventionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  preventionText: { ...typography.caption, color: colors.textTertiary, flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  notFoundText: { ...typography.body, color: colors.textSecondary },
});

const bar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { ...typography.bodySmall, color: colors.textSecondary, width: 120 },
  track: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  val: { ...typography.bodySmall, fontWeight: '700', width: 32, textAlign: 'right' },
});
