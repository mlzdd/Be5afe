/**
 * Ingest official UK FCDO travel-advice alerts from GOV.UK.
 * Run with:
 *   npm run ingest:alerts:fco
 *   npm run ingest:alerts:fco -- --write
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import {
  buildFcoAlertDocument,
  differsFromStoredAlert,
  resolveCountryId,
} from './alert-utils';
import type { FeedAlertDocument } from './alert-types';

const SEARCH_URL =
  'https://www.gov.uk/api/search.json?filter_content_store_document_type=travel_advice&count=1500';

interface SearchResult {
  link: string;
}

interface SearchResponse {
  results?: SearchResult[];
}

interface FcoContentItem {
  content_id: string;
  base_path: string;
  title: string;
  description: string;
  public_updated_at?: string;
  first_published_at?: string;
  details?: {
    alert_status?: string[];
    change_description?: string;
    country?: {
      name?: string;
      synonyms?: string[];
    };
    parts?: Array<{
      slug?: string;
      body?: string;
    }>;
    reviewed_at?: string;
    updated_at?: string;
  };
}

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

const SPOT_CHECK_COUNTRY_IDS = ['US', 'AE', 'TH', 'JO'] as const;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Be5afe FCO alert ingestor/1.0 (contact: admin@be5afe.app)',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
  }

  return (await response.json()) as T;
}

async function fetchFcoContentItems(): Promise<FcoContentItem[]> {
  const search = await fetchJson<SearchResponse>(SEARCH_URL);
  const results = search.results ?? [];
  const items: FcoContentItem[] = [];

  for (const result of results) {
    if (!result.link.startsWith('/foreign-travel-advice/')) continue;
    items.push(await fetchJson<FcoContentItem>(`https://www.gov.uk/api/content${result.link}`));
  }

  return items;
}

function normalizeFcoContentItem(item: FcoContentItem, nowIso: string): FeedAlertDocument | null {
  const countryName = item.details?.country?.name;
  const synonyms = item.details?.country?.synonyms ?? [];
  const countryId = countryName ? resolveCountryId(countryName, synonyms) : null;

  if (!countryName || !countryId) return null;

  const warningsPart = item.details?.parts?.find((part) => part.slug === 'warnings-and-insurance');
  const publishedAt =
    item.details?.updated_at ??
    item.details?.reviewed_at ??
    item.public_updated_at ??
    item.first_published_at;

  if (!publishedAt) return null;

  return buildFcoAlertDocument({
    contentId: item.content_id,
    basePath: item.base_path,
    title: item.title,
    countryId,
    countryName,
    alertStatuses: item.details?.alert_status ?? [],
    summary: item.details?.change_description ?? item.description,
    bodyHtml: warningsPart?.body,
    publishedAt,
    nowIso,
  });
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

async function upsertAlerts(
  db: FirebaseFirestore.Firestore,
  alerts: FeedAlertDocument[],
): Promise<{ created: number; updated: number; refreshed: number }> {
  let created = 0;
  let updated = 0;
  let refreshed = 0;

  for (const alert of alerts) {
    const ref = db.collection('alerts').doc(alert.id);
    const snapshot = await ref.get();
    const stored = snapshot.exists ? (snapshot.data() as Partial<FeedAlertDocument>) : undefined;

    if (!snapshot.exists) {
      await ref.set(alert);
      created += 1;
      continue;
    }

    if (differsFromStoredAlert(stored, alert)) {
      await ref.set(
        {
          ...alert,
          createdAt: stored?.createdAt ?? alert.createdAt,
          previousStatus: stored?.status === 'published' ? 'published' : 'draft',
        },
        { merge: true },
      );
      updated += 1;
      continue;
    }

    await ref.set({ lastFetchedAt: alert.lastFetchedAt }, { merge: true });
    refreshed += 1;
  }

  return { created, updated, refreshed };
}

async function verifyStoredAlerts(
  db: FirebaseFirestore.Firestore,
  alerts: FeedAlertDocument[],
): Promise<void> {
  const byCountryId = new Map(alerts.map((alert) => [alert.countryId, alert]));

  for (const countryId of SPOT_CHECK_COUNTRY_IDS) {
    const expected = byCountryId.get(countryId);
    if (!expected) {
      throw new Error(`Missing normalized alert for spot-check country ${countryId}`);
    }

    const snapshot = await db.collection('alerts').doc(expected.id).get();
    if (!snapshot.exists) {
      throw new Error(`Spot-check failed: ${expected.id} was not written`);
    }

    const stored = snapshot.data() as Partial<FeedAlertDocument>;
    if (
      stored.countryId !== expected.countryId ||
      stored.severity !== expected.severity ||
      stored.source !== 'fco' ||
      stored.status !== 'published'
    ) {
      throw new Error(`Spot-check failed: stored alert ${expected.id} did not match expectations`);
    }
  }
}

async function main() {
  const nowIso = new Date().toISOString();
  const shouldWrite = process.argv.includes('--write');

  console.log('\nFetching official UK FCDO travel-advice records...');
  const items = await fetchFcoContentItems();
  const normalized = items
    .map((item) => normalizeFcoContentItem(item, nowIso))
    .filter((item): item is FeedAlertDocument => item !== null);

  console.log(`Fetched ${items.length} official records; normalized ${normalized.length} into Be5afe alerts.`);

  if (normalized.length === 0) {
    throw new Error('No FCO alerts could be normalized.');
  }

  if (!shouldWrite) {
    console.log('Dry run only. Re-run with --write to ingest alerts into Firestore.');
    return;
  }

  const db = await initialiseDb();
  const result = await upsertAlerts(db, normalized);
  await verifyStoredAlerts(db, normalized);
  console.log(
    `✅ FCO alert ingest complete — created ${result.created}, updated ${result.updated}, refreshed ${result.refreshed}.`,
  );
  console.log(`✅ Spot-checked ${SPOT_CHECK_COUNTRY_IDS.length} stored FCO alerts.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('FCO alert ingest failed:', error);
    process.exit(1);
  });
