import type {
  EmergencyNumberDocument,
  EmergencyNumberValues,
  MaybeEmergencyNumberValues,
  OfficialEmergencyNumberVerification,
} from './emergency-number-types';

export const EMERGENCY_NUMBER_SCHEMA_VERSION = 1;
export const ITU_E129_SOURCE_URL = 'https://www.itu.int/net/itu-t/inrdb/e129_important_numbers.aspx';

export function normalizeNumber(value: string | null | undefined): string | null {
  if (!value) return null;

  const first = value
    .split(/[;,/]/)
    .map((part) => part.trim())
    .find(Boolean);

  return first ? first.replace(/\s+/g, '') : null;
}

export function hasAllServices(values: MaybeEmergencyNumberValues): values is EmergencyNumberValues {
  return Boolean(values.police && values.ambulance && values.fire);
}

export function buildPublishedDocument(
  verification: OfficialEmergencyNumberVerification,
  nowIso: string,
  reviewedBy = 'system:itu_verification',
): EmergencyNumberDocument {
  return {
    id: verification.countryId,
    countryId: verification.countryId,
    countryName: verification.countryName,
    police: verification.police,
    ambulance: verification.ambulance,
    fire: verification.fire,
    sourceName: 'ITU-T E.129',
    sourceUrl: ITU_E129_SOURCE_URL,
    sourceType: 'official',
    confidence: 'high',
    status: 'published',
    retrievedAt: nowIso,
    lastReviewedAt: nowIso,
    reviewedBy,
    nextReviewAt: addYears(nowIso, 1),
    createdAt: nowIso,
    updatedAt: nowIso,
    updatedBy: reviewedBy,
    previousStatus: 'draft',
    schemaVersion: EMERGENCY_NUMBER_SCHEMA_VERSION,
  };
}

export function differsFromStored(
  stored: Partial<EmergencyNumberDocument> | undefined,
  next: EmergencyNumberDocument,
): boolean {
  if (!stored) return true;

  const stableFields: Array<keyof EmergencyNumberDocument> = [
    'id',
    'countryId',
    'countryName',
    'police',
    'ambulance',
    'fire',
    'sourceName',
    'sourceUrl',
    'sourceType',
    'confidence',
    'status',
    'reviewedBy',
    'schemaVersion',
  ];

  return stableFields.some((field) => stored[field] !== next[field]);
}

function addYears(iso: string, years: number): string {
  const date = new Date(iso);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString();
}
