import {
  initializeAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
  type Persistence,
} from 'firebase/auth';
// getReactNativePersistence is only typed in the RN build; import via require to satisfy tsc
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (storage: unknown) => Persistence;
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from './firebaseApp';
import { db } from '@infra/database/firestore';
import type { AuthRepository, AuthUser } from '../../../shared/contracts/AuthRepository';
import {
  AuthEmailInUseError, AuthInvalidEmailError, AuthWeakPasswordError,
  AuthUserNotFoundError, AuthWrongPasswordError, AuthTooManyRequestsError,
  AuthNetworkError, AuthUserDisabledError,
} from '../../../shared/contracts/AuthRepository';

const auth: Auth | null = firebaseApp
  ? initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) })
  : null;

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

function translateError(err: unknown): never {
  const code = (err as { code?: string }).code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':   throw new AuthEmailInUseError();
    case 'auth/invalid-email':          throw new AuthInvalidEmailError();
    case 'auth/weak-password':          throw new AuthWeakPasswordError();
    case 'auth/user-not-found':
    case 'auth/invalid-credential':     throw new AuthUserNotFoundError();
    case 'auth/wrong-password':         throw new AuthWrongPasswordError();
    case 'auth/too-many-requests':      throw new AuthTooManyRequestsError();
    case 'auth/user-disabled':          throw new AuthUserDisabledError();
    case 'auth/network-request-failed': throw new AuthNetworkError();
    default:                            throw new AuthNetworkError(String(err));
  }
}

async function createUserProfile(uid: string, displayName: string, email: string) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'users', uid), {
      profile: { displayName, email, photoURL: null, createdAt: serverTimestamp() },
    });
  } catch {
    // Non-fatal — auth succeeded even if profile write fails
  }
}

export class FirebaseAuthRepository implements AuthRepository {
  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    if (!auth) throw new AuthNetworkError('Firebase not configured');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(user.uid, displayName ?? email.split('@')[0], email);
      return toAuthUser(user);
    } catch (err) {
      translateError(err);
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!auth) throw new AuthNetworkError('Firebase not configured');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return toAuthUser(user);
    } catch (err) {
      translateError(err);
    }
  }

  async signOut(): Promise<void> {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      translateError(err);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!auth) throw new AuthNetworkError('Firebase not configured');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      translateError(err);
    }
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!auth) {
      // No Firebase — immediately signal no user so AuthContext settles to 'guest'
      setTimeout(() => callback(null), 0);
      return () => {};
    }
    return firebaseOnAuthStateChanged(auth, (user) => callback(user ? toAuthUser(user) : null));
  }
}
