import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import type { LocationRepository, SelectedLocation } from '@shared/contracts/LocationRepository';
import { db } from '@infra/database/firestore';

const STORAGE_KEY = '@be5afe_selected_location';
const GUEST_USER_ID = 'guest';

function isSelectedLocation(value: unknown): value is SelectedLocation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SelectedLocation>;
  return typeof candidate.countryId === 'string' && typeof candidate.cityId === 'string';
}

async function loadLocal(): Promise<SelectedLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isSelectedLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function saveLocal(location: SelectedLocation): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export class HybridLocationRepository implements LocationRepository {
  async load(userId: string): Promise<SelectedLocation | null> {
    if (!db || userId === GUEST_USER_ID) {
      return loadLocal();
    }

    try {
      const snap = await getDoc(doc(db, 'users', userId, 'context', 'location'));
      if (!snap.exists()) return loadLocal();
      const data = snap.data();
      if (!data.countryId || !data.cityId) return loadLocal();
      return { countryId: data.countryId, cityId: data.cityId };
    } catch {
      return loadLocal();
    }
  }

  async save(userId: string, location: SelectedLocation): Promise<void> {
    await saveLocal(location);

    if (!db || userId === GUEST_USER_ID) return;

    await setDoc(doc(db, 'users', userId, 'context', 'location'), {
      countryId: location.countryId,
      cityId: location.cityId,
      updatedAt: serverTimestamp(),
    });
  }
}
