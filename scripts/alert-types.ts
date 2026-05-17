export type AlertSource = 'fco' | 'state_dept';
export type AlertSeverity = 'advisory' | 'warning' | 'do_not_travel';

export interface FeedAlertDocument {
  id: string;
  source: AlertSource;
  sourceNativeId: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: 'official';
  countryId: string;
  countryName: string;
  severity: AlertSeverity;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
  lastFetchedAt: string;
  confidence: 'high';
  status: 'published';
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  previousStatus: 'draft' | 'published';
  schemaVersion: number;
}
