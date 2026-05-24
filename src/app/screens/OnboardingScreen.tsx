import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { LocationSelectorSheet } from '@app/components/LocationSelectorSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import type { RootStackParamList } from '@app/navigation/types';

export const ONBOARDED_KEY = '@be5afe_onboarded';
export const WIDGET_PREFS_KEY = '@be5afe_widget_prefs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WidgetPreference = 'scam_alerts' | 'live_advisories' | 'emergency_contacts' | 'trip_planning' | 'friends_groups' | 'weather';

const WIDGET_OPTIONS: { key: WidgetPreference; icon: string; title: string; desc: string }[] = [
  { key: 'scam_alerts', icon: 'alert-circle', title: 'Scam Alerts', desc: 'Local scam patterns and warnings' },
  { key: 'live_advisories', icon: 'newspaper', title: 'Live Advisories', desc: 'FCDO & State Dept alerts' },
  { key: 'emergency_contacts', icon: 'call', title: 'Emergency Contacts', desc: 'Local emergency numbers' },
  { key: 'trip_planning', icon: 'calendar', title: 'Trip Planning', desc: 'Manage itineraries and bookings' },
  { key: 'friends_groups', icon: 'people', title: 'Friends & Groups', desc: 'Travel with trusted contacts' },
  { key: 'weather', icon: 'partly-sunny', title: 'Weather', desc: 'Forecasts and travel tips' },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

async function completeOnboarding(prefs?: WidgetPreference[]) {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  if (prefs) await AsyncStorage.setItem(WIDGET_PREFS_KEY, JSON.stringify(prefs));
}

interface Step1Props { onNext: () => void; colors: ReturnType<typeof useTheme> }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Step2Props { onNext: () => void; onSkip: () => void; colors: ReturnType<typeof useTheme>; sheetRef: React.RefObject<any> }
interface Step3Props { onDone: (prefs: WidgetPreference[]) => void; colors: ReturnType<typeof useTheme> }

function Step1({ onNext, colors }: Step1Props) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.brandDark, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl }}>
        <Ionicons name="shield-checkmark" size={52} color="#fff" />
      </View>
      <Text style={{ ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
        Be5afe
      </Text>
      <Text style={{ ...typography.h3, color: colors.textSecondary, textAlign: 'center', fontWeight: '400', lineHeight: 26, marginBottom: spacing.xl * 2 }}>
        Travel smarter. Stay safer.
      </Text>
      <TouchableOpacity
        onPress={onNext}
        style={{ backgroundColor: colors.brandDark, paddingVertical: spacing.md, paddingHorizontal: spacing.xl * 1.5, borderRadius: 14, minWidth: 200, alignItems: 'center' }}
      >
        <Text style={{ ...typography.body, fontWeight: '700', color: '#fff', fontSize: 18 }}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step2({ onNext, onSkip, colors, sheetRef }: Step2Props) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Ionicons name="location" size={56} color={colors.brandDark} style={{ marginBottom: spacing.lg }} />
      <Text style={{ ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
        Where are you going?
      </Text>
      <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl }}>
        Setting your destination lets Be5afe show you relevant scam alerts, emergency numbers, and live advisories.
      </Text>
      <TouchableOpacity
        onPress={() => sheetRef.current?.expand()}
        style={{
          backgroundColor: colors.brandDark,
          paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
          borderRadius: 14, width: '100%', alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Text style={{ ...typography.body, fontWeight: '700', color: '#fff' }}>Pick a country</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSkip}>
        <Text style={{ ...typography.body, color: colors.textTertiary }}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step3({ onDone, colors }: Step3Props) {
  const [selected, setSelected] = useState<Set<WidgetPreference>>(new Set(['scam_alerts', 'emergency_contacts']));

  function toggle(key: WidgetPreference) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, padding: spacing.xl }}>
      <Text style={{ ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm }}>
        What matters to you?
      </Text>
      <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg }}>
        We'll customise your home screen. You can change this any time in Settings.
      </Text>
      <View style={{ flex: 1, gap: spacing.sm }}>
        {WIDGET_OPTIONS.map((opt) => {
          const on = selected.has(opt.key);
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => toggle(opt.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: 12,
                backgroundColor: on ? colors.brandDark : colors.card,
                borderWidth: 1,
                borderColor: on ? colors.brandDark : colors.border,
              }}
            >
              <Ionicons name={opt.icon as any} size={22} color={on ? '#fff' : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, fontWeight: '600', color: on ? '#fff' : colors.textPrimary }}>{opt.title}</Text>
                <Text style={{ ...typography.caption, color: on ? 'rgba(255,255,255,0.75)' : colors.textSecondary }}>{opt.desc}</Text>
              </View>
              {on && <Ionicons name="checkmark" size={18} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        onPress={() => onDone(Array.from(selected))}
        style={{ backgroundColor: colors.brandDark, paddingVertical: spacing.md, borderRadius: 14, alignItems: 'center', marginTop: spacing.md }}
      >
        <Text style={{ ...typography.body, fontWeight: '700', color: '#fff', fontSize: 17 }}>Done — take me in</Text>
      </TouchableOpacity>
    </View>
  );
}

export function OnboardingScreen() {
  const colors = useTheme();
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState(0);
  const listRef = useRef<FlatList>(null);
  const locationSheetRef = useRef<BottomSheet>(null);

  function goTo(n: number) {
    setStep(n);
    listRef.current?.scrollToIndex({ index: n, animated: true });
  }

  async function finish(prefs: WidgetPreference[]) {
    await completeOnboarding(prefs);
    navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
  }

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1, backgroundColor: colors.background },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: spacing.md },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.brandDark, width: 20 },
  }), [colors]);

  const STEPS = [
    <Step1 key="s1" onNext={() => goTo(1)} colors={colors} />,
    <Step2 key="s2" onNext={() => goTo(2)} onSkip={() => goTo(2)} colors={colors} sheetRef={locationSheetRef} />,
    <Step3 key="s3" onDone={(prefs) => finish(prefs)} colors={colors} />,
  ];

  return (
    <SafeAreaView style={[s.container, s.gradient]} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={STEPS}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => item}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      />
      <View style={s.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[s.dot, i === step && s.dotActive]} />
        ))}
      </View>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <LocationSelectorSheet ref={locationSheetRef as any} onSelect={() => goTo(2)} />
    </SafeAreaView>
  );
}
