import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { RootStackParamList } from '../navigation/types';
import { useAppContext } from '../AppContext';
import { AlertCountChip } from '../components/AlertCountChip';
import { LocationSelectorSheet } from '../components/LocationSelectorSheet';
import { MiniMap } from '../components/MiniMap';
import { WidgetStrip } from '../components/WidgetStrip';
import { BottomSheetModal, Card, SectionHeader } from '@shared/ui';
import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import { useLocation } from '@modules/maps';
import { ChatScreen } from '@modules/chat/ChatScreen';
import { createChatClient } from '@infra/ai/gemini';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export function HomeScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const { location: appLocation, alerts } = useAppContext();
  const { location } = useLocation();
  const locationSheetRef = useRef<BottomSheet>(null);
  const chatSheetRef = useRef<BottomSheet>(null);
  const chatClient = useMemo(() => createChatClient(), []);

  const countryName = appLocation.selectedCountryName ?? 'Select a country';
  const cityName = appLocation.selectedCityName;
  const locationLabel = [cityName, appLocation.selectedCountryName].filter(Boolean).join(', ') || countryName;
  const alertCount = useMemo(
    () => countAlertsForLocation(alerts.alerts, appLocation.selectedCountryId, appLocation.selectedCountryName),
    [alerts.alerts, appLocation.selectedCountryId, appLocation.selectedCountryName],
  );

  const quickActions = useMemo<QuickAction[]>(() => [
    { label: 'Emergency', icon: 'call', color: colors.error, onPress: () => navigation.navigate('Emergency') },
    { label: 'Scam Alerts', icon: 'warning', color: colors.warning, onPress: () => navigation.navigate('ScamAlerts') },
    { label: 'Safe Zones', icon: 'shield-checkmark', color: colors.success, onPress: () => navigation.navigate('SafeZones') },
    { label: 'Hospital', icon: 'medical', color: colors.error, onPress: () => navigation.navigate('NearestHospital') },
    { label: 'Guides', icon: 'book', color: '#795548', onPress: () => navigation.navigate('HomeTabs', { screen: 'Guides' } as never) },
    { label: 'Currency', icon: 'cash', color: colors.success, onPress: () => navigation.navigate('CurrencyConverter') },
    { label: 'Packing', icon: 'archive', color: '#00BCD4', onPress: () => navigation.navigate('PackingList') },
    { label: 'Documents', icon: 'document-text', color: '#FF5722', onPress: () => navigation.navigate('Documents') },
    { label: 'Weather', icon: 'partly-sunny', color: '#FFB300', onPress: () => navigation.navigate('Weather') },
    { label: 'Friends', icon: 'people', color: '#00ACC1', onPress: () => navigation.navigate('Friends') },
    { label: 'Groups', icon: 'people-circle', color: '#673AB7', onPress: () => navigation.navigate('Groups') },
    { label: 'Local Apps', icon: 'apps', color: '#3F51B5', onPress: () => navigation.navigate('LocalApps') },
    { label: 'My Trips', icon: 'airplane', color: '#9C27B0', onPress: () => navigation.navigate('HomeTabs', { screen: 'MyTrips' } as never) },
    { label: 'Report Scam', icon: 'add-circle', color: colors.warning, onPress: () => navigation.navigate('ReportIncident') },
    { label: 'Chat', icon: 'chatbubble-ellipses', color: colors.info, onPress: () => chatSheetRef.current?.expand() },
    { label: 'Expenses', icon: 'receipt', color: '#4CAF50', onPress: () => navigation.navigate('Expenses') },
    { label: 'Tourist Spots', icon: 'map', color: '#FF7043', onPress: () => navigation.navigate('TouristSpots') },
    { label: 'Location Share', icon: 'location', color: '#26C6DA', onPress: () => navigation.navigate('LocationSharing') },
    { label: 'eSIM', icon: 'wifi', color: '#7E57C2', onPress: () => navigation.navigate('ESim') },
    { label: 'Insurance', icon: 'shield-checkmark', color: '#26A69A', onPress: () => navigation.navigate('Insurance') },
  ], [colors, navigation]);

  return (
    <LinearGradient
      colors={[colors.brandLight, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1.35 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.heading}>Be5afe</Text>
              <Text style={styles.sub}>Your travel safety companion</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Search"
                activeOpacity={0.8}
                onPress={() => navigation.navigate('GlobalSearch')}
                style={styles.chatButton}
              >
                <Ionicons name="search" size={22} color={colors.brandDark} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open chat"
                activeOpacity={0.8}
                onPress={() => chatSheetRef.current?.expand()}
                style={styles.chatButton}
              >
                <Ionicons name="chatbubble-ellipses" size={22} color={colors.brandDark} />
              </TouchableOpacity>
            </View>
          </View>

          <Card padding="lg" onPress={() => locationSheetRef.current?.expand()} style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={colors.brandDark} />
              </View>
              <View style={styles.locationText}>
                <Text numberOfLines={1} style={styles.locationTitle}>{locationLabel}</Text>
                <Text numberOfLines={1} style={styles.locationSub}>Tap to change destination</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>

          <MiniMap
            coordinate={location?.coordinates ?? null}
            label={locationLabel}
            onPress={() => navigation.navigate('HomeTabs', { screen: 'Map' } as never)}
          />

          <AlertCountChip
            count={alertCount}
            countryName={countryName}
            onPress={() => navigation.navigate('LiveAlerts')}
          />

          <View>
            <SectionHeader
              title="Widgets"
              action={{ label: 'Manage', onPress: () => navigation.navigate('Widgets') }}
            />
            <WidgetStrip />
          </View>

          <View>
            <SectionHeader title="Quick actions" />
            <View style={styles.grid}>
              {quickActions.map((action, index) => (
                <AnimatedQuickActionTile
                  key={action.label}
                  action={action}
                  index={index}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <LocationSelectorSheet
        ref={locationSheetRef}
        onSelect={() => locationSheetRef.current?.close()}
      />

      <BottomSheetModal
        ref={chatSheetRef}
        snapPoints={['88%']}
        contentStyle={styles.chatSheetContent}
      >
        <ChatScreen client={chatClient} onClose={() => chatSheetRef.current?.close()} />
      </BottomSheetModal>
    </LinearGradient>
  );
}

function AnimatedQuickActionTile({ action, index }: { action: QuickAction; index: number }) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateY.value = 14;
      opacity.value = withDelay(index * 30, withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }));
      translateY.value = withDelay(index * 30, withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }));
    }, [index, opacity, translateY]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrap, animatedStyle]}>
      <TouchableOpacity
        style={styles.tile}
        onPress={action.onPress}
        activeOpacity={0.75}
      >
        <View style={[styles.iconCircle, { backgroundColor: action.color + '20' }]}>
          <Ionicons name={action.icon as never} size={26} color={action.color} />
        </View>
        <Text numberOfLines={2} style={styles.tileLabel}>{action.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function countAlertsForLocation(
  alerts: Array<{ countryId: string; countryName: string }>,
  countryId: string | null,
  countryName: string | null,
): number {
  const normalizedId = countryId?.toLowerCase();
  return alerts.filter((alert) =>
    (normalizedId && alert.countryId.toLowerCase() === normalizedId) ||
    (countryName && alert.countryName === countryName),
  ).length;
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    gap: spacing.lg,
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  heading: {
    ...typography.h1,
    color: colors.brandDark,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chatButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  locationCard: {
    marginTop: spacing.xs,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  locationIcon: {
    alignItems: 'center',
    backgroundColor: colors.brandLight,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  locationSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tileWrap: {
    width: '30.8%',
  },
  tile: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    padding: spacing.sm,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 46,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 46,
  },
  tileLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    minHeight: 36,
    textAlign: 'center',
  },
  chatSheetContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
