import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@shared/contracts/AuthRepository';
import type { ScamReportRepository } from '@shared/contracts/ScamReportRepository';
import type { CreateScamReportInput, ScamReport } from './types';

export interface ScamReportsState {
  reports: ScamReport[];
  isLoading: boolean;
  isSubmitting: boolean;
  submitReport(input: CreateScamReportInput): Promise<string>;
}

export function useScamReports(
  repository: ScamReportRepository,
  user: AuthUser | null,
): ScamReportsState {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = repository.subscribeToVisibleReports((next) => {
      setReports(next);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const submitReport = useCallback(
    async (input: CreateScamReportInput) => {
      if (!user) throw new Error('Sign in to submit a scam report');

      setIsSubmitting(true);
      try {
        return await repository.submitReport(user.uid, input);
      } finally {
        setIsSubmitting(false);
      }
    },
    [repository, user],
  );

  return { reports, isLoading, isSubmitting, submitReport };
}
