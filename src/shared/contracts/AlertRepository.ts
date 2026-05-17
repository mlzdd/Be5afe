import type { TravelAlert } from '@products/bsafe/alerts/types';

export interface AlertRepository {
  subscribeToAlerts(callback: (alerts: TravelAlert[]) => void): () => void;
}
