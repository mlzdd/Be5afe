import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Linking, Platform,
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

export function NearestHospitalScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const { places, isLoading, error, refresh } = useNearbyPlaces(
    placesClient, center, 'hospital', { limit: 15 },
  );

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
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.location.lat, longitude: place.location.lng }}
            pinColor="#F44336"
          >
            <Callout>
              <View style={s.callout}>
                <Text style={s.calloutTitle}>{place.name}</Text>
                <Text style={s.calloutSub}>{place.address}</Text>
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
          <Text style={s.title}>Nearest Hospital</Text>
          <TouchableOpacity onPress={locateMe} disabled={locating} style={s.locateBtn}>
            {locating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="locate" size={22} color="#fff" />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Results panel */}
      <View style={s.panel}>
        {!center ? (
          <View style={s.hint}>
            <Ionicons name="locate-outline" size={28} color={colors.textTertiary} />
            <Text style={s.hintText}>Tap the locate button to find hospitals near you</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={{ margin: spacing.lg }} color={colors.brandDark} />
        ) : error ? (
          <View style={s.hint}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={<Text style={s.hintText}>No hospitals found nearby</Text>}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={s.card}
                onPress={() => mapRef.current?.animateToRegion(
                  regionFromCoords(item.location, 0.01), 400,
                )}
              >
                <View style={s.cardNum}>
                  <Text style={s.cardNumText}>{index + 1}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.cardAddress} numberOfLines={1}>{item.address}</Text>
                  <View style={s.cardMeta}>
                    {item.distanceMeters != null && (
                      <Text style={s.cardDist}>
                        {item.distanceMeters < 1000
                          ? `${item.distanceMeters}m`
                          : `${(item.distanceMeters / 1000).toFixed(1)}km`}
                      </Text>
                    )}
                    {item.isOpen != null && (
                      <Text style={[s.cardOpen, { color: item.isOpen ? '#4CAF50' : colors.error }]}>
                        {item.isOpen ? 'Open' : 'Closed'}
                      </Text>
                    )}
                  </View>
                </View>
                {item.phoneNumber && (
                  <TouchableOpacity
                    style={s.callBtn}
                    onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
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
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: 280, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 6 },
  hint: { alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  hintText: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },
  errorText: { ...typography.bodySmall, color: colors.error },
  retryText: { ...typography.body, color: colors.brandDark },
  list: { padding: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F4433620', alignItems: 'center', justifyContent: 'center' },
  cardNumText: { ...typography.caption, color: '#F44336', fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  cardAddress: { ...typography.caption, color: colors.textSecondary },
  cardMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  cardDist: { ...typography.caption, color: colors.brandDark },
  cardOpen: { ...typography.caption, fontWeight: '600' },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  callout: { padding: spacing.sm, maxWidth: 180 },
  calloutTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  calloutSub: { ...typography.bodySmall, color: colors.textSecondary },
});
