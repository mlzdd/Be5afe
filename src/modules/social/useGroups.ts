import { useState, useEffect, useCallback } from 'react';
import type { GroupsRepository, Group, GroupMessage } from '@shared/contracts/SocialRepository';

interface CurrentUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

interface GroupsState {
  groups: Group[];
  isLoading: boolean;
  createGroup: (name: string, memberIds: string[], description?: string, tripId?: string) => Promise<string>;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'tripId'>>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addMember: (groupId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, text: string, type?: GroupMessage['type']) => Promise<void>;
  getMessages: (groupId: string) => GroupMessage[];
}

export function useGroups(
  repository: GroupsRepository,
  currentUser: CurrentUser | null,
): GroupsState {
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Record<string, GroupMessage[]>>({});
  const [isLoading, setIsLoading] = useState(!!currentUser);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    const unsub = repository.subscribeToGroups(currentUser.uid, setGroups);
    setIsLoading(false);
    return unsub;
  }, [repository, currentUser?.uid]);

  // Subscribe to messages for each group
  useEffect(() => {
    if (!currentUser || groups.length === 0) return;
    const unsubs = groups.map((g) =>
      repository.subscribeToMessages(g.id, (msgs) =>
        setMessages((prev) => ({ ...prev, [g.id]: msgs })),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [repository, currentUser?.uid, groups.length]);

  const createGroup = useCallback(async (
    name: string, memberIds: string[], description?: string, tripId?: string,
  ): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    const allMemberIds = [currentUser.uid, ...memberIds.filter((id) => id !== currentUser.uid)];
    const now = new Date().toISOString();
    return repository.createGroup({
      name, description, tripId,
      memberIds: allMemberIds,
      memberDetails: allMemberIds.map((uid) => ({
        userId: uid,
        displayName: uid === currentUser.uid ? (currentUser.displayName ?? '') : 'Member',
        email: uid === currentUser.uid ? (currentUser.email ?? '') : '',
        role: uid === currentUser.uid ? 'admin' : 'member',
        joinedAt: now,
      })),
      createdBy: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    });
  }, [repository, currentUser]);

  const updateGroup = useCallback((groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'tripId'>>) =>
    repository.updateGroup(groupId, updates), [repository]);

  const deleteGroup = useCallback((groupId: string) =>
    repository.deleteGroup(groupId), [repository]);

  const addMember = useCallback((groupId: string, userId: string) =>
    repository.addMember(groupId, userId), [repository]);

  const removeMember = useCallback((groupId: string, userId: string) =>
    repository.removeMember(groupId, userId), [repository]);

  const leaveGroup = useCallback((groupId: string) => {
    if (!currentUser) return Promise.resolve();
    return repository.removeMember(groupId, currentUser.uid);
  }, [repository, currentUser]);

  const sendMessage = useCallback(async (
    groupId: string, text: string, type: GroupMessage['type'] = 'text',
  ) => {
    if (!currentUser) return;
    await repository.sendMessage({
      groupId, text, type,
      senderId: currentUser.uid,
      senderName: currentUser.displayName ?? '',
    });
  }, [repository, currentUser]);

  const getMessages = useCallback((groupId: string): GroupMessage[] =>
    messages[groupId] ?? [], [messages]);

  return { groups, isLoading, createGroup, updateGroup, deleteGroup, addMember, removeMember, leaveGroup, sendMessage, getMessages };
}
