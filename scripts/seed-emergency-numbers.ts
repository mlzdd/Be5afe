/**
 * Seed high-confidence emergency-number records into Firestore.
 * Run with:
 *   npm run seed:emergency-numbers
 *   npm run seed:emergency-numbers -- --write
 *
 * Requires in .env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 * Pipeline:
 *   1. fetch broad country-level emergency-number coverage from Wikidata
 *   2. apply the manually reviewed ITU-T E.129 launch-priority verification set
 *   3. publish only ITU-verified records as `confidence: 'high'`
 *   4. upsert by ISO alpha-2 country ID with read-before-write idempotency
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import { ITU_VERIFIED_TOP_40 } from './emergency-number-verifications';
import {
  buildPublishedDocument,
  differsFromStored,
  normalizeNumber,
} from './emergency-number-utils';
import type { EmergencyNumberDocument, WikidataEmergencyNumberRecord } from './emergency-number-types';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIDATA_QUERY = `
SELECT ?country ?countryLabel ?iso2 ?emergencyNumber WHERE {
  ?country wdt:P31/wdt:P279* wd:Q6256;
           wdt:P297 ?iso2;
           wdt:P2852 ?emergencyNumberItem.
  ?emergencyNumberItem wdt:P1329 ?emergencyNumber.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;

interface WikidataBinding {
  countryLabel?: { value?: string };
  iso2?: { value?: string };
  emergencyNumber?: { value?: string };
}

interface WikidataResponse {
  results?: {
    bindings?: WikidataBinding[];
  };
}

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

const SPOT_CHECK_COUNTRY_IDS = ['US', 'GB', 'FR', 'TH', 'JP', 'AU', 'CA', 'BR', 'IN', 'ZA'] as const;

async function fetchWikidataEmergencyNumbers(): Promise<Map<string, WikidataEmergencyNumberRecord>> {
  const url = new URL(WIKIDATA_ENDPOINT);
  url.searchParams.set('query', WIKIDATA_QUERY);
  url.searchParams.set('format', 'json');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'Be5afe emergency-number seeder/1.0 (contact: admin@be5afe.app)',
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata query failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as WikidataResponse;
  const records = new Map<string, WikidataEmergencyNumberRecord>();

  for (const binding of payload.results?.bindings ?? []) {
    const countryId = binding.iso2?.value?.toUpperCase();
    const countryName = binding.countryLabel?.value;
    const emergencyNumber = normalizeNumber(binding.emergencyNumber?.value);

    if (!countryId || !countryName || !emergencyNumber) {
      continue;
    }

    const existing = records.get(countryId);
    records.set(countryId, {
      countryId,
      countryName,
      genericNumbers: existing
        ? Array.from(new Set([...existing.genericNumbers, emergencyNumber]))
        : [emergencyNumber],
    });
  }

  return records;
}

async function initialiseDb(): Promise<FirebaseFirestore.Firestore> {
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

async function upsertVerifiedRecords(
  db: FirebaseFirestore.Firestore,
  records: EmergencyNumberDocument[],
): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const ref = db.collection('emergencyNumbers').doc(record.id);
    const snapshot = await ref.get();
    const stored = snapshot.exists ? (snapshot.data() as Partial<EmergencyNumberDocument>) : undefined;

    if (!differsFromStored(stored, record)) {
      skipped += 1;
      continue;
    }

    await ref.set(
      snapshot.exists
        ? {
            ...record,
            createdAt: stored?.createdAt ?? record.createdAt,
            previousStatus: stored?.status === 'published' ? 'published' : 'draft',
          }
        : record,
      { merge: true },
    );

    if (snapshot.exists) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated, skipped };
}

async function verifyStoredRecords(
  db: FirebaseFirestore.Firestore,
  expectedRecords: EmergencyNumberDocument[],
): Promise<void> {
  const byId = new Map(expectedRecords.map((record) => [record.id, record]));

  for (const countryId of SPOT_CHECK_COUNTRY_IDS) {
    const expected = byId.get(countryId);
    if (!expected) {
      throw new Error(`Missing expected spot-check record for ${countryId}`);
    }

    const snapshot = await db.collection('emergencyNumbers').doc(countryId).get();
    if (!snapshot.exists) {
      throw new Error(`Spot-check failed: ${countryId} was not written`);
    }

    const stored = snapshot.data() as Partial<EmergencyNumberDocument>;
    if (
      stored.police !== expected.police ||
      stored.ambulance !== expected.ambulance ||
      stored.fire !== expected.fire ||
      stored.confidence !== 'high'
    ) {
      throw new Error(`Spot-check failed: stored values for ${countryId} did not match expected values`);
    }
  }
}

async function main() {
  const nowIso = new Date().toISOString();
  const shouldWrite = process.argv.includes('--write');

  console.log('\nFetching Wikidata emergency-number seed data...');
  const wikidataRecords = await fetchWikidataEmergencyNumbers();
  console.log(`Fetched ${wikidataRecords.size} complete Wikidata records.`);

  const publishable: EmergencyNumberDocument[] = [];
  const missingFromWikidataSeed: string[] = [];

  for (const verification of ITU_VERIFIED_TOP_40) {
    const wikidataRecord = wikidataRecords.get(verification.countryId);

    if (!wikidataRecord) {
      missingFromWikidataSeed.push(verification.countryId);
    }

    publishable.push(buildPublishedDocument(verification, nowIso));
  }

  console.log(`Verified ${publishable.length}/${ITU_VERIFIED_TOP_40.length} launch-priority countries.`);

  if (missingFromWikidataSeed.length > 0) {
    console.warn(
      `Wikidata seed is missing ${missingFromWikidataSeed.length} ITU-verified countries: ${missingFromWikidataSeed.join(', ')}`,
    );
  }

  if (publishable.length === 0) {
    throw new Error('No high-confidence emergency-number records were eligible for publication.');
  }

  if (!shouldWrite) {
    console.log('Dry run only. Re-run with --write to seed Firestore.');
    return;
  }

  const db = await initialiseDb();
  const result = await upsertVerifiedRecords(db, publishable);
  await verifyStoredRecords(db, publishable);

  console.log(
    `✅ emergencyNumbers seed complete — created ${result.created}, updated ${result.updated}, skipped ${result.skipped}.`,
  );
  console.log(`✅ Spot-checked ${SPOT_CHECK_COUNTRY_IDS.length} stored emergency-number records.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Emergency-number seed failed:', error);
    process.exit(1);
  });
