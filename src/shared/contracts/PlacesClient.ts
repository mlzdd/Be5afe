export type PlaceCategory =
  | 'hospital'
  | 'pharmacy'
  | 'doctor'
  | 'airport'
  | 'train_station'
  | 'bus_station'
  | 'restaurant'
  | 'cafe'
  | 'atm'
  | 'bank'
  | 'police'
  | 'gas_station'
  | 'embassy';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  location: LatLng;
  address: string;
  distanceMeters?: number;
  rating?: number;
  isOpen?: boolean;
  phoneNumber?: string;
}

export interface PlacesSearchOptions {
  radiusMeters?: number;
  limit?: number;
}

export interface PlacesClient {
  searchNearby(
    center: LatLng,
    category: PlaceCategory,
    options?: PlacesSearchOptions,
  ): Promise<Place[]>;
}

// Typed domain errors
export class PlacesNetworkError extends Error {
  readonly type = 'network' as const;
}
export class PlacesQuotaError extends Error {
  readonly type = 'quota' as const;
}
export class PlacesAuthError extends Error {
  readonly type = 'auth' as const;
}
