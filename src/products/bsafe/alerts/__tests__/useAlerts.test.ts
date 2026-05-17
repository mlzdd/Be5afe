(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { renderHook, act } from '@testing-library/react-hooks';
import { useAlerts } from '../useAlerts';
import type { AlertRepository } from '@shared/contracts/AlertRepository';
import type { TravelAlert } from '../types';

const ALERT: TravelAlert = {
  id: 'fco-1',
  source: 'fco',
  countryId: 'JO',
  countryName: 'Jordan',
  severity: 'warning',
  title: 'Jordan travel advice',
  summary: 'Regional escalation.',
  body: 'Read the latest warnings.',
  publishedAt: '2026-04-14T15:32:53Z',
  sourceUrl: 'https://www.gov.uk/foreign-travel-advice/jordan',
};

function makeRepo(alerts: TravelAlert[]): AlertRepository {
  return {
    subscribeToAlerts(callback) {
      setTimeout(() => callback(alerts), 0);
      return () => {};
    },
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe('useAlerts', () => {
  it('loads alerts from the repository subscription', async () => {
    const { result } = renderHook(() => useAlerts(makeRepo([ALERT])));

    expect(result.current.isLoading).toBe(true);
    await flush();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.alerts).toEqual([ALERT]);
  });
});
