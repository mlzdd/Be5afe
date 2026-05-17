import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import { firebaseApp } from '../../auth/firebase/firebaseApp';

// db is null when Firebase credentials are absent (guest-only mode)
export const db = firebaseApp
  ? Platform.OS === 'android'
    ? initializeFirestore(firebaseApp, { experimentalForceLongPolling: true })
    : getFirestore(firebaseApp)
  : null;
