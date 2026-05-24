import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@shared/ui';
import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import { useAppContext } from '@app/AppContext';
import type { RootStackParamList } from '@app/navigation/types';
import { WIDGET_METADATA, type WidgetConfig, type WidgetType } from '@products/bsafe/widgets/types';
import { countryEmergencyNumbers } from '@products/bsafe/emergency';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CURRENCY_STORAGE_KEY = '@be5afe_widget_currency';
const CURRENCIES = {
  GBP: { symbol: '£', rateToUSD: 0.79 },
  EUR: { symbol: '€', rateToUSD: 0.92 },
  USD: { symbol: '$', rateToUSD: 1 },
  THB: { symbol: '฿', rateToUSD: 35.1 },
  JPY: { symbol: '¥', rateToUSD: 149.5 },
} as const;

type CurrencyCode = keyof typeof CURRENCIES;

interface CurrencySettings {
  amount: string;
  from: CurrencyCode;
  to: CurrencyCode;
}

export function WidgetStrip() {
  const colors = useTheme();
  const navigation = useNavigation<Nav>();
  const { widgets } = useAppContext();

  if (widgets.widgets.length === 0) {
    return (
      <Card padding="lg" onPress={() => navigation.navigate('Widgets')}>
        <View style={styles.emptyRow}>
          <Ionicons name="add-circle-outline" size={22} color={colors.brandDark} />
          <Text style={[styles.emptyText, { color: colors.brandDark }]}>Add widget</Text>
        </View>
      </Card>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {widgets.widgets.map((widget) => (
        <WidgetItem key={widget.id} widget={widget} navigation={navigation} />
      ))}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Widgets')}
        style={[styles.addCard, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Ionicons name="add" size={24} color={colors.brandDark} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function WidgetItem({ widget, navigation }: { widget: WidgetConfig; navigation: Nav }) {
  switch (widget.type) {
    case 'weather':
      return <WeatherWidget onPress={() => navigation.navigate('Weather')} />;
    case 'currency':
      return <CurrencyWidget onPress={() => navigation.navigate('CurrencyConverter')} />;
    case 'trip-countdown':
      return <TripCountdownWidget onPress={() => navigation.navigate('HomeTabs', { screen: 'MyTrips' } as never)} />;
    case 'packing-progress':
      return <PackingProgressWidget onPress={() => navigation.navigate('PackingList')} />;
    case 'alerts':
      return <AlertsWidget onPress={() => navigation.navigate('LiveAlerts')} />;
    case 'emergency':
      return <EmergencyWidget onPress={() => navigation.navigate('Emergency')} />;
    case 'safety':
      return <SafetyWidget onPress={() => navigation.navigate('CountrySafety', {} as never)} />;
    default:
      return <GenericWidget widget={widget} onPress={() => navigateForWidget(widget.type, navigation)} />;
  }
}

function WeatherWidget({ onPress }: { onPress: () => void }) {
  const { location } = useAppContext();
  const label = location.selectedCityName ?? location.selectedCountryName ?? 'Select location';
  return (
    <WidgetCard icon="partly-sunny" color="#FFC107" title="Weather" value="Forecast" detail={label} onPress={onPress} />
  );
}

function CurrencyWidget({ onPress }: { onPress: () => void }) {
  const colors = useTheme();
  const [settings, setSettings] = useState<CurrencySettings>({ amount: '100', from: 'GBP', to: 'EUR' });

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_STORAGE_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw) as CurrencySettings);
    }).catch(() => {});
  }, []);

  const persist = (next: CurrencySettings) => {
    setSettings(next);
    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const numericAmount = Number.parseFloat(settings.amount) || 0;
  const converted = convertCurrency(numericAmount, settings.from, settings.to);
  const result = `${CURRENCIES[settings.to].symbol}${formatCurrency(converted, settings.to)}`;

  return (
    <Card style={styles.widgetCard} padding="md" onPress={onPress}>
      <View style={styles.widgetHeader}>
        <View style={[styles.widgetIcon, { backgroundColor: colors.success + '20' }]}>
          <Ionicons name="cash" size={18} color={colors.success} />
        </View>
        <Text style={[styles.widgetTitle, { color: colors.textSecondary }]}>Currency</Text>
      </View>
      <View style={styles.currencyRow}>
        <TextInput
          keyboardType="decimal-pad"
          value={settings.amount}
          onChangeText={(amount) => persist({ ...settings, amount })}
          style={[styles.currencyInput, { borderColor: colors.border, color: colors.textPrimary }]}
          onPressIn={(event) => event.stopPropagation()}
        />
        <TouchableOpacity
          onPress={() => persist({ ...settings, from: settings.to, to: settings.from })}
          style={styles.swapButton}
        >
          <Ionicons name="swap-horizontal" size={15} color={colors.brandDark} />
        </TouchableOpacity>
      </View>
      <Text numberOfLines={1} style={[styles.widgetValue, { color: colors.textPrimary }]}>{result}</Text>
      <Text style={[styles.widgetDetail, { color: colors.textSecondary }]}>{settings.from} to {settings.to}</Text>
    </Card>
  );
}

