(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { act, renderHook } from '@testing-library/react-native';
import type { AuthUser } from '@shared/contracts/AuthRepository';
import type { ScamReportRepository } from '@shared/contracts/ScamReportRepository';
import { useScamReports } from '../useScamReports';
import type { CreateScamReportInput, ScamReport } from '../types';

const USER: AuthUser = { uid: 'user-1', email: 'dex@example.com', displayName: 'Dex' };
const INPUT: CreateScamReportInput = {
  title: 'Meter refused',
  category: 'taxi',
  description: 'Driver refused the meter and quoted triple fare.',
  countryId: 'TH',
  countryName: 'Thailand',
  localityText: 'Bangkok',
  severity: 'medium',
};
const REPORT: ScamReport = {
  id: 'report-1',
  ...INPUT,
  localityIds: [],
  status: 'accepted',
  userId: USER.uid,
  submittedAt: '2026-05-17T10:00:00.000Z',
  createdAt: '2026-05-17T10:00:00.000Z',
  updatedAt: '2026-05-17T10:00:00.000Z',
  schemaVersion: 1,
};

function makeRepo(): ScamReportRepository {
  return {
    subscribeToVisibleReports(callback) {
      setTimeout(() => callback([REPORT]), 0);
      return () => {};
    },
    submitReport: jest.fn(async () => 'report-2'),
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe('useScamReports', () => {
  it('loads visible reports and submits through the repository for authenticated users', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useScamReports(repo, USER));

    expect(result.current.isLoading).toBe(true);
    await flush();
    expect(result.current.reports).toEqual([REPORT]);

    await act(async () => {
      await expect(result.current.submitReport(INPUT)).resolves.toBe('report-2');
    });

    expect(repo.submitReport).toHaveBeenCalledWith(USER.uid, INPUT);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('rejects guest submissions before touching the repository', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useScamReports(repo, null));

    await expect(result.current.submitReport(INPUT)).rejects.toThrow('Sign in to submit a scam report');
    expect(repo.submitReport).not.toHaveBeenCalled();
  });
});
