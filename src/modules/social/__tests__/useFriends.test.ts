import { renderHook, act } from '@testing-library/react-hooks';
import { useFriends } from '../useFriends';
import type { FriendsRepository, Friend, FriendRequest } from '@shared/contracts/SocialRepository';

// React 19 requires IS_REACT_ACT_ENVIRONMENT for act() to work outside jsdom
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const ME = { uid: 'user-1', displayName: 'Alice', email: 'alice@example.com' };

function makeRepo(overrides: Partial<FriendsRepository> = {}): FriendsRepository {
  return {
    subscribeToFriends: (_uid, cb) => { setTimeout(() => cb([]), 0); return () => {}; },
    subscribeToIncomingRequests: (_uid, cb) => { setTimeout(() => cb([]), 0); return () => {}; },
    subscribeToSentRequests: (_uid, cb) => { setTimeout(() => cb([]), 0); return () => {}; },
    searchUsers: () => Promise.resolve([]),
    sendRequest: () => Promise.resolve(),
    acceptRequest: () => Promise.resolve(),
    declineRequest: () => Promise.resolve(),
    removeFriend: () => Promise.resolve(),
    blockFriend: () => Promise.resolve(),
    ...overrides,
  };
}

describe('useFriends', () => {
  it('starts with empty state and isLoading false after subscriptions fire', async () => {
    const { result } = renderHook(() => useFriends(makeRepo(), ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.friends).toEqual([]);
    expect(result.current.incomingRequests).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('populates friends from subscription', async () => {
    const friend: Friend = {
      userId: 'user-2', displayName: 'Bob', email: 'bob@example.com',
      status: 'accepted', createdAt: '2025-01-01T00:00:00.000Z',
    };
    const repo = makeRepo({
      subscribeToFriends: (_uid, cb) => { setTimeout(() => cb([friend]), 0); return () => {}; },
    });
    const { result } = renderHook(() => useFriends(repo, ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.friends).toHaveLength(1);
    expect(result.current.friends[0].displayName).toBe('Bob');
  });

  it('calls sendRequest with correct args', async () => {
    let captured: Parameters<FriendsRepository['sendRequest']> | null = null;
    const repo = makeRepo({
      sendRequest: (...args) => { captured = args; return Promise.resolve(); },
    });
    const { result } = renderHook(() => useFriends(repo, ME));
    await act(async () => { await result.current.sendRequest('user-2', 'Hey!'); });
    expect(captured).not.toBeNull();
    expect(captured![0]).toBe(ME.uid);
    expect(captured![3]).toBe('user-2');
    expect(captured![4]).toBe('Hey!');
  });

  it('acceptRequest finds the request and passes it to repo', async () => {
    const request: FriendRequest = {
      id: 'req-1', fromUserId: 'user-2', fromUserName: 'Bob',
      fromUserEmail: 'bob@example.com', toUserId: ME.uid,
      status: 'pending', createdAt: '2025-01-01T00:00:00.000Z',
    };
    let acceptedId = '';
    const repo = makeRepo({
      subscribeToIncomingRequests: (_uid, cb) => { setTimeout(() => cb([request]), 0); return () => {}; },
      acceptRequest: (id) => { acceptedId = id; return Promise.resolve(); },
    });
    const { result } = renderHook(() => useFriends(repo, ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    await act(async () => { await result.current.acceptRequest('req-1'); });
    expect(acceptedId).toBe('req-1');
  });

  it('returns empty results when currentUser is null', async () => {
    const { result } = renderHook(() => useFriends(makeRepo(), null));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.friends).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('searchUsers delegates to repository', async () => {
    const repo = makeRepo({
      searchUsers: (q) => Promise.resolve([
        { id: 'u2', displayName: 'Bob', email: `${q}@example.com` },
      ]),
    });
    const { result } = renderHook(() => useFriends(repo, ME));
    let found: Awaited<ReturnType<typeof result.current.searchUsers>> = [];
    await act(async () => { found = await result.current.searchUsers('bob'); });
    expect(found).toHaveLength(1);
    expect(found[0].email).toBe('bob@example.com');
  });
});
