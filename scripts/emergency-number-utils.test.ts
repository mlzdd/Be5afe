import {
  buildPublishedDocument,
  differsFromStored,
  hasAllServices,
  normalizeNumber,
} from './emergency-number-utils';
import type { OfficialEmergencyNumberVerification } from './emergency-number-types';

describe('emergency-number-utils', () => {
  const official: OfficialEmergencyNumberVerification = {
    countryId: 'GB',
    countryName: 'United Kingdom',
    police: '999',
    ambulance: '999',
    fire: '999',
  };

  it('normalizes the first usable emergency number token', () => {
    expect(normalizeNumber(' 999 ; 112 ')).toBe('999');
    expect(normalizeNumber('')).toBeNull();
  });

  it('requires all emergency services before a record is considered complete', () => {
    expect(hasAllServices({ police: '999', ambulance: '999', fire: '999' })).toBe(true);
    expect(hasAllServices({ police: '999', ambulance: '999' })).toBe(false);
  });

  it('builds a high-confidence published document with a one-year review window', () => {
    const doc = buildPublishedDocument(official, '2026-05-17T00:00:00.000Z');

    expect(doc.id).toBe('GB');
    expect(doc.confidence).toBe('high');
    expect(doc.sourceType).toBe('official');
    expect(doc.status).toBe('published');
    expect(doc.nextReviewAt).toBe('2027-05-17T00:00:00.000Z');
  });

  it('ignores volatile timestamps when deciding whether a stored record changed', () => {
    const doc = buildPublishedDocument(official, '2026-05-17T00:00:00.000Z');
    const stored = {
      ...doc,
      retrievedAt: '2026-01-01T00:00:00.000Z',
      lastReviewedAt: '2026-01-01T00:00:00.000Z',
      nextReviewAt: '2027-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(differsFromStored(stored, doc)).toBe(false);
    expect(differsFromStored({ ...stored, police: '112' }, doc)).toBe(true);
  });
});
