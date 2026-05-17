export type EmergencyService = 'police' | 'ambulance' | 'fire';

export interface EmergencyNumberValues {
  police: string;
  ambulance: string;
  fire: string;
}

export type MaybeEmergencyNumberValues = {
  [K in keyof EmergencyNumberValues]?: string | null;
};

export interface WikidataEmergencyNumberRecord {
  countryId: string;
  countryName: string;
  genericNumbers: string[];
}

export interface OfficialEmergencyNumberVerification extends EmergencyNumberValues {
  countryId: string;
  countryName: string;
}

export interface EmergencyNumberDocument extends EmergencyNumberValues {
  id: string;
  countryId: string;
  countryName: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: 'official';
  confidence: 'high';
  status: 'published';
  retrievedAt: string;
  lastReviewedAt: string;
  reviewedBy: string;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  previousStatus: 'draft' | 'published';
  schemaVersion: number;
}
