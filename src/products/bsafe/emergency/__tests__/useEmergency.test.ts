import { renderHook, act } from '@testing-library/react-hooks';
import { useEmergency } from '../useEmergency';
import type { EmergencyRepository } from '@shared/contracts/EmergencyRepository';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const ME = { uid: 'user-1' };

function makeRepo(overrides: Partial<EmergencyRepository> = {}): EmergencyRepository {
  return {
    load: () => Promise.resolve([]),
    save: () => Promise.resolve(),
    ...overrides,
  };
}

// Flush promise microtasks through act so React processes async state updates
async function flush(times = 3) {
  for (let i = 0; i < times; i++) {
    await act(async () => { await Promise.resolve(); });
  }
}

describe('useEmergency', () => {
  it('isLoading clears after load completes', async () => {
    // non-empty load ensures a state change that act() can observe
    const repo = makeRepo({
      load: () => Promise.resolve([
        { id: 'c-x', name: 'X', phone: '+0', relationship: 'Other' as const, createdAt: '2025-01-01T00:00:00Z' },
      ]),
    });
    const { result } = renderHook(() => useEmergency(repo, ME));
    await flush();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.contacts).toHaveLength(1);
  });

  it('loads existing contacts from repository', async () => {
    const repo = makeRepo({
      load: () => Promise.resolve([
        { id: 'c-1', name: 'Alice', phone: '+1234567890', relationship: 'Family' as const, createdAt: '2025-01-01T00:00:00Z' },
      ]),
    });
    const { result } = renderHook(() => useEmergency(repo, ME));
    await flush();
    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.contacts[0].name).toBe('Alice');
  });

  it('addContact saves to repository', async () => {
    let saved: unknown = null;
    const repo = makeRepo({ save: (_uid, contacts) => { saved = contacts; return Promise.resolve(); } });
    const { result } = renderHook(() => useEmergency(repo, ME));
    await flush();
    await act(async () => {
      await result.current.addContact({ name: 'Bob', phone: '+9876543210', relationship: 'Friend' });
    });
    expect(saved).not.toBeNull();
    expect((saved as { name: string }[])[0].name).toBe('Bob');
  });

  it('deleteContact removes from list', async () => {
    const repo = makeRepo({
      load: () => Promise.resolve([
        { id: 'c-1', name: 'Alice', phone: '+1', relationship: 'Family' as const, createdAt: '2025-01-01T00:00:00Z' },
      ]),
    });
    const { result } = renderHook(() => useEmergency(repo, ME));
    await flush();
    await act(async () => { await result.current.deleteContact('c-1'); });
    expect(result.current.contacts).toHaveLength(0);
  });

  it('returns empty when currentUser is null', async () => {
    const { result } = renderHook(() => useEmergency(makeRepo(), null));
    await flush();
    expect(result.current.contacts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
