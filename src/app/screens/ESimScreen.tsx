import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { useLocation } from '@modules/maps/LocationContext';

interface ESimProvider {
  name: string;
  tagline: string;
  coverage: string;
  features: string[];
  appStoreUrl: string;
  websiteUrl: string;
  icon: string;
}

const PROVIDERS: ESimProvider[] = [
  {
    name: 'Airalo',
    tagline: 'World\'s largest eSIM marketplace',
    coverage: '200+ countries',
    features: ['No contract', 'Instant activation', 'Data-only plans', 'Top-up available'],
    appStoreUrl: 'https://apps.apple.com/app/airalo-esim-internet-travel/id1475110845',
    websiteUrl: 'https://www.airalo.com',
    icon: 'wifi',
  },
  {
    name: 'Holafly',
    tagline: 'Unlimited data plans for travellers',
    coverage: '170+ countries',
    features: ['Unlimited data', 'No speed throttling', '24/7 support', 'Hotspot sharing'],
    appStoreUrl: 'https://apps.apple.com/app/holafly/id1481923703',
    websiteUrl: 'https://esim.holafly.com',
    icon: 'globe',
  },
  {
    name: 'Nomad',
    tagline: 'Flexible data plans for every traveller',
    coverage: '170+ countries',
    features: ['Flexible top-ups', 'Regional plans', 'No contract', 'Fast activation'],
    appStoreUrl: 'https://apps.apple.com/app/nomad-esim/id1451997396',
    websiteUrl: 'https://www.getnomad.app',
    icon: 'navigate',
  },
  {
    name: 'Flexiroam',
    tagline: 'Global connectivity in one eSIM',
    coverage: '150+ countries',
    features: ['Long-validity plans', 'Pay-per-MB option', 'Multi-country bundles', 'Physical SIM swap'],
    appStoreUrl: 'https://apps.apple.com/app/flexiroam/id961751986',
    websiteUrl: 'https://www.flexiroam.com',
    icon: 'swap-horizontal',
  },
  {
    name: 'aloSIM',
    tagline: 'Simple, transparent eSIM plans',
    coverage: '130+ countries',
    features: ['No hidden fees', 'Easy top-up', 'Data tracking app', 'Referral rewards'],
    appStoreUrl: 'https://apps.apple.com/app/alosim-travel-esim/id1539634656',
    websiteUrl: 'https://alosim.com',
    icon: 'cellular',
  },
];

async function openUrl(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open link', 'Please visit the provider\'s website directly.');
    }
  } catch {
    Alert.alert('Error', 'Could not open link.');
  }
}

export function ESimScreen() {
  const colors = useTheme();
  const navigation = useNavigation();
  const { location } = useLocation();

  const countryNote = location?.countryId
    ? `Showing eSIM providers with coverage in ${location.countryId.toUpperCase()}`
    : 'Select a country on the home screen to filter by coverage';

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
    headerTitle: { ...typography.h2, color: '#fff', flex: 1 },
    banner: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bannerText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
    notice: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.sm,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
    },
    noticeText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
    card: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
    iconBox: {
      width: 40, height: 40, borderRadius: 10,
      backgroundColor: colors.brandDark + '22',
      alignItems: 'center', justifyContent: 'center',
    },
    name: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    tagline: { ...typography.caption, color: colors.textSecondary },
    coverage: { ...typography.caption, color: colors.brandDark, fontWeight: '600', marginBottom: spacing.sm },
    features: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.md },
    featurePill: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    featureText: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
    actions: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.brandDark,
    },
    actionBtnPrimary: { backgroundColor: colors.brandDark },
    actionText: { ...typography.caption, fontWeight: '700', color: colors.brandDark },
    actionTextPrimary: { color: '#fff' },
  }), [colors]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>eSIM Providers</Text>
      </View>

      <FlatList
        data={PROVIDERS}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={
          <>
            <View style={s.banner}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={s.bannerText}>{countryNote}. All providers below support international travel eSIMs.</Text>
            </View>
            <View style={s.notice}>
              <Text style={s.noticeText}>Be5afe links to trusted providers but has no affiliation with them. Compare plans on each provider's app or website.</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.iconBox}>
                <Ionicons name={item.icon as any} size={20} color={colors.brandDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.tagline}>{item.tagline}</Text>
              </View>
            </View>
            <Text style={s.coverage}>{item.coverage}</Text>
            <View style={s.features}>
              {item.features.map((f) => (
                <View key={f} style={s.featurePill}>
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => openUrl(item.websiteUrl)}>
                <Ionicons name="open-outline" size={14} color={colors.brandDark} />
                <Text style={s.actionText}>Website</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={() => openUrl(item.appStoreUrl)}>
                <Ionicons name="phone-portrait-outline" size={14} color="#fff" />
                <Text style={s.actionTextPrimary}>Get App</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}
