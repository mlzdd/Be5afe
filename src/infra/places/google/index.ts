import { GooglePlacesClient } from './GooglePlacesClient';
import { MockPlacesClient } from './MockPlacesClient';
import type { PlacesClient } from '../../../shared/contracts/PlacesClient';

export { GooglePlacesClient } from './GooglePlacesClient';
export { MockPlacesClient } from './MockPlacesClient';

export function createPlacesClient(): PlacesClient {
  const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
  if (key) return new GooglePlacesClient(key);
  if (__DEV__) return new MockPlacesClient();
  throw new Error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is required in production');
}
