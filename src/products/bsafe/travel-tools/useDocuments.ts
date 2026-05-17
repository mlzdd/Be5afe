import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TravelDocument, DocumentType } from './types';

const KEY = '@be5afe_documents';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface DocumentsState {
  documents: TravelDocument[];
  isLoading: boolean;
  addDocument(data: Omit<TravelDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateDocument(id: string, updates: Partial<TravelDocument>): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  getDocument(id: string): TravelDocument | undefined;
  getDocumentsByType(type: DocumentType): TravelDocument[];
}

export function useDocuments(): DocumentsState {
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(async (docs: TravelDocument[]) => {
    const sorted = [...docs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await AsyncStorage.setItem(KEY, JSON.stringify(sorted));
    setDocuments(sorted);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw ? setDocuments(JSON.parse(raw)) : undefined)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addDocument = useCallback(async (data: Omit<TravelDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await persist([...documents, { ...data, id: newId(), createdAt: now, updatedAt: now }]);
  }, [documents, persist]);

  const updateDocument = useCallback(async (id: string, updates: Partial<TravelDocument>) => {
    await persist(documents.map((d) => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
  }, [documents, persist]);

  const deleteDocument = useCallback(async (id: string) => {
    await persist(documents.filter((d) => d.id !== id));
  }, [documents, persist]);

  const getDocument = useCallback((id: string) =>
    documents.find((d) => d.id === id), [documents]);

  const getDocumentsByType = useCallback((type: DocumentType) =>
    documents.filter((d) => d.type === type), [documents]);

  return { documents, isLoading, addDocument, updateDocument, deleteDocument, getDocument, getDocumentsByType };
}
