export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Typed domain errors — Firebase error codes never cross this boundary
export class AuthEmailInUseError extends Error { readonly code = 'email-in-use' as const; }
export class AuthInvalidEmailError extends Error { readonly code = 'invalid-email' as const; }
export class AuthWeakPasswordError extends Error { readonly code = 'weak-password' as const; }
export class AuthUserNotFoundError extends Error { readonly code = 'user-not-found' as const; }
export class AuthWrongPasswordError extends Error { readonly code = 'wrong-password' as const; }
export class AuthTooManyRequestsError extends Error { readonly code = 'too-many-requests' as const; }
export class AuthNetworkError extends Error { readonly code = 'network' as const; }
export class AuthUserDisabledError extends Error { readonly code = 'user-disabled' as const; }

export type AuthError =
  | AuthEmailInUseError
  | AuthInvalidEmailError
  | AuthWeakPasswordError
  | AuthUserNotFoundError
  | AuthWrongPasswordError
  | AuthTooManyRequestsError
  | AuthNetworkError
  | AuthUserDisabledError;

export interface AuthRepository {
  signUp(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
