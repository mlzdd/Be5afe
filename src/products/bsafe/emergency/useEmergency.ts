import { useState, useEffect, useCallback } from 'react';
import type { EmergencyRepository, EmergencyContact } from '@shared/contracts/EmergencyRepository';

interface CurrentUser { uid: string }

interface EmergencyState {
  contacts: EmergencyContact[];
  isLoading: boolean;
  addContact(contact: Omit<EmergencyContact, 'id' | 'createdAt'>): Promise<void>;
  updateContact(id: string, updates: Partial<EmergencyContact>): Promise<void>;
  deleteContact(id: string): Promise<void>;
}

export function useEmergency(
  repository: EmergencyRepository,
  currentUser: CurrentUser | null,
): EmergencyState {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(!!currentUser);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    repository.load(currentUser.uid).then((loaded) => {
      if (!cancelled) { setContacts(loaded); setIsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [repository, currentUser?.uid]);

  const persist = useCallback(async (updated: EmergencyContact[]) => {
    if (!currentUser) return;
    setContacts(updated);
    await repository.save(currentUser.uid, updated);
  }, [repository, currentUser]);

  const addContact = useCallback(async (data: Omit<EmergencyContact, 'id' | 'createdAt'>) => {
    const next: EmergencyContact = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    await persist([...contacts, next]);
  }, [contacts, persist]);

  const updateContact = useCallback(async (id: string, updates: Partial<EmergencyContact>) => {
    await persist(contacts.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, [contacts, persist]);

  const deleteContact = useCallback(async (id: string) => {
    await persist(contacts.filter((c) => c.id !== id));
  }, [contacts, persist]);

  return { contacts, isLoading, addContact, updateContact, deleteContact };
}
