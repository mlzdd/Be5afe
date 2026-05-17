import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../database/firestore';
import type { LocationRepository, SelectedLocation } from '../../../shared/contracts/LocationRepository';

function requireDb() {
  if (!db) throw new Error('Firebase not configured — add credentials to .env');
  return db;
}

export class FirestoreLocationRepository implements LocationRepository {
  async load(userId: string): Promise<SelectedLocation | null> {
    const db = requireDb();
    const snap = await getDoc(doc(db, 'users', userId, 'context', 'location'));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.countryId || !data.cityId) return null;
    return { countryId: data.countryId, cityId: data.cityId };
  }

  async save(userId: string, location: SelectedLocation): Promise<void> {
    const db = requireDb();
    await setDoc(doc(db, 'users', userId, 'context', 'location'), {
      countryId: location.countryId,
      cityId: location.cityId,
      updatedAt: serverTimestamp(),
    });
  }
}
