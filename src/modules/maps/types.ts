import type { CountryId, CityId } from '@modules/regional-data';
import type { LatLng } from '@shared/contracts/PlacesClient';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ResolvedLocation {
  countryId: CountryId;
  cityId: CityId;
  coordinates: LatLng;
}

export function regionFromCoords(coords: LatLng, deltaDeg = 0.05): MapRegion {
  return {
    latitude: coords.lat,
    longitude: coords.lng,
    latitudeDelta: deltaDeg,
    longitudeDelta: deltaDeg,
  };
}
