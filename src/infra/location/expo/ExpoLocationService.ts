import * as ExpoLocation from 'expo-location';
import type { LatLng } from '../../../shared/contracts/PlacesClient';

export interface ReverseGeocodeResult {
  city: string | null;
  country: string | null;
  isoCountryCode: string | null; // ISO2, e.g. 'FR'
}

export class ExpoLocationService {
  async requestPermission(): Promise<boolean> {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentPosition(): Promise<LatLng | null> {
    const granted = await this.requestPermission();
    if (!granted) return null;
    const pos = await ExpoLocation.getCurrentPositionAsync({});
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  async reverseGeocode(coords: LatLng): Promise<ReverseGeocodeResult | null> {
    const results = await ExpoLocation.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lng,
    });
    if (!results.length) return null;
    const { city, country, isoCountryCode } = results[0];
    return { city: city ?? null, country: country ?? null, isoCountryCode: isoCountryCode ?? null };
  }
}
