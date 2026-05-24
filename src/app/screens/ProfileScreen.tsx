import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import { Card, SettingsRow, SettingsSection } from '@shared/ui';
import { useAppContext } from '../AppContext';
import { useAuth } from '@modules/auth/AuthContext';
import { useUserPreferences } from '@modules/user-preferences/UserPreferencesContext';
import type { Currency } from '@modules/user-preferences/types';
import { getCityById, getCountryById } from '@modules/regional-data';
import { LocationSelectorSheet } from '../components/LocationSelectorSheet';

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1 },
  { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.79 },
  { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.92 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exchangeRate: 149.5 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', exchangeRate: 35.1 },
];

export function ProfileScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const { auth, userProfile } = useAppContext();
  const { session, signOut } = useAuth();
  const {
    preferences,
    setThemeMode,
    setDisplayCurrency,
    setDefaultLocation,
    setNotifications,
  } = useUserPreferences();
  const locationSheetRef = useRef<BottomSheet>(null);
  const [displayName, setDisplayName] = useState('');
  const [nationality, setNationality] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    setDisplayName(userProfile.profile.displayName);
    setNationality(userProfile.profile.nationality ?? '');
    setHomeCountry(userProfile.profile.homeCountry ?? '');
    setPhoneNumber(userProfile.profile.phoneNumber ?? '');
  }, [userProfile.profile]);

  const defaultCountry = preferences.defaultCountryId
    ? getCountryById(preferences.defaultCountryId as never)
    : null;
  const defaultCity = preferences.defaultCityId
    ? getCityById(preferences.defaultCityId as never)
    : null;
  const defaultLocationLabel = [defaultCity?.name, defaultCountry?.name].filter(Boolean).join(', ') || 'Not set';
  const isAuthenticated = session.kind === 'authenticated' && !!auth.user;

  const savePersonal = async () => {
    await userProfile.saveProfile({
      displayName: displayName.trim(),
      nationality: nationality.trim() || undefined,
      homeCountry: homeCountry.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
    });
    Alert.alert('Profile saved', 'Your personal details have been updated.');
  };

  const cycleCurrency = () => {
    const index = CURRENCIES.findIndex((currency) => currency.code === preferences.displayCurrency.code);
    setDisplayCurrency(CURRENCIES[(index + 1) % CURRENCIES.length]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {isAuthenticated ? (
          <SettingsSection title="Personal">
            <View style={styles.profileHeader}>
              <Ionicons name="person-circle" size={58} color={colors.brandDark} />
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{displayName || auth.user?.displayName || 'Traveller'}</Text>
                <Text style={styles.profileEmail}>{auth.user?.email}</Text>
              </View>
            </View>
            <View style={styles.form}>
              <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Traveller name" />
              <Field label="Nationality" value={nationality} onChangeText={setNationality} placeholder="Optional" />
              <Field label="Home country" value={homeCountry} onChangeText={setHomeCountry} placeholder="Optional" />
              <Field label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Optional" keyboardType="phone-pad" />
              <TouchableOpacity
                activeOpacity={0.82}
                disabled={userProfile.isSaving}
                onPress={savePersonal}
                style={[styles.saveButton, userProfile.isSaving && styles.disabledButton]}
              >
                <Text style={styles.saveText}>{userProfile.isSaving ? 'Saving...' : 'Save profile'}</Text>
              </TouchableOpacity>
            </View>
          </SettingsSection>
        ) : (
          <Card padding="lg" style={styles.guestCard}>
            <Ionicons name="person-circle-outline" size={56} color={colors.textTertiary} />
            <Text style={styles.guestTitle}>Browsing as guest</Text>
            <Text style={styles.guestSub}>Preferences stay on this device. Sign in from the welcome screen to sync personal data.</Text>
          </Card>
        )}

        <SettingsSection title="Preferences">
          <SettingsRow
            label="Default country"
            value={defaultLocationLabel}
            onPress={() => locationSheetRef.current?.expand()}
          />
          <SettingsRow
            label="Default currency"
            value={`${preferences.displayCurrency.code} ${preferences.displayCurrency.symbol}`}
            onPress={cycleCurrency}
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow
            label="Dark mode"
            value={preferences.themeMode === 'system' ? 'System' : undefined}
            right={
              <Switch
                value={preferences.themeMode === 'dark'}
                onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={preferences.themeMode === 'dark' ? colors.brandDark : colors.textTertiary}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            label="General alerts"
            right={
              <Switch
                value={preferences.notifications.general}
                onValueChange={(general) => setNotifications({ ...preferences.notifications, general })}
              />
            }
          />
          <SettingsRow
            label="Critical safety"
            right={
              <Switch
                value={preferences.notifications.criticalSafety}
                onValueChange={(criticalSafety) => setNotifications({ ...preferences.notifications, criticalSafety })}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Data">
          <SettingsRow label="Emergency medical card" onPress={() => navigation.navigate('EmergencyMedicalCard' as never)} />
          <SettingsRow label="Travel documents" onPress={() => navigation.navigate('Documents' as never)} />
          {isAuthenticated ? (
            <SettingsRow
              label="Delete account"
              onPress={() => Alert.alert('Delete account', 'Account deletion is part of the D8 GDPR flow and is not enabled yet.')}
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="Version" value="1.0.0" />
          <SettingsRow label="Send feedback" onPress={() => Linking.openURL('mailto:feedback@be5afe.app').catch(() => {})} />
        </SettingsSection>

        {isAuthenticated ? (
          <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <LocationSelectorSheet
        ref={locationSheetRef}
        onLocationSelect={(countryId, cityId) => setDefaultLocation(countryId, cityId)}
        onSelect={() => locationSheetRef.current?.close()}
      />
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.brandDark,
    padding: spacing.base,
  },
  title: {
    ...typography.h2,
    color: colors.textInverse,
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  form: {
    gap: spacing.md,
    padding: spacing.base,
    paddingTop: 0,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.brandDark,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  disabledButton: {
    opacity: 0.55,
  },
  saveText: {
    ...typography.button,
    color: colors.textInverse,
  },
  guestCard: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  guestTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  guestSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  signOut: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.error + '12',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  signOutText: {
    ...typography.button,
    color: colors.error,
  },
});
