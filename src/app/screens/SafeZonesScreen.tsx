import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, Linking, Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useNearbyPlaces } from '@modules/maps/useNearbyPlaces';
import { regionFromCoords } from '@modules/maps/types';
import { GooglePlacesClient } from '@infra/places/google/GooglePlacesClient';
import { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';
import type { LatLng } from '@shared/contracts/PlacesClient';

const placesClient = new GooglePlacesClient(
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '',
);
const gpsService = new ExpoLocationService();

function openDirections(place: { location: LatLng; name: string }) {
  const label = encodeURIComponent(place.name);
  const url = Platform.select({
    ios: `maps://?q=${label}&ll=${place.location.lat},${place.location.lng}`,
    android: `geo:${place.location.lat},${place.location.lng}?q=${place.location.lat},${place.location.lng}(${label})`,
    default: `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`,
  });
  Linking.openURL(url).catch(() => Alert.alert('Could not open maps', place.name));
}

function callPlace(phoneNumber?: string) {
  if (!phoneNumber) {
    Alert.alert('No phone number', 'No phone number is available for this place.');
    return;
  }
  Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert('Cannot dial', phoneNumber));
}

export function SafeZonesScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const { places: police } = useNearbyPlaces(placesClient, center, 'police', { limit: 8 });
  const { places: embassies, isLoading } = useNearbyPlaces(placesClient, center, 'embassy', { limit: 5 });

  const allPlaces = [...police, ...embassies];

  const locateMe = useCallback(async () => {
    setLocating(true);
    const coords = await gpsService.getCurrentPosition();
    setLocating(false);
    if (!coords) return;
    setCenter(coords);
    mapRef.current?.animateToRegion(regionFromCoords(coords, 0.05), 600);
  }, []);

  return (
    <View style={s.flex}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ latitude: 13.75, longitude: 100.5, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {police.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.location.lat, longitude: p.location.lng }} pinColor="#2196F3">
            <Callout>
              <View style={s.callout}>
                <Text style={s.calloutTitle}>{p.name}</Text>
                <Text style={s.calloutSub}>Police Station</Text>
              </View>
            </Callout>
          </Marker>
        ))}
        {embassies.map((e) => (
          <Marker key={e.id} coordinate={{ latitude: e.location.lat, longitude: e.location.lng }} pinColor="#9C27B0">
            <Callout>
              <View style={s.callout}>
                <Text style={s.calloutTitle}>{e.name}</Text>
                <Text style={s.calloutSub}>Embassy / Consulate</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView edges={['top']} style={s.headerOverlay}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>Safe Zones</Text>
          <TouchableOpacity onPress={locateMe} disabled={locating} style={s.locateBtn}>
            {locating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="locate" size={22} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={s.legendText}>Police</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#9C27B0' }]} />
            <Text style={s.legendText}>Embassy</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Results panel */}
      <View style={s.panel}>
        {!center ? (
          <View style={s.hint}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.textTertiary} />
            <Text style={s.hintText}>Tap locate to find police stations and embassies near you</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={{ margin: spacing.lg }} color={colors.brandDark} />
        ) : allPlaces.length === 0 ? (
          <View style={s.hint}>
            <Text style={s.hintText}>No safe zones found in this area</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cards}>
            {allPlaces.map((place) => {
              const isPolice = place.category === 'police';
              return (
                <TouchableOpacity
                  key={place.id}
                  style={s.card}
                  onPress={() => mapRef.current?.animateToRegion(
                    regionFromCoords(place.location, 0.01), 400,
                  )}
                >
                  <View style={[s.cardIcon, { backgroundColor: (isPolice ? '#2196F3' : '#9C27B0') + '20' }]}>
                    <Ionicons
                      name={isPolice ? 'shield' : 'business'}
                      size={18}
                      color={isPolice ? '#2196F3' : '#9C27B0'}
                    />
                  </View>
                  <Text style={s.cardName} numberOfLines={2}>{place.name}</Text>
                  {place.distanceMeters != null && (
                    <Text style={s.cardDist}>
                      {place.distanceMeters < 1000
                        ? `${place.distanceMeters}m`
                        : `${(place.distanceMeters / 1000).toFixed(1)}km`}
                    </Text>
                  )}
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.cardAction} onPress={() => openDirections(place)}>
                      <Ionicons name="navigate" size={14} color={colors.brandDark} />
                      <Text style={s.cardActionText}>Directions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.cardAction} onPress={() => callPlace(place.phoneNumber)}>
                      <Ionicons name="call" size={14} color={colors.brandDark} />
                      <Text style={s.cardActionText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark + 'DD', gap: spacing.md },
  back: { padding: 4 },
  title: { ...typography.h2, color: '#fff', flex: 1 },
  locateBtn: { padding: 4 },
  legend: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.base, paddingBottom: spacing.sm, backgroundColor: colors.brandDark + 'BB' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: '#fff' },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: spacing.md, minHeight: 110, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 6 },
  hint: { alignItems: 'center', padding: spacing.base, gap: spacing.sm },
  hintText: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },
  cards: { paddingHorizontal: spacing.base, gap: spacing.sm },
  card: { width: 160, backgroundColor: colors.background, borderRadius: 10, padding: spacing.sm, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  cardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardName: { ...typography.caption, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  cardDist: { ...typography.caption, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.brandDark + '10', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 4 },
  cardActionText: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  callout: { padding: spacing.sm, maxWidth: 180 },
  calloutTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  calloutSub: { ...typography.bodySmall, color: colors.textSecondary },
});
