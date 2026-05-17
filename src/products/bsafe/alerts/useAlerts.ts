import { useEffect, useState } from 'react';
import type { AlertRepository } from '@shared/contracts/AlertRepository';
import type { TravelAlert } from './types';

export interface AlertsState {
  alerts: TravelAlert[];
  isLoading: boolean;
}

export function useAlerts(repository: AlertRepository): AlertsState {
  const [alerts, setAlerts] = useState<TravelAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = repository.subscribeToAlerts((next) => {
      setAlerts(next);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  return { alerts, isLoading };
}
