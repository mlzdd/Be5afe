import { useState, useEffect, useCallback } from 'react';
import type { PlacesClient, Place, PlaceCategory, PlacesSearchOptions } from '@shared/contracts/PlacesClient';
import type { LatLng } from '@shared/contracts/PlacesClient';

interface NearbyPlacesState {
  places: Place[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useNearbyPlaces(
  client: PlacesClient,
  center: LatLng | null,
  category: PlaceCategory,
  options?: PlacesSearchOptions,
): NearbyPlacesState {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!center) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    client.searchNearby(center, category, options)
      .then((results) => { if (!cancelled) { setPlaces(results); setIsLoading(false); } })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load places');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [client, center?.lat, center?.lng, category, tick]); // options intentionally omitted — callers should memoize

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { places, isLoading, error, refresh };
}
