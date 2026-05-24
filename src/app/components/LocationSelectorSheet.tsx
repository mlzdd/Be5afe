import React, { forwardRef, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheetModal } from '@shared/ui';
import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import {
  getCitiesForCountry,
  searchCities,
  searchCountries,
  type City,
  type Country,
} from '@modules/regional-data';
import { useLocation } from '@modules/maps';

interface LocationSelectorSheetProps {
  onSelect?: () => void;
  onLocationSelect?: (countryId: string, cityId: string) => void;
}

export const LocationSelectorSheet = forwardRef<BottomSheet, LocationSelectorSheetProps>(
  ({ onSelect, onLocationSelect }, ref) => {
    const colors = useTheme();
    const { location, setLocation } = useLocation();
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState<Country | null>(null);

    const countries = useMemo(() => searchCountries(query).slice(0, 80), [query]);
    const cities = useMemo(() => {
      if (!country) return [];
      return searchCities(query, country.id).slice(0, 80);
    }, [country, query]);

    const chooseCountry = (next: Country) => {
      setCountry(next);
      setQuery('');
    };

    const chooseCity = (city: City) => {
      setLocation(city.countryId, city.id);
      onLocationSelect?.(city.countryId, city.id);
      onSelect?.();
    };

    const chooseCountryDefault = () => {
      if (!country) return;
      const city = getCitiesForCountry(country.id)[0];
      if (!city) return;
      setLocation(country.id, city.id);
      onLocationSelect?.(country.id, city.id);
      onSelect?.();
    };

    const selectedId = location?.cityId;

    return (
      <BottomSheetModal ref={ref} snapPoints={['72%', '92%']} title="Select Location">
        <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={country ? `Search cities in ${country.name}` : 'Search countries'}
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {country ? (
          <TouchableOpacity style={styles.backRow} onPress={() => { setCountry(null); setQuery(''); }}>
            <Ionicons name="chevron-back" size={18} color={colors.brandDark} />
            <Text style={[styles.backText, { color: colors.brandDark }]}>Countries</Text>
          </TouchableOpacity>
        ) : null}

        {country ? (
          <FlatList
            data={cities}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={chooseCountryDefault}
              >
                <Text style={styles.flag}>{country.flag}</Text>
                <View style={styles.rowText}>
                  <Text style={[styles.primary, { color: colors.textPrimary }]}>Use {country.name}</Text>
                  <Text style={[styles.secondary, { color: colors.textSecondary }]}>Default city</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => chooseCity(item)}
              >
                <Ionicons name="business-outline" size={22} color={colors.textSecondary} />
                <View style={styles.rowText}>
                  <Text style={[styles.primary, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.secondary, { color: colors.textSecondary }]}>{country.name}</Text>
                </View>
                {selectedId === item.id ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                ) : null}
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={countries}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => chooseCountry(item)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.rowText}>
                  <Text style={[styles.primary, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.secondary, { color: colors.textSecondary }]}>{item.iso2}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          />
        )}
      </BottomSheetModal>
    );
  },
);

LocationSelectorSheet.displayName = 'LocationSelectorSheet';

const styles = StyleSheet.create({
  searchBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.md,
  },
  backRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backText: {
    ...typography.label,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingVertical: spacing.sm,
  },
  flag: {
    fontSize: 24,
    width: 30,
  },
  rowText: {
    flex: 1,
  },
  primary: {
    ...typography.body,
    fontWeight: '600',
  },
  secondary: {
    ...typography.caption,
    marginTop: 2,
  },
});
