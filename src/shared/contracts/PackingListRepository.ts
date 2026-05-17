import type { PackingItem } from '@products/bsafe/travel-tools/types';

export interface PackingListRepository {
  load(userId: string | null): Promise<PackingItem[]>;
  save(userId: string | null, items: PackingItem[]): Promise<void>;
}
