import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth, hasFirebaseConfig } from './firebase';
import { Shell, type AdminPage } from './components/Shell';
import { ScamPatternsPage } from './pages/ScamPatternsPage';
import { ModerationQueuePage } from './pages/ModerationQueuePage';
import { StaleContentPage } from './pages/StaleContentPage';
import { EmergencyNumbersPage } from './pages/EmergencyNumbersPage';
import { AlertsPage } from './pages/AlertsPage';

type AuthState =
  | { kind: 'loading' }
  | { kind: 'signed_out' }
  | { kind: 'forbidden'; user: User }
  | { kind: 'admin'; user: User };

export function App() {
  const [authState, setAuthState] = useState<AuthState>({ kind: 'loading' });
  const [page, setPage] = useState<AdminPage>('patterns');

  useEffect(() => {
    if (!auth) {
      setAuthState({ kind: 'signed_out' });
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ kind: 'signed_out' });
        return;
      }

      const token = await user.getIdTokenResult(true);
      setAuthState(token.claims.admin === true ? { kind: 'admin', user } : { kind: 'forbidden', user });
    });
  }, []);

  if (!hasFirebaseConfig) return <p className="notice">Firebase is not configured for the admin portal.</p>;
  if (authState.kind === 'loading') return <p className="notice">Loading…</p>;
  if (authState.kind === 'signed_out') return <SignInForm />;
  if (authState.kind === 'forbidden') {
    return (
      <div className="notice">
        <p>This account is signed in but does not have the admin claim.</p>
        <button onClick={() => auth && signOut(auth)}>Sign out</button>
      </div>
    );
  }

  return (
    <Shell activePage={page} onNavigate={setPage}>
      <div className="toolbar">
        <span>{authState.user.email}</span>
        <button onClick={() => auth && signOut(auth)}>Sign out</button>
      </div>
      {page === 'patterns' && <ScamPatternsPage actorId={authState.user.uid} />}
      {page === 'moderation' && <ModerationQueuePage actorId={authState.user.uid} />}
      {page === 'stale' && <StaleContentPage />}
      {page === 'emergency' && <EmergencyNumbersPage actorId={authState.user.uid} />}
      {page === 'alerts' && <AlertsPage actorId={authState.user.uid} />}
    </Shell>
  );
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Sign-in failed');
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Be5afe Admin</h1>
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
      {error && <p>{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  );
}
