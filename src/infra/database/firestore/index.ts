import { initializeFirestore } from 'firebase/firestore';
import { firebaseApp } from '../../auth/firebase/firebaseApp';

// db is null when Firebase credentials are absent (guest-only mode)
export const db = firebaseApp
  ? initializeFirestore(firebaseApp, { experimentalForceLongPolling: true })
  : null;
