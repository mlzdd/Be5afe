import type { MedicalCardRepository } from '@shared/contracts/MedicalCardRepository';
import type { MedicalCard } from '@products/bsafe/travel-tools/types';
import { AsyncStorageMedicalCardStore } from './asyncstorage/AsyncStorageMedicalCardStore';
import { FirestoreMedicalCardStore } from './firestore/FirestoreMedicalCardStore';

export class HybridMedicalCardRepository implements MedicalCardRepository {
  constructor(
    private readonly local = new AsyncStorageMedicalCardStore(),
    private readonly cloud = new FirestoreMedicalCardStore(),
  ) {}

  async load(userId: string | null): Promise<MedicalCard | null> {
    if (!userId) return this.local.load();

    const cloudCard = await this.cloud.load(userId);
    if (cloudCard) return cloudCard;

    const localCard = await this.local.load();
    if (!localCard) return null;

    await this.cloud.save(userId, localCard);
    await this.local.clear();
    return localCard;
  }

  async save(userId: string | null, card: MedicalCard): Promise<void> {
    if (!userId) {
      await this.local.save(card);
      return;
    }

    await this.cloud.save(userId, card);
  }
}
