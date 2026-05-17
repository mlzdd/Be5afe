import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmergencyRepository, EmergencyContact } from '@shared/contracts/EmergencyRepository';

const KEY = '@be5afe_emergency_contacts';

export class AsyncStorageEmergencyRepository implements EmergencyRepository {
  async load(_userId: string): Promise<EmergencyContact[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async save(_userId: string, contacts: EmergencyContact[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(contacts));
  }
}
