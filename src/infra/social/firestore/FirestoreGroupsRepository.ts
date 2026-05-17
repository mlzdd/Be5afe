import {
  collection, doc, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, where, orderBy, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../database/firestore';
import type { GroupsRepository, Group, GroupMessage } from '../../../shared/contracts/SocialRepository';

function strip<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function requireDb() {
  if (!db) throw new Error('Firebase not configured — add credentials to .env');
  return db;
}

export class FirestoreGroupsRepository implements GroupsRepository {
  subscribeToGroups(userId: string, cb: (groups: Group[]) => void): () => void {
    if (!db) { cb([]); return () => {}; }
    const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', userId));
    return onSnapshot(q, (snap) => {
      const groups: Group[] = [];
      snap.forEach((d) => groups.push({ id: d.id, ...d.data() } as Group));
      cb(groups);
    });
  }

  subscribeToMessages(groupId: string, cb: (messages: GroupMessage[]) => void): () => void {
    if (!db) { cb([]); return () => {}; }
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      const msgs: GroupMessage[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() } as GroupMessage));
      cb(msgs);
    });
  }

  async createGroup(group: Omit<Group, 'id'>): Promise<string> {
    const db = requireDb();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'groups', id), strip({ ...group, id }));
    return id;
  }

  async updateGroup(
    groupId: string,
    updates: Partial<Pick<Group, 'name' | 'description' | 'tripId'>>,
  ): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'groups', groupId), strip({ ...updates, updatedAt: new Date().toISOString() }));
  }

  async deleteGroup(groupId: string): Promise<void> {
    const db = requireDb();
    await deleteDoc(doc(db, 'groups', groupId));
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayUnion(userId) });
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const db = requireDb();
    await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayRemove(userId) });
  }

  async sendMessage(msg: Omit<GroupMessage, 'id' | 'createdAt'>): Promise<void> {
    const db = requireDb();
    await addDoc(
      collection(db, 'groups', msg.groupId, 'messages'),
      strip({ ...msg, createdAt: serverTimestamp() }),
    );
  }
}
