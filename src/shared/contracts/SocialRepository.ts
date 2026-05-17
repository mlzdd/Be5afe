// --- Friends ---

export interface Friend {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface FriendsRepository {
  subscribeToFriends(userId: string, cb: (friends: Friend[]) => void): () => void;
  subscribeToIncomingRequests(userId: string, cb: (requests: FriendRequest[]) => void): () => void;
  subscribeToSentRequests(userId: string, cb: (requests: FriendRequest[]) => void): () => void;
  searchUsers(query: string, excludeUserId: string): Promise<UserSearchResult[]>;
  sendRequest(fromUserId: string, fromUserName: string, fromUserEmail: string, toUserId: string, message?: string): Promise<void>;
  acceptRequest(requestId: string, request: FriendRequest, acceptingUser: { uid: string; displayName: string; email: string }): Promise<void>;
  declineRequest(requestId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  blockFriend(userId: string, friendId: string): Promise<void>;
}

// --- Groups ---

export interface GroupMember {
  userId: string;
  displayName: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  memberDetails: GroupMember[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tripId?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'location' | 'alert';
  location?: { lat: number; lng: number };
  createdAt: string;
}

export interface GroupsRepository {
  subscribeToGroups(userId: string, cb: (groups: Group[]) => void): () => void;
  subscribeToMessages(groupId: string, cb: (messages: GroupMessage[]) => void): () => void;
  createGroup(group: Omit<Group, 'id'>): Promise<string>;
  updateGroup(groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'tripId'>>): Promise<void>;
  deleteGroup(groupId: string): Promise<void>;
  addMember(groupId: string, userId: string): Promise<void>;
  removeMember(groupId: string, userId: string): Promise<void>;
  sendMessage(msg: Omit<GroupMessage, 'id' | 'createdAt'>): Promise<void>;
}

// --- Location Sharing ---

export type ShareDuration = '1h' | '3h' | '6h' | '12h' | '24h' | 'indefinite';

export interface ShareRecipient {
  id: string;
  name: string;
  contact: string;
  type: 'friend' | 'custom';
}

export interface LocationShare {
  id: string;
  ownerId: string;
  recipients: ShareRecipient[];
  duration: ShareDuration;
  startTime: string;
  endTime?: string;
  message?: string;
  shareToken: string;
  isActive: boolean;
  createdAt: string;
  currentLocation?: { lat: number; lng: number };
  lastUpdatedAt?: string;
}

export interface LocationSharingRepository {
  subscribeToShares(userId: string, cb: (shares: LocationShare[]) => void): () => void;
  createShare(share: Omit<LocationShare, 'id'>): Promise<string>;
  stopShare(userId: string, shareId: string): Promise<void>;
  extendShare(userId: string, shareId: string, duration: ShareDuration): Promise<void>;
  updatePosition(userId: string, shareId: string, coords: { lat: number; lng: number }): Promise<void>;
  getShareByToken(token: string): Promise<LocationShare | null>;
}

// --- Typed domain errors ---

export class SocialNetworkError extends Error { readonly type = 'network' as const; }
export class SocialNotFoundError extends Error { readonly type = 'not_found' as const; }
export class SocialPermissionError extends Error { readonly type = 'permission' as const; }
