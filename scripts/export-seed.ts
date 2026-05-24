/**
 * Build-time seed export script.
 *
 * Exports all published content from Firestore into assets/seed.json and
 * updates contentManifest/current with the new exportVersion.
 *
 * Run with:
 *   npx ts-node --project scripts/tsconfig.json scripts/export-seed.ts
 *   npx ts-node --project scripts/tsconfig.json scripts/export-seed.ts --dry-run
 *
 * Requires in .env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const TOMBSTONE_RETENTION_DAYS = 90;
const SCHEMA_VERSION = 1;

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

interface TombstoneEntry {
  entityType: string;
  entityId: string;
  reason: 'archived' | 'unpublished' | 'deleted';
  tombstonedAt: string;
}

interface ContentManifest {
  exportVersion: number;
  exportedAt: string;
  schemaVersion: number;
  counts: {
    scamPatterns: number;
    alerts: number;
    emergencyNumbers: number;
    healthGuides: number;
    localLaws: number;
  };
  tombstones: TombstoneEntry[];
}

interface SeedBundle {
  exportVersion: number;
  exportedAt: string;
  schemaVersion: number;
  scamPatterns: Record<string, unknown>[];
  alerts: Record<string, unknown>[];
  emergencyNumbers: Record<string, unknown>[];
  healthGuides: Record<string, unknown>[];
  localLaws: Record<string, unknown>[];
}

function requireAdminDb(): FirebaseFirestore.Firestore {
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

function toPlain(doc: FirebaseFirestore.DocumentData): Record<string, unknown> {
  const plain: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc)) {
    if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: unknown }).toDate === 'function') {
      plain[key] = (val as admin.firestore.Timestamp).toDate().toISOString();
    } else {
      plain[key] = val;
    }
  }
  return plain;
}

async function fetchPublished(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  statusField = 'status',
): Promise<Record<string, unknown>[]> {
  const snapshot = await db
    .collection(collectionName)
    .where(statusField, '==', 'published')
    .get();
  return snapshot.docs.map((d) => ({ id: d.id, ...toPlain(d.data()) }));
}

async function fetchAll(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
): Promise<Record<string, unknown>[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((d) => ({ id: d.id, ...toPlain(d.data()) }));
}

function pruneTombstones(tombstones: TombstoneEntry[]): TombstoneEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TOMBSTONE_RETENTION_DAYS);
  return tombstones.filter((t) => new Date(t.tombstonedAt) > cutoff);
}

async function run() {
  const db = requireAdminDb();

  console.log('Fetching published content from Firestore...');

  const [scamPatterns, alerts, emergencyNumbers, healthGuides, localLaws] = await Promise.all([
    fetchPublished(db, 'scamPatterns'),
    fetchPublished(db, 'alerts'),
    fetchAll(db, 'emergencyNumbers'),
    fetchAll(db, 'healthGuides'),
    fetchAll(db, 'localLaws'),
  ]);

  console.log(`  scamPatterns: ${scamPatterns.length}`);
  console.log(`  alerts:       ${alerts.length}`);
  console.log(`  emergencyNumbers: ${emergencyNumbers.length}`);
  console.log(`  healthGuides: ${healthGuides.length}`);
  console.log(`  localLaws:    ${localLaws.length}`);

  // Read existing manifest to get current version and tombstones
  const manifestRef = db.doc('contentManifest/current');
  const manifestSnap = await manifestRef.get();
  const existingManifest = manifestSnap.exists
    ? (manifestSnap.data() as ContentManifest)
    : null;

  const prevVersion = existingManifest?.exportVersion ?? 0;
  const nextVersion = prevVersion + 1;
  const exportedAt = new Date().toISOString();

  // Prune old tombstones
  const existingTombstones = existingManifest?.tombstones ?? [];
  const tombstones = pruneTombstones(existingTombstones);

  const manifest: ContentManifest = {
    exportVersion: nextVersion,
    exportedAt,
    schemaVersion: SCHEMA_VERSION,
    counts: {
      scamPatterns: scamPatterns.length,
      alerts: alerts.length,
      emergencyNumbers: emergencyNumbers.length,
      healthGuides: healthGuides.length,
      localLaws: localLaws.length,
    },
    tombstones,
  };

  const bundle: SeedBundle = {
    exportVersion: nextVersion,
    exportedAt,
    schemaVersion: SCHEMA_VERSION,
    scamPatterns,
    alerts,
    emergencyNumbers,
    healthGuides,
    localLaws,
  };

  const outputPath = path.resolve(__dirname, '../assets/seed.json');

  if (DRY_RUN) {
    console.log('\n[dry-run] Would write:', outputPath);
    console.log('[dry-run] Manifest:', JSON.stringify(manifest, null, 2));
    console.log(`[dry-run] Bundle size: ${JSON.stringify(bundle).length} bytes`);
    return;
  }

  fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\nWrote seed bundle → ${outputPath}`);
  console.log(`  exportVersion: ${nextVersion} (was ${prevVersion})`);
  console.log(`  tombstones retained: ${tombstones.length}`);

  await manifestRef.set(manifest);
  console.log('Updated contentManifest/current in Firestore');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
