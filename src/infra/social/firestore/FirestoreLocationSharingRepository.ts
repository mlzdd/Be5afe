import {
  collection, doc, setDoc, updateDoc, getDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../database/firestore';
import type {
  LocationSharingRepository, LocationShare, ShareDuration,
} from '../../../shared/contracts/SocialRepository';

function strip<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function requireDb() {
  if (!db) throw new Error('Firebase not configured — add credentials to .env');
  return db;
}

function endTime(startIso: string, duration: ShareDuration): string | undefined {
  if (duration === 'indefinite') return undefined;
  const hours = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24 }[duration];
  if (!hours) return undefined;
  return new Date(new Date(startIso).getTime() + hours * 3600_000).toISOString();
}

export class FirestoreLocationSharingRepository implements LocationSharingRepository {
  subscribeToShares(userId: string, cb: (shares: LocationShare[]) => void): () => void {
    if (!db) { cb([]); return () => {}; }
    const ref = collection(db, 'users', userId, 'sharedLocation');
    return onSnapshot(ref, (snap) => {
      const shares: LocationShare[] = [];
      snap.forEach((d) => shares.push({ id: d.id, ...d.data() } as LocationShare));
      cb(shares);
    });
  }

  async createShare(share: Omit<LocationShare, 'id'>): Promise<string> {
    const db = requireDb();
    const id = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'users', share.ownerId, 'sharedLocation', id), strip({ ...share, id }));
    await setDoc(doc(db, 'locationShareTokens', share.shareToken), { ownerId: share.ownerId, shareId: id });
    return id;
  }

  async stopShare(userId: string, shareId: string): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'users', userId, 'sharedLocation', shareId), { isActive: false });
  }

  async extendShare(userId: string, shareId: string, duration: ShareDuration): Promise<void> {
    const db = requireDb();
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'users', userId, 'sharedLocation', shareId), strip({
      duration, startTime: now, endTime: endTime(now, duration), isActive: true,
    }));
  }

  async updatePosition(userId: string, shareId: string, coords: { lat: number; lng: number }): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'users', userId, 'sharedLocation', shareId), {
      currentLocation: coords,
      lastUpdatedAt: serverTimestamp(),
    });
  }

  async getShareByToken(token: string): Promise<LocationShare | null> {
    const db = requireDb();
    const tokenSnap = await getDoc(doc(db, 'locationShareTokens', token));
    if (!tokenSnap.exists()) return null;
    const { ownerId, shareId } = tokenSnap.data() as { ownerId: string; shareId: string };
    const shareSnap = await getDoc(doc(db, 'users', ownerId, 'sharedLocation', shareId));
    if (!shareSnap.exists()) return null;
    return { id: shareSnap.id, ...shareSnap.data() } as LocationShare;
  }
}
