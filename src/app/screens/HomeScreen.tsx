import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '@shared/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  navigate: (nav: Nav) => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Emergency',    icon: 'call',             color: '#F44336', navigate: (n) => n.navigate('Emergency') },
  { label: 'Scam Alerts',  icon: 'warning',          color: '#FF9800', navigate: (n) => n.navigate('ScamAlerts') },
  { label: 'Safe Zones',   icon: 'shield-checkmark', color: '#4CAF50', navigate: (n) => n.navigate('SafeZones') },
  { label: 'Live Alerts',  icon: 'alert-circle',     color: '#2196F3', navigate: (n) => n.navigate('LiveAlerts') },
  { label: 'My Trips',     icon: 'airplane',         color: '#9C27B0', navigate: (n) => n.navigate('HomeTabs', { screen: 'MyTrips' } as never) },
  { label: 'Friends',      icon: 'people',           color: '#00BCD4', navigate: (n) => n.navigate('Friends') },
  { label: 'Groups',       icon: 'people-circle',    color: '#673AB7', navigate: (n) => n.navigate('Groups') },
  { label: 'Widgets',      icon: 'grid',             color: '#607D8B', navigate: (n) => n.navigate('Widgets') },
  { label: 'Packing',      icon: 'archive',          color: '#795548', navigate: (n) => n.navigate('PackingList') },
  { label: 'Documents',    icon: 'document-text',    color: '#FF5722', navigate: (n) => n.navigate('Documents') },
  { label: 'Currency',     icon: 'cash',             color: '#4CAF50', navigate: (n) => n.navigate('CurrencyConverter') },
  { label: 'Hospital',     icon: 'medical',          color: '#F44336', navigate: (n) => n.navigate('NearestHospital') },
  { label: 'Weather',      icon: 'partly-sunny',     color: '#FF9800', navigate: (n) => n.navigate('Weather') },
  { label: 'Health Guide', icon: 'medkit',           color: '#E91E63', navigate: (n) => n.navigate('HealthGuide') },
  { label: 'Local Apps',   icon: 'grid',             color: '#3F51B5', navigate: (n) => n.navigate('LocalApps') },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <LinearGradient
      colors={[colors.brandLight, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Be5afe</Text>
          <Text style={styles.sub}>Your travel safety companion</Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.tile}
                onPress={() => a.navigate(navigation)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, { backgroundColor: a.color + '20' }]}>
                  <Ionicons name={a.icon as never} size={28} color={a.color} />
                </View>
                <Text style={styles.tileLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.base, paddingBottom: spacing.xl },
  heading: { ...typography.h1, color: colors.brandDark, marginBottom: spacing.xs },
  sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  tileLabel: { ...typography.caption, color: colors.textPrimary, textAlign: 'center' },
});
