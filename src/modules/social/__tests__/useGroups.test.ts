import { renderHook, act } from '@testing-library/react-native';
import { useGroups } from '../useGroups';
import type { GroupsRepository, Group, GroupMessage } from '@shared/contracts/SocialRepository';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const ME = { uid: 'user-1', displayName: 'Alice', email: 'alice@example.com' };

function makeRepo(overrides: Partial<GroupsRepository> = {}): GroupsRepository {
  return {
    subscribeToGroups: (_uid, cb) => { setTimeout(() => cb([]), 0); return () => {}; },
    subscribeToMessages: (_gid, cb) => { setTimeout(() => cb([]), 0); return () => {}; },
    createGroup: () => Promise.resolve('group-1'),
    updateGroup: () => Promise.resolve(),
    deleteGroup: () => Promise.resolve(),
    addMember: () => Promise.resolve(),
    removeMember: () => Promise.resolve(),
    sendMessage: () => Promise.resolve(),
    ...overrides,
  };
}

describe('useGroups', () => {
  it('starts with empty state and isLoading false', async () => {
    const { result } = renderHook(() => useGroups(makeRepo(), ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.groups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('populates groups from subscription', async () => {
    const group: Group = {
      id: 'g-1', name: 'Travel Crew',
      memberIds: [ME.uid], memberDetails: [],
      createdBy: ME.uid, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
    };
    const repo = makeRepo({
      subscribeToGroups: (_uid, cb) => { setTimeout(() => cb([group]), 0); return () => {}; },
    });
    const { result } = renderHook(() => useGroups(repo, ME));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].name).toBe('Travel Crew');
  });

  it('createGroup includes currentUser as admin', async () => {
    let captured: Parameters<GroupsRepository['createGroup']>[0] | null = null;
    const repo = makeRepo({
      createGroup: (data) => { captured = data; return Promise.resolve('g-new'); },
    });
    const { result } = renderHook(() => useGroups(repo, ME));
    let id = '';
    await act(async () => { id = await result.current.createGroup('Crew', ['user-2']); });
    expect(id).toBe('g-new');
    expect(captured).not.toBeNull();
    expect(captured!.memberIds).toContain(ME.uid);
    const adminDetail = captured!.memberDetails.find((m) => m.userId === ME.uid);
    expect(adminDetail?.role).toBe('admin');
  });

  it('getMessages returns messages for a group', async () => {
    const msg: GroupMessage = {
      id: 'm-1', groupId: 'g-1', senderId: ME.uid, senderName: ME.displayName,
      text: 'Hello', type: 'text', createdAt: '2025-01-01T00:00:00.000Z',
    };
    const group: Group = {
      id: 'g-1', name: 'Crew', memberIds: [ME.uid], memberDetails: [],
      createdBy: ME.uid, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
    };
    const repo = makeRepo({
      subscribeToGroups: (_uid, cb) => { setTimeout(() => cb([group]), 0); return () => {}; },
      subscribeToMessages: (_gid, cb) => { setTimeout(() => cb([msg]), 0); return () => {}; },
    });
    const { result } = renderHook(() => useGroups(repo, ME));
    // groups arrive → re-render → messages effect subscribes → messages arrive (two async cycles)
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(result.current.getMessages('g-1')).toHaveLength(1);
    expect(result.current.getMessages('g-1')[0].text).toBe('Hello');
  });

  it('leaveGroup calls removeMember with currentUser uid', async () => {
    let removedUser = '';
    const repo = makeRepo({
      removeMember: (_gid, uid) => { removedUser = uid; return Promise.resolve(); },
    });
    const { result } = renderHook(() => useGroups(repo, ME));
    await act(async () => { await result.current.leaveGroup('g-1'); });
    expect(removedUser).toBe(ME.uid);
  });

  it('returns empty state when currentUser is null', async () => {
    const { result } = renderHook(() => useGroups(makeRepo(), null));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.groups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
