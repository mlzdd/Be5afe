import { renderHook, act } from '@testing-library/react-hooks';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDocuments } from '../useDocuments';

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 10)); });

const DOC = {
  type: 'passport' as const,
  title: 'My Passport',
  documentNumber: 'AB123456',
  issuingCountry: 'Australia',
  expiryDate: '2030-01-01',
};

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('starts empty and finishes loading', async () => {
    const { result } = renderHook(() => useDocuments());
    await flush();
    expect(result.current.documents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads existing documents from storage', async () => {
    const stored = JSON.stringify([{
      ...DOC, id: 'd-1', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => useDocuments());
    await flush();
    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].title).toBe('My Passport');
  });

  it('addDocument persists and returns new item', async () => {
    const { result } = renderHook(() => useDocuments());
    await flush();
    await act(async () => { await result.current.addDocument(DOC); });
    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].type).toBe('passport');
    expect(result.current.documents[0].id).toBeTruthy();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('updateDocument changes fields', async () => {
    const { result } = renderHook(() => useDocuments());
    await flush();
    await act(async () => { await result.current.addDocument(DOC); });
    const id = result.current.documents[0].id;
    await act(async () => { await result.current.updateDocument(id, { title: 'Updated Passport' }); });
    expect(result.current.documents[0].title).toBe('Updated Passport');
    expect(result.current.documents[0].documentNumber).toBe('AB123456');
  });

  it('deleteDocument removes the item', async () => {
    const { result } = renderHook(() => useDocuments());
    await flush();
    await act(async () => { await result.current.addDocument(DOC); });
    const id = result.current.documents[0].id;
    await act(async () => { await result.current.deleteDocument(id); });
    expect(result.current.documents).toHaveLength(0);
  });

  it('getDocument returns the right item by id', async () => {
    const { result } = renderHook(() => useDocuments());
    await flush();
    await act(async () => { await result.current.addDocument(DOC); });
    const id = result.current.documents[0].id;
    expect(result.current.getDocument(id)?.title).toBe('My Passport');
    expect(result.current.getDocument('nonexistent')).toBeUndefined();
  });

  it('getDocumentsByType filters correctly', async () => {
    const { result } = renderHook(() => useDocuments());
    await flush();
    await act(async () => { await result.current.addDocument(DOC); });
    await act(async () => {
      await result.current.addDocument({ type: 'visa', title: 'Thai Visa', documentNumber: 'V999' });
    });
    const passports = result.current.getDocumentsByType('passport');
    const visas = result.current.getDocumentsByType('visa');
    expect(passports).toHaveLength(1);
    expect(visas).toHaveLength(1);
    expect(passports[0].title).toBe('My Passport');
  });

  it('addDocument sorts newest-first after adding', async () => {
    const stored = JSON.stringify([
      { ...DOC, id: 'd-1', title: 'Old Doc', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => useDocuments());
    await flush();
    await act(async () => {
      await result.current.addDocument({ ...DOC, title: 'New Doc' });
    });
    expect(result.current.documents[0].title).toBe('New Doc');
    expect(result.current.documents[1].title).toBe('Old Doc');
  });
});
