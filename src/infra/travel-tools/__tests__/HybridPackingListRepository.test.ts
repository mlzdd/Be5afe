jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));
jest.mock('../asyncstorage/AsyncStoragePackingListStore', () => ({
  AsyncStoragePackingListStore: class {},
}));
jest.mock('../firestore/FirestorePackingListStore', () => ({
  FirestorePackingListStore: class {},
}));

import { HybridPackingListRepository } from '../HybridPackingListRepository';
import type { PackingItem } from '@products/bsafe/travel-tools/types';

describe('HybridPackingListRepository', () => {
  const localItems: PackingItem[] = [
    { id: 'p-1', name: 'Shirt', category: 'clothing', packed: false, createdAt: '2026-05-17T00:00:00.000Z' },
  ];

  it('uses local storage for guests', async () => {
    const local = {
      load: jest.fn(async () => localItems),
      save: jest.fn(async () => {}),
      clear: jest.fn(async () => {}),
    };
    const cloud = {
      load: jest.fn(async () => []),
      save: jest.fn(async () => {}),
    };
    const repo = new HybridPackingListRepository(local, cloud);

    await expect(repo.load(null)).resolves.toEqual(localItems);
    expect(cloud.load).not.toHaveBeenCalled();
  });

  it('migrates local items into cloud storage on first authenticated load', async () => {
    const local = {
      load: jest.fn(async () => localItems),
      save: jest.fn(async () => {}),
      clear: jest.fn(async () => {}),
    };
    const cloud = {
      load: jest.fn(async () => []),
      save: jest.fn(async () => {}),
    };
    const repo = new HybridPackingListRepository(local, cloud);

    await expect(repo.load('user-1')).resolves.toEqual(localItems);
    expect(cloud.save).toHaveBeenCalledWith('user-1', localItems);
    expect(local.clear).toHaveBeenCalled();
  });
});
