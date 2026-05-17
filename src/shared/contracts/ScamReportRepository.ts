import type { CreateScamReportInput, ScamReport } from '@products/bsafe/scam-reports/types';

export interface ScamReportRepository {
  subscribeToVisibleReports(callback: (reports: ScamReport[]) => void): () => void;
  submitReport(userId: string, input: CreateScamReportInput): Promise<string>;
}
