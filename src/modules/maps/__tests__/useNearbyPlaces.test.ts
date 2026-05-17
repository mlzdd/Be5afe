import { renderHook, act } from '@testing-library/react-hooks';
import { useNearbyPlaces } from '../useNearbyPlaces';
import type { PlacesClient, Place, LatLng } from '@shared/contracts/PlacesClient';

const PARIS: LatLng = { lat: 48.8566, lng: 2.3522 };

function makeClient(impl: PlacesClient['searchNearby']): PlacesClient {
  return { searchNearby: impl };
}

const MOCK_PLACE: Place = {
  id: 'p1', name: 'City Hospital', category: 'hospital',
  location: { lat: 48.86, lng: 2.36 }, address: '1 Rue de Rivoli',
  distanceMeters: 500,
};

describe('useNearbyPlaces', () => {
  it('returns places after fetch', async () => {
    const client = makeClient(() => Promise.resolve([MOCK_PLACE]));
    const { result } = renderHook(() => useNearbyPlaces(client, PARIS, 'hospital'));
    await act(async () => {});
    expect(result.current.places).toHaveLength(1);
    expect(result.current.places[0].name).toBe('City Hospital');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const client = makeClient(() => Promise.reject(new Error('Network down')));
    const { result } = renderHook(() => useNearbyPlaces(client, PARIS, 'hospital'));
    await act(async () => {});
    expect(result.current.error).toBe('Network down');
    expect(result.current.places).toHaveLength(0);
  });

  it('does not fetch when center is null', async () => {
    let called = false;
    const client = makeClient(() => { called = true; return Promise.resolve([]); });
    renderHook(() => useNearbyPlaces(client, null, 'hospital'));
    await act(async () => {});
    expect(called).toBe(false);
  });

  it('refresh triggers a new fetch', async () => {
    let callCount = 0;
    const client = makeClient(() => { callCount++; return Promise.resolve([]); });
    const { result } = renderHook(() => useNearbyPlaces(client, PARIS, 'hospital'));
    await act(async () => {});
    await act(async () => { result.current.refresh(); });
    await act(async () => {});
    expect(callCount).toBe(2);
  });
});
