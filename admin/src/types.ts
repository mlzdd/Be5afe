export type PatternStatus = 'draft' | 'published' | 'needs_review' | 'disputed' | 'archived';
export type ReportStatus =
  | 'submitted'
  | 'ai_triaged'
  | 'auto_published'
  | 'pending_review'
  | 'accepted'
  | 'rejected'
  | 'duplicate'
  | 'merged';
export type AlertSeverity = 'advisory' | 'warning' | 'do_not_travel';

export interface AuditFields {
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  previousStatus?: string;
}

export interface ScamPattern extends AuditFields {
  id: string;
  title?: string;
  countryId?: string;
  status: PatternStatus;
  nextReviewAt?: string;
  sourceName?: string;
}

export interface ScamReport extends AuditFields {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  countryId?: string;
  countryName?: string;
  localityText?: string;
  severity?: string;
  submittedAt?: string;
  status: ReportStatus;
}

export interface EmergencyNumber extends AuditFields {
  id: string;
  countryId: string;
  countryName: string;
  police: string;
  ambulance: string;
  fire: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface Alert extends AuditFields {
  id: string;
  countryId: string;
  countryName: string;
  source: 'fco' | 'dfat' | 'state_dept' | 'bsafe_editorial';
  severity: AlertSeverity;
  title: string;
  summary?: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  expiresAt?: string;
}
