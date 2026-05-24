import { renderHook, act } from '@testing-library/react-native';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { usePackingList } from '../usePackingList';
import type { PackingListRepository } from '@shared/contracts/PackingListRepository';
import type { PackingItem } from '../types';

function makeRepo(initial: PackingItem[] = []): PackingListRepository {
  let items = initial;
  return {
    load: jest.fn(async () => items),
    save: jest.fn(async (_userId, next) => {
      items = next;
    }),
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe('usePackingList', () => {
  it('starts empty and finishes loading', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => usePackingList(repo, null));
    await flush();
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads existing items from repository', async () => {
    const repo = makeRepo([
      { id: 'p-1', name: 'Shirt', category: 'clothing', packed: false, createdAt: '2025-01-01T00:00:00Z' },
    ]);
    const { result } = renderHook(() => usePackingList(repo, null));
    await flush();
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Shirt');
  });

  it('addItem persists through the repository', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => usePackingList(repo, null));
    await flush();
    await act(async () => {
      await result.current.addItem({ name: 'Sunscreen', category: 'toiletries', packed: false });
    });
    expect(result.current.items).toHaveLength(1);
    expect(repo.save).toHaveBeenCalled();
  });

  it('togglePacked flips the packed state', async () => {
    const repo = makeRepo([
      { id: 'p-1', name: 'Shirt', category: 'clothing', packed: false, createdAt: '2025-01-01T00:00:00Z' },
    ]);
    const { result } = renderHook(() => usePackingList(repo, null));
    await flush();
    await act(async () => { await result.current.togglePacked('p-1'); });
    expect(result.current.items[0].packed).toBe(true);
  });

  it('getProgress reports correctly', async () => {
    const repo = makeRepo([
      { id: 'p-1', name: 'Shirt', category: 'clothing', packed: true, createdAt: '2025-01-01T00:00:00Z' },
      { id: 'p-2', name: 'Pants', category: 'clothing', packed: false, createdAt: '2025-01-01T00:00:00Z' },
    ]);
    const { result } = renderHook(() => usePackingList(repo, null));
    await flush();
    const progress = result.current.getProgress();
    expect(progress.packed).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.percentage).toBe(50);
  });
});
