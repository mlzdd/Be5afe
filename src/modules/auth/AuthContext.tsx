import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthRepository, AuthUser } from '@shared/contracts/AuthRepository';
import {
  AuthEmailInUseError, AuthInvalidEmailError, AuthWeakPasswordError,
  AuthUserNotFoundError, AuthWrongPasswordError, AuthTooManyRequestsError,
  AuthNetworkError, AuthUserDisabledError,
} from '@shared/contracts/AuthRepository';

// Guest session — user chose to skip sign-in
export type Session =
  | { kind: 'loading' }
  | { kind: 'guest' }
  | { kind: 'authenticated'; user: AuthUser };

interface AuthContextValue {
  session: Session;
  error: string | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function errorToMessage(err: unknown): string {
  if (err instanceof AuthEmailInUseError)    return 'This email is already registered.';
  if (err instanceof AuthInvalidEmailError)  return 'Invalid email address.';
  if (err instanceof AuthWeakPasswordError)  return 'Password must be at least 6 characters.';
  if (err instanceof AuthUserNotFoundError)  return 'No account found with this email.';
  if (err instanceof AuthWrongPasswordError) return 'Incorrect password.';
  if (err instanceof AuthTooManyRequestsError) return 'Too many attempts. Try again later.';
  if (err instanceof AuthUserDisabledError)  return 'This account has been disabled.';
  if (err instanceof AuthNetworkError)       return 'Network error. Check your connection.';
  return 'An error occurred. Please try again.';
}

interface Props {
  repository: AuthRepository;
  children: ReactNode;
}

export function AuthProvider({ repository, children }: Props) {
  const [session, setSession] = useState<Session>({ kind: 'loading' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return repository.onAuthStateChanged((user) => {
      setSession(user ? { kind: 'authenticated', user } : { kind: 'guest' });
    });
  }, [repository]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const user = await repository.signUp(email, password, displayName);
      setSession({ kind: 'authenticated', user });
    } catch (err) {
      setError(errorToMessage(err));
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const user = await repository.signIn(email, password);
      setSession({ kind: 'authenticated', user });
    } catch (err) {
      setError(errorToMessage(err));
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await repository.signOut();
      setSession({ kind: 'guest' });
    } catch (err) {
      setError(errorToMessage(err));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await repository.resetPassword(email);
    } catch (err) {
      setError(errorToMessage(err));
      throw err;
    }
  };

  const continueAsGuest = () => setSession({ kind: 'guest' });
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ session, error, signUp, signIn, signOut, resetPassword, continueAsGuest, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
