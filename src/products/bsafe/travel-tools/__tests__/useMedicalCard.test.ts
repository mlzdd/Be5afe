import { renderHook, act } from '@testing-library/react-native';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { EMPTY_MEDICAL_CARD, useMedicalCard } from '../useMedicalCard';
import type { MedicalCardRepository } from '@shared/contracts/MedicalCardRepository';
import type { MedicalCard } from '../types';

function makeRepo(initial: MedicalCard | null = null): MedicalCardRepository {
  let card = initial;
  return {
    load: jest.fn(async () => card),
    save: jest.fn(async (_userId, next) => {
      card = next;
    }),
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe('useMedicalCard', () => {
  it('loads an empty card when no saved data exists', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useMedicalCard(repo, null));
    await flush();
    expect(result.current.card).toEqual(EMPTY_MEDICAL_CARD);
    expect(result.current.isLoading).toBe(false);
  });

  it('saves card updates through the repository', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useMedicalCard(repo, { uid: 'user-1' }));
    await flush();

    await act(async () => {
      await result.current.saveCard({ ...EMPTY_MEDICAL_CARD, bloodType: 'O+' });
    });

    expect(result.current.card.bloodType).toBe('O+');
    expect(repo.save).toHaveBeenCalledWith('user-1', { ...EMPTY_MEDICAL_CARD, bloodType: 'O+' });
  });
});
