import type { MedicalCard } from '@products/bsafe/travel-tools/types';

export interface MedicalCardRepository {
  load(userId: string | null): Promise<MedicalCard | null>;
  save(userId: string | null, card: MedicalCard): Promise<void>;
}
