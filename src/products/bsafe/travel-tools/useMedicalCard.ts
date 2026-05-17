import { useState, useEffect, useCallback } from 'react';
import type { MedicalCardRepository } from '@shared/contracts/MedicalCardRepository';
import type { MedicalCard } from './types';

interface CurrentUser { uid: string }

export const EMPTY_MEDICAL_CARD: MedicalCard = {
  bloodType: '',
  allergies: '',
  conditions: '',
  medications: '',
  organDonor: false,
  emergencyNotes: '',
  doctorName: '',
  doctorPhone: '',
};

export interface MedicalCardState {
  card: MedicalCard;
  isLoading: boolean;
  saveCard(card: MedicalCard): Promise<void>;
}

export function useMedicalCard(
  repository: MedicalCardRepository,
  currentUser: CurrentUser | null,
): MedicalCardState {
  const [card, setCard] = useState<MedicalCard>(EMPTY_MEDICAL_CARD);
  const [isLoading, setIsLoading] = useState(true);
  const userId = currentUser?.uid ?? null;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    repository.load(userId)
      .then((loaded) => {
        if (!cancelled) setCard(loaded ?? EMPTY_MEDICAL_CARD);
      })
      .catch(() => {
        if (!cancelled) setCard(EMPTY_MEDICAL_CARD);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [repository, userId]);

  const saveCard = useCallback(async (next: MedicalCard) => {
    await repository.save(userId, next);
    setCard(next);
  }, [repository, userId]);

  return { card, isLoading, saveCard };
}
