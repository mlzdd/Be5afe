import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@infra/database/firestore';
import type { PackingItem } from '@products/bsafe/travel-tools/types';

function requireDb() {
  if (!db) throw new Error('Firestore not initialised');
  return db;
}

function strip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class FirestorePackingListStore {
  async load(userId: string): Promise<PackingItem[]> {
    const database = requireDb();
    const snapshot = await getDocs(collection(database, 'users', userId, 'packingList'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PackingItem));
  }

  async save(userId: string, items: PackingItem[]): Promise<void> {
    const database = requireDb();
    const existing = await getDocs(collection(database, 'users', userId, 'packingList'));
    const incomingIds = new Set(items.map((item) => item.id));
    const batch = writeBatch(database);

    existing.docs.forEach((item) => {
      if (!incomingIds.has(item.id)) {
        batch.delete(item.ref);
      }
    });

    items.forEach((item) => {
      batch.set(
        doc(database, 'users', userId, 'packingList', item.id),
        strip({ ...item, updatedAt: serverTimestamp() }),
      );
    });

    await batch.commit();
  }
}
