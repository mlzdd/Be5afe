/**
 * Ingest official US State Department travel advisories from RSS.
 * Run with:
 *   npm run ingest:alerts:state-dept
 *   npm run ingest:alerts:state-dept -- --write
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import {
  buildStateDeptAlertDocument,
  differsFromStoredAlert,
  resolveCountryId,
} from './alert-utils';
import type { FeedAlertDocument } from './alert-types';

const RSS_URL = 'https://travel.state.gov/_res/rss/TAsTWs.xml';
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

interface StateDeptFeedItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
}

async function fetchRssItems(): Promise<StateDeptFeedItem[]> {
  const response = await fetch(RSS_URL, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9',
      'User-Agent': 'Be5afe State Department alert ingestor/1.0 (contact: admin@be5afe.app)',
    },
  });

  if (!response.ok) {
    throw new Error(`RSS request failed: ${response.status} ${response.statusText}`);
  }

  return parseRss(await response.text());
}

export function parseRss(xml: string): StateDeptFeedItem[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match) => match[1])
    .map((itemXml) => ({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      guid: extractTag(itemXml, 'guid'),
      pubDate: extractTag(itemXml, 'pubDate'),
      description: extractTag(itemXml, 'description'),
    }))
    .filter((item) => item.title && item.link && item.guid && item.pubDate);
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return (match?.[1] ?? '').trim().replace(/^<!\[CDATA\[|\]\]>$/g, '');
}

function normalizeFeedItem(item: StateDeptFeedItem, nowIso: string): FeedAlertDocument | null {
  const countryName = countryNameFromTitle(item.title);
  const countryId = resolveCountryId(countryName);
  if (!countryId) return null;

  const parsedDate = new Date(item.pubDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return buildStateDeptAlertDocument({
    guid: item.guid,
    link: item.link,
    title: item.title,
    countryId,
    countryName,
    descriptionHtml: item.description,
    publishedAt: parsedDate.toISOString(),
    nowIso,
  });
}

function countryNameFromTitle(title: string): string {
  return title
    .replace(/\s+-\s+Level\s+\d+.*$/i, '')
    .replace(/\s+Travel Advisory$/i, '')
    .trim();
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

async function cleanupLegacyHashedAlerts(
  db: FirebaseFirestore.Firestore,
  canonicalAlerts: FeedAlertDocument[],
): Promise<number> {
  const canonicalIds = new Set(canonicalAlerts.map((alert) => alert.id));
  const snapshot = await db.collection('alerts').where('source', '==', 'state_dept').get();
  let deleted = 0;

  for (const doc of snapshot.docs) {
    if (canonicalIds.has(doc.id)) continue;
    await doc.ref.delete();
    deleted += 1;
  }

  return deleted;
}

async function main() {
  const nowIso = new Date().toISOString();
  const shouldWrite = process.argv.includes('--write');

  console.log('\nFetching official US State Department RSS feed...');
  const items = await fetchRssItems();
  const alerts = items
    .map((item) => normalizeFeedItem(item, nowIso))
    .filter((item): item is FeedAlertDocument => item !== null);

  console.log(`Fetched ${items.length} RSS items; normalized ${alerts.length} into Be5afe alerts.`);

  if (alerts.length === 0) {
    throw new Error('No State Department alerts could be normalized.');
  }

  if (!shouldWrite) {
    console.log('Dry run only. Re-run with --write to ingest alerts into Firestore.');
    return;
  }

  const db = await initialiseDb();
  const result = await upsertAlerts(db, alerts);
  const deletedLegacy = process.argv.includes('--cleanup-legacy')
    ? await cleanupLegacyHashedAlerts(db, alerts)
    : 0;
  console.log(
    `✅ State Department alert ingest complete — created ${result.created}, updated ${result.updated}, refreshed ${result.refreshed}.`,
  );
  if (deletedLegacy > 0) {
    console.log(`✅ Removed ${deletedLegacy} legacy duplicate State Department alerts.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('State Department alert ingest failed:', error);
    process.exit(1);
  });
