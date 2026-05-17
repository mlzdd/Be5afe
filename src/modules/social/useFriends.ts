import { useState, useEffect, useCallback } from 'react';
import type { FriendsRepository, Friend, FriendRequest, UserSearchResult } from '@shared/contracts/SocialRepository';

interface FriendsState {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  sendRequest: (toUserId: string, message?: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockFriend: (friendId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
}

interface CurrentUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export function useFriends(
  repository: FriendsRepository,
  currentUser: CurrentUser | null,
): FriendsState {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(!!currentUser);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    const unsub1 = repository.subscribeToFriends(currentUser.uid, setFriends);
    const unsub2 = repository.subscribeToIncomingRequests(currentUser.uid, setIncomingRequests);
    const unsub3 = repository.subscribeToSentRequests(currentUser.uid, setSentRequests);
    setIsLoading(false);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [repository, currentUser?.uid]);

  const sendRequest = useCallback(async (toUserId: string, message?: string) => {
    if (!currentUser) return;
    await repository.sendRequest(
      currentUser.uid, currentUser.displayName ?? '', currentUser.email ?? '', toUserId, message,
    );
  }, [repository, currentUser]);

  const acceptRequest = useCallback(async (requestId: string) => {
    if (!currentUser) return;
    const request = incomingRequests.find((r) => r.id === requestId);
    if (!request) return;
    await repository.acceptRequest(requestId, request, {
      uid: currentUser.uid,
      displayName: currentUser.displayName ?? '',
      email: currentUser.email ?? '',
    });
  }, [repository, currentUser, incomingRequests]);

  const declineRequest = useCallback((requestId: string) =>
    repository.declineRequest(requestId), [repository]);

  const removeFriend = useCallback((friendId: string) => {
    if (!currentUser) return Promise.resolve();
    return repository.removeFriend(currentUser.uid, friendId);
  }, [repository, currentUser]);

  const blockFriend = useCallback((friendId: string) => {
    if (!currentUser) return Promise.resolve();
    return repository.blockFriend(currentUser.uid, friendId);
  }, [repository, currentUser]);

  const searchUsers = useCallback((query: string) => {
    if (!currentUser) return Promise.resolve([]);
    return repository.searchUsers(query, currentUser.uid);
  }, [repository, currentUser]);

  return { friends, incomingRequests, sentRequests, isLoading, sendRequest, acceptRequest, declineRequest, removeFriend, blockFriend, searchUsers };
}
