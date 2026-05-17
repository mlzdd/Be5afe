import type {
  PlacesClient, Place, PlaceCategory, LatLng, PlacesSearchOptions,
} from '../../../shared/contracts/PlacesClient';
import { PlacesNetworkError, PlacesQuotaError, PlacesAuthError } from '../../../shared/contracts/PlacesClient';

const CATEGORY_TO_GTYPE: Record<PlaceCategory, string> = {
  hospital:      'hospital',
  pharmacy:      'pharmacy',
  doctor:        'doctor',
  airport:       'airport',
  train_station: 'train_station',
  bus_station:   'bus_station',
  restaurant:    'restaurant',
  cafe:          'cafe',
  atm:           'atm',
  bank:          'bank',
  police:        'police',
  gas_station:   'gas_station',
  embassy:       'embassy',
};

const DEFAULT_RADIUS: Record<PlaceCategory, number> = {
  hospital:      10000,
  pharmacy:      5000,
  doctor:        5000,
  airport:       50000,
  train_station: 5000,
  bus_station:   3000,
  restaurant:    1000,
  cafe:          1000,
  atm:           1000,
  bank:          2000,
  police:        5000,
  gas_station:   5000,
  embassy:       20000,
};

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export class GooglePlacesClient implements PlacesClient {
  constructor(private readonly apiKey: string) {}

  async searchNearby(
    center: LatLng,
    category: PlaceCategory,
    options: PlacesSearchOptions = {},
  ): Promise<Place[]> {
    const radius = options.radiusMeters ?? DEFAULT_RADIUS[category];
    const limit = options.limit ?? 10;
    const type = CATEGORY_TO_GTYPE[category];

    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${center.lat},${center.lng}` +
      `&radius=${radius}` +
      `&type=${type}` +
      `&key=${this.apiKey}`;

    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new PlacesNetworkError('Network request failed');
    }

    if (res.status === 403) throw new PlacesAuthError('Invalid API key');

    const json = await res.json() as {
      status: string;
      results: Array<{
        place_id: string;
        name: string;
        vicinity: string;
        geometry: { location: { lat: number; lng: number } };
        rating?: number;
        opening_hours?: { open_now?: boolean };
        formatted_phone_number?: string;
      }>;
    };

    if (json.status === 'REQUEST_DENIED') throw new PlacesAuthError('Request denied');
    if (json.status === 'OVER_QUERY_LIMIT') throw new PlacesQuotaError('Quota exceeded');
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') throw new PlacesNetworkError(json.status);

    return json.results.slice(0, limit).map((r) => ({
      id: r.place_id,
      name: r.name,
      category,
      location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
      address: r.vicinity,
      distanceMeters: Math.round(haversineMeters(center, r.geometry.location)),
      rating: r.rating,
      isOpen: r.opening_hours?.open_now,
      phoneNumber: r.formatted_phone_number,
    }));
  }
}
