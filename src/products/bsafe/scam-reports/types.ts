export type ScamReportStatus =
  | 'submitted'
  | 'ai_triaged'
  | 'auto_published'
  | 'pending_review'
  | 'accepted'
  | 'rejected'
  | 'duplicate'
  | 'merged';

export type ScamSeverity = 'low' | 'medium' | 'high';

export interface ScamReport {
  id: string;
  title: string;
  category: string;
  description: string;
  countryId: string;
  countryName: string;
  localityText?: string;
  localityIds: string[];
  severity: ScamSeverity;
  status: ScamReportStatus;
  userId: string;
  deviceId?: string;
  photoUrl?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

export interface CreateScamReportInput {
  title: string;
  category: string;
  description: string;
  countryId: string;
  countryName: string;
  localityText?: string;
  localityIds?: string[];
  severity: ScamSeverity;
  photoUrl?: string;
}
