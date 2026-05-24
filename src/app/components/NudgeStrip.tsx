import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { useAppContext } from '@app/AppContext';
import { getHomeNudges } from '@modules/home/nudges';
import type { RootStackParamList } from '@app/navigation/types';

const DISMISSED_KEY = '@be5afe_nudges_dismissed';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NudgeStrip() {
  const colors = useTheme();
  const navigation = useNavigation<Nav>();
  const { trips, alerts, travelTools, location } = useAppContext();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((raw) => {
      if (raw) setDismissedIds(new Set(JSON.parse(raw) as string[]));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const progress = travelTools.getProgress();
  const nudges = useMemo(() => {
    if (!loaded) return [];
    return getHomeNudges(
      trips.trips,
      alerts.alerts,
      progress.total,
      progress.packed,
      location.selectedCountryId,
      dismissedIds
    );
  }, [loaded, trips.trips, alerts.alerts, progress, location.selectedCountryId, dismissedIds]);

  async function dismiss(id: string) {
    const next = new Set(dismissedIds);
    next.add(id);
    setDismissedIds(next);
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
  }

  if (nudges.length === 0) return null;

  const s = StyleSheet.create({
    row: { marginBottom: spacing.sm },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
      width: 260,
      gap: spacing.sm,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.brandDark + '18',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    text: { ...typography.caption, color: colors.textPrimary, flex: 1, lineHeight: 16 },
    actionLabel: { ...typography.caption, color: colors.brandDark, fontWeight: '700', marginTop: 2 },
    closeBtn: { padding: 4 },
  });

  return (
    <View style={s.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.base }}>
        {nudges.map((nudge) => (
          <View key={nudge.id} style={s.card}>
            <View style={s.iconBox}>
              <Ionicons name={nudge.icon as any} size={18} color={colors.brandDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.text}>{nudge.text}</Text>
              {nudge.action && (
                <TouchableOpacity onPress={() => navigation.navigate(nudge.action!.screen as keyof RootStackParamList as any)}>
                  <Text style={s.actionLabel}>{nudge.action.label} →</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={() => dismiss(nudge.id)}>
              <Ionicons name="close" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
