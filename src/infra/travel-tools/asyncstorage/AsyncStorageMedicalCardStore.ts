import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MedicalCard } from '@products/bsafe/travel-tools/types';

const KEY = '@be5afe_medical_card';

export class AsyncStorageMedicalCardStore {
  async load(): Promise<MedicalCard | null> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async save(card: MedicalCard): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(card));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
