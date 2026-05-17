import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PackingItem } from '@products/bsafe/travel-tools/types';

const KEY = '@be5afe_packing_list';

export class AsyncStoragePackingListStore {
  async load(): Promise<PackingItem[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async save(items: PackingItem[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
