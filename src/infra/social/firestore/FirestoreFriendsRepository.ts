import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '../../database/firestore';
import type { FriendsRepository, Friend, FriendRequest, UserSearchResult } from '../../../shared/contracts/SocialRepository';

function strip<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function requireDb() {
  if (!db) throw new Error('Firebase not configured — add credentials to .env');
  return db;
}

export class FirestoreFriendsRepository implements FriendsRepository {
  subscribeToFriends(userId: string, cb: (friends: Friend[]) => void): () => void {
    if (!db) { cb([]); return () => {}; }
    const ref = collection(db, 'users', userId, 'friends');
    return onSnapshot(ref, (snap) => {
      const friends: Friend[] = [];
      snap.forEach((d) => friends.push({ userId: d.id, ...d.data() } as Friend));
      cb(friends.filter((f) => f.status === 'accepted'));
    });
  }

  subscribeToIncomingRequests(userId: string, cb: (requests: FriendRequest[]) => void): () => void {
    if (!db) { cb([]); return () => {}; }
    const q = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
    );
    return onSnapshot(q, (snap) => {
      const reqs: FriendRequest[] = [];
      snap.forEach((d) => reqs.push({ id: d.id, ...d.data() } as FriendRequest));
      cb(reqs);
    });
  }

  subscribeToSentRequests(userId: string, cb: (requests: FriendRequest[]) => void): () => void {
    if (!db) { cb([]); return () => {}; }
    const q = query(collection(db, 'friendRequests'), where('fromUserId', '==', userId));
    return onSnapshot(q, (snap) => {
      const reqs: FriendRequest[] = [];
      snap.forEach((d) => reqs.push({ id: d.id, ...d.data() } as FriendRequest));
      cb(reqs);
    });
  }

  async searchUsers(query: string, excludeUserId: string): Promise<UserSearchResult[]> {
    const db = requireDb();
    const snap = await getDocs(collection(db, 'users'));
    const results: UserSearchResult[] = [];
    snap.forEach((d) => {
      if (d.id === excludeUserId) return;
      const data = d.data();
      const email: string = data.profile?.email ?? data.email ?? '';
      const displayName: string = data.profile?.displayName ?? data.name ?? '';
      const photoURL: string | undefined = data.profile?.photoURL ?? data.photoURL;
      if (email.toLowerCase().includes(query.toLowerCase())) {
        results.push({ id: d.id, displayName, email, photoURL });
      }
    });
    return results;
  }

  async sendRequest(
    fromUserId: string, fromUserName: string, fromUserEmail: string,
    toUserId: string, message?: string,
  ): Promise<void> {
    const db = requireDb();
    const requestId = `${fromUserId}_${toUserId}_${Date.now()}`;
    const request: FriendRequest = {
      id: requestId, fromUserId, fromUserName, fromUserEmail,
      toUserId, status: 'pending', createdAt: new Date().toISOString(), message,
    };
    await setDoc(doc(db, 'friendRequests', requestId), strip(request));
  }

  async acceptRequest(
    requestId: string,
    request: FriendRequest,
    me: { uid: string; displayName: string; email: string },
  ): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
    const now = new Date().toISOString();
    const theirEntry: Friend = {
      userId: request.fromUserId, displayName: request.fromUserName,
      email: request.fromUserEmail, status: 'accepted', createdAt: now, acceptedAt: now,
    };
    const myEntry: Friend = {
      userId: me.uid, displayName: me.displayName, email: me.email,
      status: 'accepted', createdAt: now, acceptedAt: now,
    };
    await setDoc(doc(db, 'users', me.uid, 'friends', request.fromUserId), strip(theirEntry));
    await setDoc(doc(db, 'users', request.fromUserId, 'friends', me.uid), strip(myEntry));
  }

  async declineRequest(requestId: string): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const db = requireDb();
    await deleteDoc(doc(db, 'users', userId, 'friends', friendId));
    await deleteDoc(doc(db, 'users', friendId, 'friends', userId));
  }

  async blockFriend(userId: string, friendId: string): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'users', userId, 'friends', friendId), { status: 'blocked' });
  }
}
