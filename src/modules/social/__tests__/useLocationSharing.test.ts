import { renderHook, act } from '@testing-library/react-hooks';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Mock expo-location so GPS watch never actually fires
jest.mock('expo-location', () => ({
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: { High: 5 },
}));

import { useLocationSharing } from '../useLocationSharing';
import type { LocationSharingRepository, LocationShare } from '@shared/contracts/SocialRepository';
import type { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 10)); });

function makeRepo(initial: LocationShare[] = []): jest.Mocked<LocationSharingRepository> {
  let cb: ((shares: LocationShare[]) => void) | null = null;
  return {
    subscribeToShares: jest.fn((_, c) => {
      cb = c;
      setTimeout(() => cb?.(initial), 0);
      return () => { cb = null; };
    }),
    createShare: jest.fn().mockResolvedValue('share-1'),
    stopShare: jest.fn().mockResolvedValue(undefined),
    extendShare: jest.fn().mockResolvedValue(undefined),
    updatePosition: jest.fn().mockResolvedValue(undefined),
    getShareByToken: jest.fn().mockResolvedValue(null),
    _trigger: (shares: LocationShare[]) => cb?.(shares),
  } as unknown as jest.Mocked<LocationSharingRepository> & { _trigger: (s: LocationShare[]) => void };
}

function makeGps(): jest.Mocked<ExpoLocationService> {
  return {
    requestPermission: jest.fn().mockResolvedValue(true),
    getCurrentPosition: jest.fn(),
  } as unknown as jest.Mocked<ExpoLocationService>;
}

const SHARE: LocationShare = {
  id: 'share-1',
  ownerId: 'user-1',
  recipients: [],
  duration: '1h',
  startTime: new Date(Date.now() - 1000).toISOString(),
  endTime: new Date(Date.now() + 3_600_000).toISOString(),
  shareToken: 'tok-abc',
  isActive: true,
  createdAt: new Date().toISOString(),
};

describe('useLocationSharing', () => {
  it('starts with empty shares and finishes loading', async () => {
    const repo = makeRepo();
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    expect(result.current.shares).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads shares from subscription', async () => {
    const repo = makeRepo([SHARE]);
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    expect(result.current.shares).toHaveLength(1);
    expect(result.current.shares[0].id).toBe('share-1');
  });

  it('activeShares filters out inactive shares', async () => {
    const inactive: LocationShare = { ...SHARE, id: 'share-2', isActive: false };
    const repo = makeRepo([SHARE, inactive]);
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    expect(result.current.shares).toHaveLength(2);
    expect(result.current.activeShares).toHaveLength(1);
    expect(result.current.activeShares[0].id).toBe('share-1');
  });

  it('activeShares filters out expired shares', async () => {
    const expired: LocationShare = {
      ...SHARE, id: 'share-3',
      endTime: new Date(Date.now() - 1000).toISOString(),
    };
    const repo = makeRepo([expired]);
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    expect(result.current.activeShares).toHaveLength(0);
  });

  it('returns empty shares when userId is null', async () => {
    const repo = makeRepo([SHARE]);
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, null));
    await flush();
    expect(result.current.shares).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(repo.subscribeToShares).not.toHaveBeenCalled();
  });

  it('createShare calls repository with correct shape', async () => {
    const repo = makeRepo();
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    await act(async () => {
      await result.current.createShare([], '3h', 'Meet at hotel');
    });
    expect(repo.createShare).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-1',
        duration: '3h',
        message: 'Meet at hotel',
        isActive: true,
      }),
    );
  });

  it('stopShare delegates to repository', async () => {
    const repo = makeRepo();
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    await act(async () => { await result.current.stopShare('share-1'); });
    expect(repo.stopShare).toHaveBeenCalledWith('user-1', 'share-1');
  });

  it('extendShare delegates to repository', async () => {
    const repo = makeRepo();
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, 'user-1'));
    await flush();
    await act(async () => { await result.current.extendShare('share-1', '6h'); });
    expect(repo.extendShare).toHaveBeenCalledWith('user-1', 'share-1', '6h');
  });

  it('stopShare and extendShare no-op when userId is null', async () => {
    const repo = makeRepo();
    const gps = makeGps();
    const { result } = renderHook(() => useLocationSharing(repo, gps, null));
    await flush();
    await act(async () => {
      await result.current.stopShare('share-1');
      await result.current.extendShare('share-1', '1h');
    });
    expect(repo.stopShare).not.toHaveBeenCalled();
    expect(repo.extendShare).not.toHaveBeenCalled();
  });
});
