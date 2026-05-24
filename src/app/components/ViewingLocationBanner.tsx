import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import { useAppContext } from '@app/AppContext';
import { getCountryByName } from '@modules/regional-data';

export function ViewingLocationBanner() {
  const colors = useTheme();
  const { location } = useAppContext();

  if (!location.selectedCountryName) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.warning + '18' }]}>
        <Ionicons name="location-outline" size={16} color={colors.warning} />
        <Text style={[styles.text, { color: colors.textPrimary }]}>Select a country for localised guidance</Text>
      </View>
    );
  }

  const country = getCountryByName(location.selectedCountryName);
  const label = [location.selectedCityName, location.selectedCountryName].filter(Boolean).join(', ');

  return (
    <View style={[styles.banner, { backgroundColor: colors.brandDark + '10' }]}>
      <Ionicons name="location" size={16} color={colors.brandDark} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>
        Viewing: {label} {country?.flag ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.caption,
    flex: 1,
    fontWeight: '600',
  },
});
