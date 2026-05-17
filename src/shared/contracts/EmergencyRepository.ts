import type { EmergencyContact } from '@products/bsafe/emergency/types';

export type { EmergencyContact, CountryEmergencyNumbers } from '@products/bsafe/emergency/types';

export interface EmergencyRepository {
  load(userId: string): Promise<EmergencyContact[]>;
  save(userId: string, contacts: EmergencyContact[]): Promise<void>;
}