function TripCountdownWidget({ onPress }: { onPress: () => void }) {
  const { trips } = useAppContext();
  const nextTrip = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    return trips.trips
      .filter((trip) => startOfDay(new Date(trip.startDate)).getTime() >= today)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  }, [trips.trips]);

  const days = nextTrip ? daysUntil(nextTrip.startDate) : null;
  return (
    <WidgetCard
      icon="calendar"
      color="#9C27B0"
      title="Next trip"
      value={days == null ? 'No trip' : days === 0 ? 'Today' : `${days}d`}
      detail={nextTrip?.destination ?? 'Plan a trip'}
      onPress={onPress}
    />
  );
}

function PackingProgressWidget({ onPress }: { onPress: () => void }) {
  const { travelTools } = useAppContext();
  const total = travelTools.items.length;
  const packed = travelTools.items.filter((item) => item.packed).length;
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
  return (
    <WidgetCard
      icon="archive"
      color="#00BCD4"
      title="Packing"
      value={total > 0 ? `${packed}/${total}` : 'Empty'}
      detail={total > 0 ? `${pct}% packed` : 'Create a list'}
      progress={total > 0 ? pct : undefined}
      onPress={onPress}
    />
  );
}

function AlertsWidget({ onPress }: { onPress: () => void }) {
  const { alerts, location } = useAppContext();
  const count = countAlertsForLocation(alerts.alerts, location.selectedCountryId, location.selectedCountryName);
  return (
    <WidgetCard
      icon="alert-circle"
      color="#FF9800"
      title="Live alerts"
      value={`${count}`}
      detail={count === 1 ? 'Active alert' : 'Active alerts'}
      onPress={onPress}
    />
  );
}

function EmergencyWidget({ onPress }: { onPress: () => void }) {
  const { location } = useAppContext();
  const countryName = location.selectedCountryName ?? 'United Kingdom';
  const numbers = countryEmergencyNumbers[countryName] ?? countryEmergencyNumbers['United Kingdom'];
  return (
    <WidgetCard
      icon="call"
      color="#FF5722"
      title="Emergency"
      value={numbers.police}
      detail={`Police · ${countryName}`}
      onPress={onPress}
    />
  );
}

function SafetyWidget({ onPress }: { onPress: () => void }) {
  const { location } = useAppContext();
  return (
    <WidgetCard
      icon="shield-checkmark"
      color="#4CAF50"
      title="Safety"
      value="Guide"
      detail={location.selectedCountryName ?? 'Select location'}
      onPress={onPress}
    />
  );
}

function GenericWidget({ widget, onPress }: { widget: WidgetConfig; onPress: () => void }) {
  const meta = WIDGET_METADATA[widget.type];
  return (
    <WidgetCard
      icon={meta.icon}
      color={meta.iconColor}
      title={meta.title}
      value="Open"
      detail={meta.description}
      onPress={onPress}
    />
  );
}

function WidgetCard({
  icon,
  color,
  title,
  value,
  detail,
  progress,
  onPress,
}: {
  icon: string;
  color: string;
  title: string;
  value: string;
  detail: string;
  progress?: number;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Card style={styles.widgetCard} padding="md" onPress={onPress}>
      <View style={styles.widgetHeader}>
        <View style={[styles.widgetIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as never} size={18} color={color} />
        </View>
        <Text numberOfLines={1} style={[styles.widgetTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.widgetValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.widgetDetail, { color: colors.textSecondary }]}>{detail}</Text>
      {progress != null ? (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
      ) : null}
    </Card>
  );
}

function navigateForWidget(type: WidgetType, navigation: Nav) {
  const routes: Partial<Record<WidgetType, keyof RootStackParamList>> = {
    'nearest-hospital': 'NearestHospital',
    'share-location': 'LocationSharing',
    'local-laws': 'LocalLaws',
    'local-apps': 'LocalApps',
    documents: 'Documents',
    insurance: 'Insurance',
    'health-guide': 'HealthGuide',
    esim: 'ESim',
    friends: 'Friends',
    groups: 'Groups',
  };
  const route = routes[type] ?? 'Widgets';
  navigation.navigate(route as never);
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

function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  const usd = amount / CURRENCIES[from].rateToUSD;
  return usd * CURRENCIES[to].rateToUSD;
}

function formatCurrency(value: number, code: CurrencyCode): string {
  if (code === 'JPY') return Math.round(value).toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(date: string): number {
  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(new Date(date)).getTime();
  return Math.max(0, Math.ceil((target - today) / 86_400_000));
}

const styles = StyleSheet.create({
  strip: {
    gap: spacing.md,
    paddingRight: spacing.base,
  },
  widgetCard: {
    minHeight: 124,
    width: 152,
  },
  widgetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  widgetIcon: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  widgetTitle: {
    ...typography.caption,
    flex: 1,
  },
  widgetValue: {
    ...typography.h4,
  },
  widgetDetail: {
    ...typography.caption,
    marginTop: 2,
  },
  progressTrack: {
    borderRadius: radius.full,
    height: 5,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  emptyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.button,
  },
  addCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    height: 124,
    justifyContent: 'center',
    width: 54,
  },
  currencyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  currencyInput: {
    ...typography.bodySmall,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  swapButton: {
    padding: spacing.xs,
  },
});
