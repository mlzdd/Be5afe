import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import type { UserProfileRepository } from '@shared/contracts/UserProfileRepository';
import type { UserProfile } from '@modules/user-profile/types';
import { DEFAULT_USER_PROFILE } from '@modules/user-profile/types';
import { db } from '@infra/database/firestore';

const PROFILE_KEY = '@be5afe_profile';
const PENDING_KEY = '@be5afe_profile_pending';

function isProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<UserProfile>;
  return typeof candidate.displayName === 'string';
}

async function readLocal(key: string): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeLocal(key: string, profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(profile));
}

export class HybridUserProfileRepository implements UserProfileRepository {
  async load(userId: string | null): Promise<UserProfile> {
    if (!db || !userId) {
      return (await readLocal(PROFILE_KEY)) ?? DEFAULT_USER_PROFILE;
    }

    await this.flushPending(userId);

    try {
      const snap = await getDoc(doc(db, 'users', userId, 'profile', 'main'));
      if (!snap.exists()) return (await readLocal(PROFILE_KEY)) ?? DEFAULT_USER_PROFILE;
      const data = snap.data();
      return {
        displayName: typeof data.displayName === 'string' ? data.displayName : '',
        nationality: typeof data.nationality === 'string' ? data.nationality : undefined,
        homeCountry: typeof data.homeCountry === 'string' ? data.homeCountry : undefined,
        phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : undefined,
      };
    } catch {
      return (await readLocal(PROFILE_KEY)) ?? DEFAULT_USER_PROFILE;
    }
  }

  async save(userId: string | null, profile: UserProfile): Promise<void> {
    await writeLocal(PROFILE_KEY, profile);

    if (!db || !userId) return;

    try {
      await setDoc(doc(db, 'users', userId, 'profile', 'main'), {
        ...profile,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await AsyncStorage.removeItem(PENDING_KEY);
    } catch {
      await writeLocal(PENDING_KEY, profile);
    }
  }

  private async flushPending(userId: string): Promise<void> {
    const pending = await readLocal(PENDING_KEY);
    if (!pending || !db) return;

    try {
      await setDoc(doc(db, 'users', userId, 'profile', 'main'), {
        ...pending,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await AsyncStorage.removeItem(PENDING_KEY);
    } catch {
      // Keep pending update queued.
    }
  }
}
