import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@infra/database/firestore';
import type { MedicalCard } from '@products/bsafe/travel-tools/types';

function requireDb() {
  if (!db) throw new Error('Firestore not initialised');
  return db;
}

function strip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class FirestoreMedicalCardStore {
  async load(userId: string): Promise<MedicalCard | null> {
    const database = requireDb();
    const snapshot = await getDoc(doc(database, 'users', userId, 'medicalCard', 'default'));
    return snapshot.exists() ? (snapshot.data() as MedicalCard) : null;
  }

  async save(userId: string, card: MedicalCard): Promise<void> {
    const database = requireDb();
    await setDoc(
      doc(database, 'users', userId, 'medicalCard', 'default'),
      strip({ ...card, updatedAt: serverTimestamp() }),
      { merge: true },
    );
  }
}
