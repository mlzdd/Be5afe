import { useState, useEffect, useCallback, useRef } from 'react';
import { watchPositionAsync, Accuracy } from 'expo-location';
import type {
  LocationSharingRepository, LocationShare, ShareDuration, ShareRecipient,
} from '@shared/contracts/SocialRepository';
import type { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';

interface LocationSharingState {
  shares: LocationShare[];
  activeShares: LocationShare[];
  isLoading: boolean;
  createShare: (recipients: ShareRecipient[], duration: ShareDuration, message?: string) => Promise<void>;
  stopShare: (shareId: string) => Promise<void>;
  extendShare: (shareId: string, duration: ShareDuration) => Promise<void>;
}

function makeToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function calcEndTime(startIso: string, duration: ShareDuration): string | undefined {
  if (duration === 'indefinite') return undefined;
  const hours = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24 }[duration];
  if (!hours) return undefined;
  return new Date(new Date(startIso).getTime() + hours * 3600_000).toISOString();
}

export function useLocationSharing(
  repository: LocationSharingRepository,
  gpsService: ExpoLocationService,
  userId: string | null,
): LocationSharingState {
  const [shares, setShares] = useState<LocationShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const watchRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!userId) { setShares([]); setIsLoading(false); return; }
    return repository.subscribeToShares(userId, (s) => { setShares(s); setIsLoading(false); });
  }, [repository, userId]);

  const activeShares = shares.filter((s) => {
    if (!s.isActive) return false;
    if (!s.endTime) return true;
    return new Date(s.endTime).getTime() > Date.now();
  });

  // Start/stop GPS tracking based on whether there are active shares
  useEffect(() => {
    if (!userId) return;

    if (activeShares.length > 0 && !watchRef.current) {
      let cancelled = false;
      gpsService.requestPermission().then(async (granted) => {
        if (!granted || cancelled) return;
        const sub = await watchPositionAsync(
          { accuracy: Accuracy.High, timeInterval: 30_000, distanceInterval: 50 },
          async (loc) => {
            const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            for (const share of activeShares) {
              repository.updatePosition(userId, share.id, coords).catch(() => {});
            }
          },
        );
        if (!cancelled) watchRef.current = sub;
        else sub.remove();
      });
      return () => { cancelled = true; };
    }

    if (activeShares.length === 0 && watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, [activeShares.length, userId, repository, gpsService]);

  // Cleanup on unmount
  useEffect(() => () => { watchRef.current?.remove(); }, []);

  const createShare = useCallback(async (
    recipients: ShareRecipient[], duration: ShareDuration, message?: string,
  ) => {
    if (!userId) return;
    const now = new Date().toISOString();
    await repository.createShare({
      ownerId: userId, recipients, duration, message,
      startTime: now, endTime: calcEndTime(now, duration),
      shareToken: makeToken(), isActive: true, createdAt: now,
    });
  }, [repository, userId]);

  const stopShare = useCallback((shareId: string) => {
    if (!userId) return Promise.resolve();
    return repository.stopShare(userId, shareId);
  }, [repository, userId]);

  const extendShare = useCallback((shareId: string, duration: ShareDuration) => {
    if (!userId) return Promise.resolve();
    return repository.extendShare(userId, shareId, duration);
  }, [repository, userId]);

  return { shares, activeShares, isLoading, createShare, stopShare, extendShare };
}
