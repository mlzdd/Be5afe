import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@infra/database/firestore';
import type { AlertRepository } from '@shared/contracts/AlertRepository';
import type { TravelAlert } from '@products/bsafe/alerts/types';

export class FirestoreAlertRepository implements AlertRepository {
  subscribeToAlerts(callback: (alerts: TravelAlert[]) => void): () => void {
    if (!db) {
      callback([]);
      return () => {};
    }

    const alertsQuery = query(collection(db, 'alerts'), where('status', '==', 'published'));

    return onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs
        .map((doc) => doc.data() as TravelAlert)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      callback(alerts);
    });
  }
}
