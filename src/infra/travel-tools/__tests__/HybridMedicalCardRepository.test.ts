jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));
jest.mock('../asyncstorage/AsyncStorageMedicalCardStore', () => ({
  AsyncStorageMedicalCardStore: class {},
}));
jest.mock('../firestore/FirestoreMedicalCardStore', () => ({
  FirestoreMedicalCardStore: class {},
}));

import { HybridMedicalCardRepository } from '../HybridMedicalCardRepository';
import { EMPTY_MEDICAL_CARD } from '@products/bsafe/travel-tools/useMedicalCard';

describe('HybridMedicalCardRepository', () => {
  it('migrates a local medical card into cloud storage on first authenticated load', async () => {
    const card = { ...EMPTY_MEDICAL_CARD, bloodType: 'O+' };
    const local = {
      load: jest.fn(async () => card),
      save: jest.fn(async () => {}),
      clear: jest.fn(async () => {}),
    };
    const cloud = {
      load: jest.fn(async () => null),
      save: jest.fn(async () => {}),
    };
    const repo = new HybridMedicalCardRepository(local, cloud);

    await expect(repo.load('user-1')).resolves.toEqual(card);
    expect(cloud.save).toHaveBeenCalledWith('user-1', card);
    expect(local.clear).toHaveBeenCalled();
  });
});
