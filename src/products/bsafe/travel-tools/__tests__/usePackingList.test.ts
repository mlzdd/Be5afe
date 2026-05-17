import { renderHook, act } from '@testing-library/react-hooks';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePackingList } from '../usePackingList';

describe('usePackingList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('starts empty and not loading', async () => {
    const { result } = renderHook(() => usePackingList());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads existing items from storage', async () => {
    const stored = JSON.stringify([
      { id: 'p-1', name: 'Shirt', category: 'clothing', packed: false, createdAt: '2025-01-01T00:00:00Z' },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => usePackingList());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Shirt');
  });

  it('addItem persists to storage', async () => {
    const { result } = renderHook(() => usePackingList());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    await act(async () => {
      await result.current.addItem({ name: 'Sunscreen', category: 'toiletries', packed: false });
    });
    expect(result.current.items).toHaveLength(1);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('togglePacked flips the packed state', async () => {
    const stored = JSON.stringify([
      { id: 'p-1', name: 'Shirt', category: 'clothing', packed: false, createdAt: '2025-01-01T00:00:00Z' },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => usePackingList());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    await act(async () => { await result.current.togglePacked('p-1'); });
    expect(result.current.items[0].packed).toBe(true);
  });

  it('getProgress reports correctly', async () => {
    const stored = JSON.stringify([
      { id: 'p-1', name: 'Shirt', category: 'clothing', packed: true, createdAt: '2025-01-01T00:00:00Z' },
      { id: 'p-2', name: 'Pants', category: 'clothing', packed: false, createdAt: '2025-01-01T00:00:00Z' },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => usePackingList());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const progress = result.current.getProgress();
    expect(progress.packed).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.percentage).toBe(50);
  });
});
