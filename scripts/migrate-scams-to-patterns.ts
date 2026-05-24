/**
 * Migrate legacy `scams` documents into canonical `scamPatterns` documents.
 * Run with:
 *   npx ts-node --project scripts/tsconfig.json scripts/migrate-scams-to-patterns.ts
 *   npx ts-node --project scripts/tsconfig.json scripts/migrate-scams-to-patterns.ts --dry-run
 *
 * Requires in .env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

interface LegacyScamDocument {
  id?: string;
  countryId?: string;
  countryName?: string;
  title?: string;
  description?: string;
  prevention?: string;
  severity?: string;
  updatedAt?: unknown;
  [key: string]: unknown;
}

interface ScamPatternDocument extends LegacyScamDocument {
  id: string;
  status: 'published';
  schemaVersion: 1;
  sourceType: 'editorial';
  sourceName: 'bsafe_legacy_repo';
  confidence: 'medium';
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: 'migration';
  previousStatus: 'draft';
}

type MigrationResult = {
  created: number;
  updated: number;
  skipped: number;
};

function initialiseDb(): FirebaseFirestore.Firestore {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Firebase Admin credentials in .env');
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  return admin.firestore();
}

function toIsoString(value: unknown, fallbackIso: string): string {
  if (!value) return fallbackIso;

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallbackIso : parsed.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallbackIso : value.toISOString();
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  return fallbackIso;
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

function sixMonthsFromTodayIso(now = new Date()): string {
  const reviewDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  reviewDate.setUTCMonth(reviewDate.getUTCMonth() + 6);
  return reviewDate.toISOString();
}

function buildPatternDocument(
  sourceId: string,
  source: LegacyScamDocument,
  nowIso: string,
  nextReviewAt: string,
): ScamPatternDocument {
  return {
    ...source,
    id: sourceId,
    status: 'published',
    schemaVersion: 1,
    sourceType: 'editorial',
    sourceName: 'bsafe_legacy_repo',
    confidence: 'medium',
    nextReviewAt,
    createdAt: toIsoString(source.updatedAt, nowIso),
    updatedAt: nowIso,
    updatedBy: 'migration',
    previousStatus: 'draft',
  };
}

function differsFromStored(
  stored: Partial<ScamPatternDocument> | undefined,
  next: ScamPatternDocument,
): boolean {
  if (!stored) return true;

  const comparableStored = comparableContent(stored);
  const comparableNext = comparableContent(next);
  return JSON.stringify(comparableStored) !== JSON.stringify(comparableNext);
}

function comparableContent(document: Partial<ScamPatternDocument>): Record<string, unknown> {
  const normalized = normalizeForComparison(document) as Record<string, unknown>;
  delete normalized.updatedAt;
  return normalized;
}

function normalizeForComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeForComparison((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

async function migrateScamsToPatterns(
  db: FirebaseFirestore.Firestore,
  dryRun: boolean,
): Promise<MigrationResult> {
  const nowIso = new Date().toISOString();
  const nextReviewAt = sixMonthsFromTodayIso();
  const result: MigrationResult = { created: 0, updated: 0, skipped: 0 };
  const sourceSnapshot = await db.collection('scams').get();

  for (const sourceDoc of sourceSnapshot.docs) {
    const pattern = buildPatternDocument(
      sourceDoc.id,
      sourceDoc.data() as LegacyScamDocument,
      nowIso,
      nextReviewAt,
    );
    const patternRef = db.collection('scamPatterns').doc(sourceDoc.id);
    const patternSnapshot = await patternRef.get();
    const stored = patternSnapshot.exists
      ? (patternSnapshot.data() as Partial<ScamPatternDocument>)
      : undefined;

    if (!differsFromStored(stored, pattern)) {
      result.skipped += 1;
      continue;
    }

    if (patternSnapshot.exists) {
      result.updated += 1;
    } else {
      result.created += 1;
    }

    if (!dryRun) {
      await patternRef.set(pattern, { merge: true });
    }
  }

  return result;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = initialiseDb();

  console.log(`\nMigrating scams to scamPatterns in Firebase project: ${FIREBASE_PROJECT_ID}`);
  if (dryRun) {
    console.log('Dry run only. No Firestore writes will be made.');
  }

  const result = await migrateScamsToPatterns(db, dryRun);
  console.log(`created ${result.created}, updated ${result.updated}, skipped ${result.skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Scam pattern migration failed:', error);
    process.exit(1);
  });
