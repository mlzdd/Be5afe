import type { PackingListRepository } from '@shared/contracts/PackingListRepository';
import type { PackingItem } from '@products/bsafe/travel-tools/types';
import { AsyncStoragePackingListStore } from './asyncstorage/AsyncStoragePackingListStore';
import { FirestorePackingListStore } from './firestore/FirestorePackingListStore';

export class HybridPackingListRepository implements PackingListRepository {
  constructor(
    private readonly local = new AsyncStoragePackingListStore(),
    private readonly cloud = new FirestorePackingListStore(),
  ) {}

  async load(userId: string | null): Promise<PackingItem[]> {
    if (!userId) return this.local.load();

    const cloudItems = await this.cloud.load(userId);
    if (cloudItems.length > 0) return cloudItems;

    const localItems = await this.local.load();
    if (localItems.length === 0) return [];

    await this.cloud.save(userId, localItems);
    await this.local.clear();
    return localItems;
  }

  async save(userId: string | null, items: PackingItem[]): Promise<void> {
    if (!userId) {
      await this.local.save(items);
      return;
    }

    await this.cloud.save(userId, items);
  }
}
