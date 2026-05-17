import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@shared/theme';
import { useNearbyPlaces } from '@modules/maps/useNearbyPlaces';
import { regionFromCoords } from '@modules/maps/types';
import { GooglePlacesClient } from '@infra/places/google/GooglePlacesClient';
import { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';
import type { PlaceCategory, LatLng } from '@shared/contracts/PlacesClient';

type Category = { key: PlaceCategory; label: string; icon: string; color: string };

const CATEGORIES: Category[] = [
  { key: 'hospital',  label: 'Hospital',  icon: 'medical',        color: '#F44336' },
  { key: 'police',    label: 'Police',    icon: 'shield',          color: '#2196F3' },
  { key: 'pharmacy',  label: 'Pharmacy',  icon: 'flask',           color: '#4CAF50' },
  { key: 'restaurant',label: 'Food',      icon: 'restaurant',      color: '#FF9800' },
  { key: 'atm',       label: 'ATM',       icon: 'card',            color: '#9C27B0' },
];

const placesClient = new GooglePlacesClient(
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '',
);
const gpsService = new ExpoLocationService();

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('hospital');

  const { places, isLoading, error, refresh } = useNearbyPlaces(
    placesClient, center, activeCategory,
  );

  const region = useMemo(
    () => center ? regionFromCoords(center, 0.04) : undefined,
    [center],
  );

  const locateMe = useCallback(async () => {
    setLocating(true);
    const coords = await gpsService.getCurrentPosition();
    setLocating(false);
    if (!coords) return;
    setCenter(coords);
    mapRef.current?.animateToRegion(regionFromCoords(coords, 0.04), 600);
  }, []);

  return (
    <View style={s.flex}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={s.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region ?? { latitude: 13.75, longitude: 100.5, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {places.map((place) => {
          const cat = CATEGORIES.find((c) => c.key === place.category);
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.location.lat, longitude: place.location.lng }}
              pinColor={cat?.color ?? colors.brandDark}
            >
              <Callout>
                <View style={s.callout}>
                  <Text style={s.calloutTitle}>{place.name}</Text>
                  <Text style={s.calloutSub}>{place.address}</Text>
                  {place.distanceMeters != null && (
                    <Text style={s.calloutDist}>
                      {place.distanceMeters < 1000
                        ? `${place.distanceMeters}m away`
                        : `${(place.distanceMeters / 1000).toFixed(1)}km away`}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Category chips */}
      <SafeAreaView edges={['top']} style={s.topOverlay}>
        <View style={s.chips}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.chip, activeCategory === c.key && { backgroundColor: c.color }]}
              onPress={() => { setActiveCategory(c.key); if (center) refresh(); }}
            >
              <Ionicons
                name={c.icon as never}
                size={14}
                color={activeCategory === c.key ? '#fff' : colors.textSecondary}
              />
              <Text style={[s.chipText, activeCategory === c.key && s.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Locate me button */}
      <View style={s.locateBtn}>
        <TouchableOpacity style={s.locateCircle} onPress={locateMe} disabled={locating}>
          {locating
            ? <ActivityIndicator size="small" color={colors.brandDark} />
            : <Ionicons name="locate" size={22} color={colors.brandDark} />}
        </TouchableOpacity>
      </View>

      {/* Results list */}
      <View style={s.listPanel}>
        {!center ? (
          <View style={s.hint}>
            <Ionicons name="locate-outline" size={24} color={colors.textTertiary} />
            <Text style={s.hintText}>Tap the locate button to find places near you</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={{ marginTop: spacing.md }} color={colors.brandDark} />
        ) : error ? (
          <View style={s.hint}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.placesList}
            ListEmptyComponent={
              <Text style={s.hintText}>No {activeCategory.replace('_', ' ')}s found nearby</Text>
            }
            renderItem={({ item }) => {
              const cat = CATEGORIES.find((c) => c.key === item.category);
              return (
                <TouchableOpacity
                  style={s.placeCard}
                  onPress={() => mapRef.current?.animateToRegion(
                    regionFromCoords(item.location, 0.01), 400,
                  )}
                >
                  <View style={[s.placeIcon, { backgroundColor: (cat?.color ?? colors.brandDark) + '20' }]}>
                    <Ionicons name={cat?.icon as never ?? 'location'} size={18} color={cat?.color ?? colors.brandDark} />
                  </View>
                  <Text style={s.placeName} numberOfLines={1}>{item.name}</Text>
                  {item.distanceMeters != null && (
                    <Text style={s.placeDist}>
                      {item.distanceMeters < 1000
                        ? `${item.distanceMeters}m`
                        : `${(item.distanceMeters / 1000).toFixed(1)}km`}
                    </Text>
                  )}
                  {item.isOpen != null && (
                    <Text style={[s.placeOpen, { color: item.isOpen ? '#4CAF50' : colors.error }]}>
                      {item.isOpen ? 'Open' : 'Closed'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  chips: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingTop: spacing.sm, gap: spacing.xs, flexWrap: 'nowrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  locateBtn: { position: 'absolute', right: spacing.base, bottom: 200 },
  locateCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  listPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: spacing.md, minHeight: 120, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 6 },
  hint: { alignItems: 'center', justifyContent: 'center', padding: spacing.base, gap: spacing.sm },
  hintText: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },
  errorText: { ...typography.bodySmall, color: colors.error },
  retryText: { ...typography.body, color: colors.brandDark },
  placesList: { paddingHorizontal: spacing.base, gap: spacing.sm },
  placeCard: { width: 130, backgroundColor: colors.background, borderRadius: 10, padding: spacing.sm, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  placeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  placeName: { ...typography.caption, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  placeDist: { ...typography.caption, color: colors.textSecondary },
  placeOpen: { ...typography.caption, fontWeight: '600' },
  callout: { padding: spacing.sm, maxWidth: 200 },
  calloutTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  calloutSub: { ...typography.bodySmall, color: colors.textSecondary },
  calloutDist: { ...typography.caption, color: colors.brandDark, marginTop: 2 },
});
