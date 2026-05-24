import { renderHook, act } from '@testing-library/react-native';
import { useTrips } from '../useTrips';
import type { TripsRepository, Trip } from '@shared/contracts/TripsRepository';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const ME = { uid: 'user-1' };

const TRIP: Trip = {
  id: 't-1', destination: 'Paris', country: 'France',
  startDate: '2026-06-01', endDate: '2026-06-07',
  itinerary: [], bookings: [],
  createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};

function makeRepo(overrides: Partial<TripsRepository> = {}): TripsRepository {
  return {
    subscribeToTrips: (_uid, cb) => { setTimeout(() => cb([]), 0); return () => {}; },
    addTrip: () => Promise.resolve('t-new'),
    updateTrip: () => Promise.resolve(),
    deleteTrip: () => Promise.resolve(),
    addActivity: () => Promise.resolve(),
    updateActivity: () => Promise.resolve(),
    deleteActivity: () => Promise.resolve(),
    addBooking: () => Promise.resolve(),
    deleteBooking: () => Promise.resolve(),
    ...overrides,
  };
}

describe('useTrips', () => {
  it('starts empty with isLoading false', async () => {
    const { result } = renderHook(() => useTrips(makeRepo(), ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.trips).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('populates trips from subscription', async () => {
    const repo = makeRepo({
      subscribeToTrips: (_uid, cb) => { setTimeout(() => cb([TRIP]), 0); return () => {}; },
    });
    const { result } = renderHook(() => useTrips(repo, ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.trips).toHaveLength(1);
    expect(result.current.trips[0].destination).toBe('Paris');
  });

  it('getTripById finds a trip', async () => {
    const repo = makeRepo({
      subscribeToTrips: (_uid, cb) => { setTimeout(() => cb([TRIP]), 0); return () => {}; },
    });
    const { result } = renderHook(() => useTrips(repo, ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.getTripById('t-1')?.destination).toBe('Paris');
    expect(result.current.getTripById('nope')).toBeUndefined();
  });

  it('addTrip delegates to repository', async () => {
    let called = false;
    const repo = makeRepo({ addTrip: () => { called = true; return Promise.resolve('t-new'); } });
    const { result } = renderHook(() => useTrips(repo, ME));
    await act(async () => {
      await result.current.addTrip({ destination: 'Tokyo', country: 'Japan', startDate: '2026-07-01', endDate: '2026-07-10' });
    });
    expect(called).toBe(true);
  });

  it('returns empty when currentUser is null', async () => {
    const { result } = renderHook(() => useTrips(makeRepo(), null));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.trips).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
